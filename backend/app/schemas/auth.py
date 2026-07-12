"""
Authentication DTOs: signup, login, and token response.
"""

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    """Signup creates an Employee account only — no role selection."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    phone: str | None = Field(None, max_length=20)


class LoginRequest(BaseModel):
    """Email + password login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token returned after successful login."""
    access_token: str
    token_type: str = "bearer"


class PasswordResetRequest(BaseModel):
    """Forgot password — request reset."""
    email: EmailStr


class PasswordChangeRequest(BaseModel):
    """Change password (authenticated user)."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
