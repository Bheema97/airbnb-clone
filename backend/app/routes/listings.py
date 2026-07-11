"""Listing routes — HTTP handling only, delegates to services and crud."""
from __future__ import annotations

import math
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import (
    AmenityOut,
    AvailabilityOut,
    DateRange,
    HostBookingSummary,
    ListingCardOut,
    ListingCreate,
    ListingDetailOut,
    ListingUpdate,
    PaginatedListings,
    ReviewOut,
)
from app.services import listing_service

router = APIRouter(prefix="/api/v1", tags=["listings"])


def _require_user(x_demo_user_id: Optional[str] = Header(None)) -> int:
    if not x_demo_user_id:
        raise HTTPException(status_code=401, detail="X-Demo-User-Id header required")
    try:
        return int(x_demo_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid X-Demo-User-Id")


# ── Listing search ────────────────────────────────────────────────────────


@router.get("/listings", response_model=PaginatedListings)
def list_listings(
    location: Optional[str] = Query(None),
    check_in: Optional[str] = Query(None),
    check_out: Optional[str] = Query(None),
    guests: Optional[int] = Query(None, ge=1),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    property_type: Optional[str] = Query(None),
    amenities: Optional[str] = Query(None, description="Comma-separated amenity IDs"),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    sort: Literal["recommended", "price_asc", "price_desc", "rating"] = Query("recommended"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    from datetime import date as dt_date
    if bool(check_in) != bool(check_out):
        raise HTTPException(status_code=422, detail="check_in and check_out must be supplied together")
    try:
        ci = dt_date.fromisoformat(check_in) if check_in else None
        co = dt_date.fromisoformat(check_out) if check_out else None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Dates must use YYYY-MM-DD format") from exc
    if ci and co and co <= ci:
        raise HTTPException(status_code=422, detail="check_out must be after check_in")
    if ci and ci < dt_date.today():
        raise HTTPException(status_code=422, detail="check_in cannot be in the past")
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=422, detail="min_price cannot exceed max_price")
    try:
        amenity_ids = [int(a) for a in amenities.split(",") if a.strip()] if amenities else None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="amenities must be comma-separated numeric IDs") from exc

    items, total = crud.get_listings(
        db,
        location=location,
        check_in=ci,
        check_out=co,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
        property_type=property_type,
        amenity_ids=amenity_ids,
        min_rating=min_rating,
        sort=sort,
        page=page,
        page_size=page_size,
    )

    cards = [listing_service.build_listing_card(l) for l in items]
    return PaginatedListings(
        items=[ListingCardOut(**c) for c in cards],
        page=page,
        page_size=page_size,
        total_items=total,
        total_pages=math.ceil(total / page_size),
    )


# ── Listing detail ────────────────────────────────────────────────────────


@router.get("/listings/{listing_id}", response_model=ListingDetailOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = crud.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    amenities_out = [AmenityOut.model_validate(la.amenity) for la in listing.amenities]

    data = {
        "id": listing.id,
        "title": listing.title,
        "description": listing.description,
        "city": listing.city,
        "state": listing.state,
        "country": listing.country,
        "property_type": listing.property_type,
        "room_type": listing.room_type,
        "price_per_night": listing.price_per_night,
        "cleaning_fee": listing.cleaning_fee,
        "service_fee_percentage": listing.service_fee_percentage,
        "max_guests": listing.max_guests,
        "bedrooms": listing.bedrooms,
        "beds": listing.beds,
        "bathrooms": listing.bathrooms,
        "rating_average": listing.rating_average,
        "review_count": listing.review_count,
        "status": listing.status.value if hasattr(listing.status, "value") else listing.status,
        "host": listing.host,
        "images": listing.images,
        "amenities": amenities_out,
        "created_at": listing.created_at,
        "updated_at": listing.updated_at,
    }
    return ListingDetailOut.model_validate(data)


# ── Availability ──────────────────────────────────────────────────────────


@router.get("/listings/{listing_id}/availability", response_model=AvailabilityOut)
def get_availability(listing_id: int, db: Session = Depends(get_db)):
    listing = crud.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    bookings = crud.get_confirmed_bookings_for_listing(db, listing_id)
    blocked = crud.get_blocked_dates_for_listing(db, listing_id)

    return AvailabilityOut(
        listing_id=listing_id,
        booked_ranges=[DateRange(start=b.check_in, end=b.check_out) for b in bookings],
        blocked_ranges=[DateRange(start=bd.start_date, end=bd.end_date) for bd in blocked],
    )


@router.get("/listings/{listing_id}/reviews", response_model=List[ReviewOut])
def get_listing_reviews(listing_id: int, db: Session = Depends(get_db)):
    if not crud.get_listing(db, listing_id):
        raise HTTPException(status_code=404, detail="Listing not found")
    return crud.get_listing_reviews(db, listing_id)


# ── Create listing ────────────────────────────────────────────────────────


@router.post("/listings", response_model=ListingDetailOut, status_code=201)
def create_listing(
    data: ListingCreate,
    user_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    listing = listing_service.create_listing(db, user_id, data)
    return get_listing(listing.id, db)


# ── Update listing ────────────────────────────────────────────────────────


@router.patch("/listings/{listing_id}", response_model=ListingDetailOut)
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    user_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    listing_service.update_listing(db, listing_id, user_id, data)
    return get_listing(listing_id, db)


# ── Delete/archive listing ────────────────────────────────────────────────


@router.delete("/listings/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    user_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    listing_service.delete_listing(db, listing_id, user_id)


# ── Host listings ─────────────────────────────────────────────────────────


@router.get("/hosts/{host_id}/listings", response_model=List[ListingCardOut])
def get_host_listings(
    host_id: int,
    requester_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    if requester_id != host_id:
        raise HTTPException(status_code=403, detail="You can only view your own listings")
    user = crud.get_user(db, host_id)
    if not user or user.role.value not in ("host", "both"):
        raise HTTPException(status_code=403, detail="Only hosts can view host listings")
    listings = crud.get_host_listings(db, host_id)
    return [ListingCardOut(**listing_service.build_listing_card(l)) for l in listings]


# ── Host bookings ─────────────────────────────────────────────────────────


@router.get("/hosts/{host_id}/bookings", response_model=List[HostBookingSummary])
def get_host_bookings(
    host_id: int,
    user_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    if user_id != host_id:
        raise HTTPException(status_code=403, detail="You can only view your own bookings")
    bookings = crud.get_host_bookings(db, host_id)
    result = []
    for b in bookings:
        result.append(
            HostBookingSummary(
                id=b.id,
                listing_id=b.listing_id,
                listing_title=b.listing.title if b.listing else None,
                guest_id=b.guest_id,
                guest_name=b.guest.name if b.guest else None,
                check_in=b.check_in,
                check_out=b.check_out,
                guest_count=b.guest_count,
                total_amount=b.total_amount,
                status=b.status.value if hasattr(b.status, "value") else b.status,
                created_at=b.created_at,
            )
        )
    return result


# ── Amenities ─────────────────────────────────────────────────────────────


@router.get("/amenities", response_model=List[AmenityOut])
def list_amenities(db: Session = Depends(get_db)):
    return crud.get_all_amenities(db)


# ── Users ─────────────────────────────────────────────────────────────────

from app.schemas import UserOut  # noqa: E402


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    """Return all seeded demo users for the user switcher."""
    from sqlalchemy import select
    from app.models import User
    return list(db.scalars(select(User).order_by(User.id)).all())


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
