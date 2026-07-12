"""
Resource Booking routes.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.resource_booking import BookingCreate, BookingResponse
from app.schemas.common import PaginatedResponse
from app.services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["Resource Bookings"])


@router.get("", response_model=PaginatedResponse[BookingResponse], summary="List bookings")
async def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all bookings. All authenticated users."""
    service = BookingService(db)
    bookings, total = await service.list_bookings(skip=skip, limit=limit)
    return PaginatedResponse(
        items=[service.to_response(b) for b in bookings], total=total, skip=skip, limit=limit
    )


@router.post("", response_model=BookingResponse, status_code=201, summary="Book resource")
async def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Book a shared resource. All authenticated users.
    Returns 409 Conflict if booking overlaps with existing reservation.
    """
    service = BookingService(db)
    booking = await service.create_booking(data, booked_by=current_user.id)
    return service.to_response(booking)


@router.get("/{booking_id}", response_model=BookingResponse, summary="Get booking")
async def get_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get booking details."""
    service = BookingService(db)
    booking = await service.get_booking(booking_id)
    return service.to_response(booking)


@router.patch("/{booking_id}/cancel", response_model=BookingResponse, summary="Cancel booking")
async def cancel_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a booking. User can cancel their own bookings."""
    service = BookingService(db)
    booking = await service.cancel_booking(booking_id, cancelled_by=current_user.id)
    return service.to_response(booking)


@router.get(
    "/resource/{asset_id}",
    response_model=list[BookingResponse],
    summary="Calendar view for resource",
)
async def get_resource_calendar(
    asset_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all bookings for a specific resource (calendar view)."""
    service = BookingService(db)
    bookings = await service.get_resource_bookings(asset_id, skip=skip, limit=limit)
    return [service.to_response(b) for b in bookings]
