"""Booking routes — HTTP handling only, delegates to booking_service."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import BookingCreate, BookingOut, QuoteOut, QuoteRequest
from app.services import booking_service

router = APIRouter(prefix="/api/v1", tags=["bookings"])


def _require_user(x_demo_user_id: Optional[str] = Header(None)) -> int:
    if not x_demo_user_id:
        raise HTTPException(status_code=401, detail="X-Demo-User-Id header required")
    try:
        return int(x_demo_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid X-Demo-User-Id")


@router.post("/bookings/quote", response_model=QuoteOut)
def get_quote(data: QuoteRequest, db: Session = Depends(get_db)):
    return booking_service.get_quote(db, data.listing_id, data.check_in, data.check_out, data.guest_count)


@router.post("/bookings", response_model=BookingOut, status_code=201)
def create_booking(
    data: BookingCreate,
    user_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    booking = booking_service.create_booking(
        db, data.listing_id, user_id, data.check_in, data.check_out, data.guest_count
    )
    return _enrich_booking(booking)


@router.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    requester_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    booking = crud.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != requester_id and booking.listing.host_id != requester_id:
        raise HTTPException(status_code=403, detail="You do not have access to this booking")
    return _enrich_booking(booking)


@router.get("/users/{user_id}/bookings", response_model=List[BookingOut])
def get_user_bookings(
    user_id: int,
    requester_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    if requester_id != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own bookings")
    bookings = crud.get_user_bookings(db, user_id)
    return [_enrich_booking(b) for b in bookings]


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    user_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    booking = crud.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != user_id:
        raise HTTPException(status_code=403, detail="You can only cancel your own bookings")
    booking = crud.cancel_booking(db, booking)
    return _enrich_booking(booking)


def _enrich_booking(booking) -> BookingOut:
    """Convert booking ORM object to BookingOut, attaching a listing card."""
    from app.services.listing_service import build_listing_card
    from app.schemas import ListingCardOut

    listing_card = None
    if booking.listing:
        listing_card = ListingCardOut(**build_listing_card(booking.listing))

    return BookingOut(
        id=booking.id,
        listing_id=booking.listing_id,
        guest_id=booking.guest_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guest_count=booking.guest_count,
        nightly_rate=booking.nightly_rate,
        number_of_nights=booking.number_of_nights,
        subtotal=booking.subtotal,
        cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee,
        total_amount=booking.total_amount,
        status=booking.status.value if hasattr(booking.status, "value") else booking.status,
        created_at=booking.created_at,
        listing=listing_card,
    )
