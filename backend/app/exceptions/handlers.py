"""
Centralized exception definitions and FastAPI exception handlers.
Ensures consistent error response format across the entire API.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


# ---------------------------------------------------------------------------
# Custom exception classes
# ---------------------------------------------------------------------------
class AppException(Exception):
    """Base application exception."""

    def __init__(self, message: str, status_code: int = 400, detail: str | None = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found", detail: str | None = None):
        super().__init__(message=message, status_code=404, detail=detail)


class ConflictException(AppException):
    """Conflict — e.g., asset already allocated, booking overlap."""

    def __init__(self, message: str = "Conflict", detail: str | None = None, data: dict | None = None):
        super().__init__(message=message, status_code=409, detail=detail)
        self.data = data


class ForbiddenException(AppException):
    """User lacks permission."""

    def __init__(self, message: str = "Forbidden", detail: str | None = None):
        super().__init__(message=message, status_code=403, detail=detail)


class BadRequestException(AppException):
    """Invalid request data or business rule violation."""

    def __init__(self, message: str = "Bad request", detail: str | None = None):
        super().__init__(message=message, status_code=400, detail=detail)


class UnauthorizedException(AppException):
    """Authentication failure."""

    def __init__(self, message: str = "Unauthorized", detail: str | None = None):
        super().__init__(message=message, status_code=401, detail=detail)


# ---------------------------------------------------------------------------
# Register handlers on the FastAPI app
# ---------------------------------------------------------------------------
def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        response = {
            "success": False,
            "message": exc.message,
        }
        if exc.detail:
            response["detail"] = exc.detail
        if isinstance(exc, ConflictException) and exc.data:
            response["data"] = exc.data
        return JSONResponse(status_code=exc.status_code, content=response)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            field = " → ".join(str(loc) for loc in error["loc"])
            errors.append({"field": field, "message": error["msg"]})
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Validation error",
                "errors": errors,
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # Never expose internal details in production
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "An internal server error occurred",
            },
        )
