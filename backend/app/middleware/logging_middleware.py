"""
Request logging middleware.
Logs method, path, status code, and response time.
Never logs passwords, tokens, or sensitive data.
"""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("assetflow")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs every request with timing information."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()

        # Process request
        response: Response = await call_next(request)

        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Log — never include auth headers or body content
        logger.info(
            "%s %s → %d (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )

        return response
