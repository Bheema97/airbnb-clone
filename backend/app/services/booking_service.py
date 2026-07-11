"""Business logic for bookings: validation, price calculation, conflict checking."""
from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.schemas import QuoteOut


def _round2(value: float) -> float:
    """Round to 2 decimal places using ROUND_HALF_UP for monetary values."""
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def calculate_price(
    nightly_rate: float,
    number_of_nights: int,
    cleaning_fee: float,
    service_fee_percentage: float,
) -> dict:
    subtotal = _round2(nightly_rate * number_of_nights)
    service_fee = _round2(subtotal * service_fee_percentage)
    total_amount = _round2(subtotal + cleaning_fee + service_fee)
    return {
        "nightly_rate": _round2(nightly_rate),
        "number_of_nights": number_of_nights,
        "subtotal": subtotal,
        "cleaning_fee": _round2(cleaning_fee),
        "service_fee": service_fee,
        "total_amount": total_amount,
    }


def get_quote(db: Session, listing_id: int, check_in: date, check_out: date, guest_count: int) -> QuoteOut:
    listing = crud.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    _validate_dates(check_in, check_out)

    if listing.status != "active":
        return QuoteOut(
            listing_id=listing_id,
            check_in=check_in,
            check_out=check_out,
            guest_count=guest_count,
            nightly_rate=listing.price_per_night,
            number_of_nights=0,
            subtotal=0,
            cleaning_fee=listing.cleaning_fee,
            service_fee=0,
            total_amount=0,
            is_available=False,
            unavailability_reason="Listing is not available for booking",
        )

    if guest_count < 1:
        raise HTTPException(status_code=422, detail="Guest count must be at least 1")

    if guest_count > listing.max_guests:
        raise HTTPException(
            status_code=422,
            detail=f"Guest count {guest_count} exceeds listing capacity of {listing.max_guests}",
        )

    number_of_nights = (check_out - check_in).days
    pricing = calculate_price(
        listing.price_per_night,
        number_of_nights,
        listing.cleaning_fee,
        listing.service_fee_percentage,
    )

    is_available = crud.check_availability(db, listing_id, check_in, check_out)
    return QuoteOut(
        listing_id=listing_id,
        check_in=check_in,
        check_out=check_out,
        guest_count=guest_count,
        is_available=is_available,
        unavailability_reason=None if is_available else "Selected dates are not available",
        **pricing,
    )


def create_booking(db: Session, listing_id: int, guest_id: int, check_in: date, check_out: date, guest_count: int):
    listing = crud.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    _validate_dates(check_in, check_out)

    if not crud.get_user(db, guest_id):
        raise HTTPException(status_code=404, detail="Guest user not found")

    if listing.status != "active":
        raise HTTPException(status_code=409, detail="Listing is not available for booking")

    if guest_count < 1:
        raise HTTPException(status_code=422, detail="Guest count must be at least 1")

    if guest_count > listing.max_guests:
        raise HTTPException(
            status_code=422,
            detail=f"Guest count {guest_count} exceeds listing capacity of {listing.max_guests}",
        )

    if not crud.check_availability(db, listing_id, check_in, check_out):
        raise HTTPException(status_code=409, detail="Selected dates are not available")

    number_of_nights = (check_out - check_in).days
    pricing = calculate_price(
        listing.price_per_night,
        number_of_nights,
        listing.cleaning_fee,
        listing.service_fee_percentage,
    )

    booking_data = {
        "listing_id": listing_id,
        "guest_id": guest_id,
        "check_in": check_in,
        "check_out": check_out,
        "guest_count": guest_count,
        **pricing,
        "status": "confirmed",
    }
    return crud.create_booking(db, booking_data)


def _validate_dates(check_in: date, check_out: date) -> None:
    today = date.today()
    if check_in < today:
        raise HTTPException(status_code=422, detail="check_in cannot be in the past")
    if check_out <= check_in:
        raise HTTPException(status_code=422, detail="check_out must be after check_in")
