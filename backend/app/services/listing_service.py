"""Business logic for listing operations."""
from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.models import Listing, ListingStatus, UserRole
from app.schemas import ListingCreate, ListingUpdate


def _require_host(db: Session, user_id: int) -> None:
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in (UserRole.host, UserRole.both):
        raise HTTPException(status_code=403, detail="Only hosts can manage listings")


def build_listing_card(listing: Listing) -> dict:
    cover = listing.images[0].image_url if listing.images else None
    return {
        "id": listing.id,
        "title": listing.title,
        "city": listing.city,
        "state": listing.state,
        "country": listing.country,
        "property_type": listing.property_type,
        "room_type": listing.room_type,
        "price_per_night": listing.price_per_night,
        "rating_average": listing.rating_average,
        "review_count": listing.review_count,
        "max_guests": listing.max_guests,
        "bedrooms": listing.bedrooms,
        "beds": listing.beds,
        "bathrooms": listing.bathrooms,
        "status": listing.status.value if hasattr(listing.status, "value") else listing.status,
        "cover_image": cover,
    }


def create_listing(db: Session, host_id: int, data: ListingCreate) -> Listing:
    _require_host(db, host_id)

    listing_data = data.model_dump(exclude={"images", "amenity_ids"})
    image_data = [img.model_dump() for img in data.images]
    return crud.create_listing(db, host_id, listing_data, image_data, data.amenity_ids)


def update_listing(db: Session, listing_id: int, host_id: int, data: ListingUpdate) -> Listing:
    _require_host(db, host_id)
    listing = crud.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != host_id:
        raise HTTPException(status_code=403, detail="You do not own this listing")

    # If archiving/deleting and there are future confirmed bookings, force archive
    updates = data.model_dump(exclude_none=True, exclude={"images", "amenity_ids"})
    image_data = [img.model_dump() for img in data.images] if data.images is not None else None
    return crud.update_listing(db, listing, updates, image_data, data.amenity_ids)


def delete_listing(db: Session, listing_id: int, host_id: int) -> None:
    _require_host(db, host_id)
    listing = crud.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != host_id:
        raise HTTPException(status_code=403, detail="You do not own this listing")

    if crud.has_future_confirmed_bookings(db, listing_id):
        # Archive instead of delete
        listing.status = ListingStatus.archived
        db.commit()
    else:
        db.delete(listing)
        db.commit()
