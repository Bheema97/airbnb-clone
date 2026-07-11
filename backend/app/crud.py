"""Database query functions (repository layer). No business logic here."""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from sqlalchemy import and_, or_, func, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Amenity,
    BlockedDate,
    Booking,
    BookingStatus,
    Favorite,
    Listing,
    ListingAmenity,
    ListingImage,
    ListingStatus,
    Review,
    User,
)


# ── User ─────────────────────────────────────────────────────────────────


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.scalar(select(User).where(User.email == email))


# ── Listing ───────────────────────────────────────────────────────────────


def get_listing(db: Session, listing_id: int) -> Optional[Listing]:
    return db.scalar(
        select(Listing)
        .options(
            selectinload(Listing.images),
            selectinload(Listing.amenities).selectinload(ListingAmenity.amenity),
            selectinload(Listing.host),
            selectinload(Listing.reviews).selectinload(Review.author),
        )
        .where(Listing.id == listing_id)
    )


def get_listings(
    db: Session,
    *,
    location: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    property_type: Optional[str] = None,
    amenity_ids: Optional[List[int]] = None,
    min_rating: Optional[float] = None,
    sort: str = "recommended",
    page: int = 1,
    page_size: int = 12,
) -> tuple[List[Listing], int]:
    """Return (items, total_count) with all filters applied."""
    q = (
        select(Listing)
        .options(selectinload(Listing.images))
        .where(Listing.status == ListingStatus.active)
    )

    if location:
        loc = f"%{location.lower()}%"
        q = q.where(
            or_(
                func.lower(Listing.city).like(loc),
                func.lower(Listing.state).like(loc),
                func.lower(Listing.country).like(loc),
            )
        )

    if guests:
        q = q.where(Listing.max_guests >= guests)

    if min_price is not None:
        q = q.where(Listing.price_per_night >= min_price)

    if max_price is not None:
        q = q.where(Listing.price_per_night <= max_price)

    if property_type:
        q = q.where(func.lower(Listing.property_type) == property_type.lower())

    if min_rating is not None:
        q = q.where(Listing.rating_average >= min_rating)

    if amenity_ids:
        for aid in amenity_ids:
            q = q.where(
                Listing.id.in_(
                    select(ListingAmenity.listing_id).where(ListingAmenity.amenity_id == aid)
                )
            )

    # Exclude unavailable listings when dates given
    if check_in and check_out:
        booked_listing_ids = select(Booking.listing_id).where(
            and_(
                Booking.status == BookingStatus.confirmed,
                Booking.check_in < check_out,
                Booking.check_out > check_in,
            )
        )
        blocked_listing_ids = select(BlockedDate.listing_id).where(
            and_(
                BlockedDate.start_date < check_out,
                BlockedDate.end_date > check_in,
            )
        )
        q = q.where(Listing.id.not_in(booked_listing_ids))
        q = q.where(Listing.id.not_in(blocked_listing_ids))

    # Sorting
    if sort == "price_asc":
        q = q.order_by(Listing.price_per_night.asc())
    elif sort == "price_desc":
        q = q.order_by(Listing.price_per_night.desc())
    elif sort == "rating":
        q = q.order_by(Listing.rating_average.desc())
    else:
        q = q.order_by(Listing.id.asc())  # "recommended" — stable default

    total = db.scalar(select(func.count()).select_from(q.subquery()))
    items = db.scalars(q.offset((page - 1) * page_size).limit(page_size)).all()
    return list(items), total or 0


def create_listing(db: Session, host_id: int, data: dict, image_data: list, amenity_ids: list) -> Listing:
    listing = Listing(host_id=host_id, **data)
    db.add(listing)
    db.flush()  # get listing.id before adding children

    for img in image_data:
        db.add(ListingImage(listing_id=listing.id, **img))

    for aid in amenity_ids:
        db.add(ListingAmenity(listing_id=listing.id, amenity_id=aid))

    db.commit()
    db.refresh(listing)
    return listing


def update_listing(db: Session, listing: Listing, updates: dict, image_data: Optional[list], amenity_ids: Optional[list]) -> Listing:
    for key, val in updates.items():
        setattr(listing, key, val)

    if image_data is not None:
        # Replace images
        for img in listing.images:
            db.delete(img)
        db.flush()
        for img in image_data:
            db.add(ListingImage(listing_id=listing.id, **img))

    if amenity_ids is not None:
        for la in listing.amenities:
            db.delete(la)
        db.flush()
        for aid in amenity_ids:
            db.add(ListingAmenity(listing_id=listing.id, amenity_id=aid))

    db.commit()
    db.refresh(listing)
    return listing


def get_host_listings(db: Session, host_id: int) -> List[Listing]:
    return list(
        db.scalars(
            select(Listing)
            .options(selectinload(Listing.images))
            .where(Listing.host_id == host_id)
            .order_by(Listing.created_at.desc())
        ).all()
    )


# ── Availability ──────────────────────────────────────────────────────────


def get_confirmed_bookings_for_listing(db: Session, listing_id: int) -> List[Booking]:
    return list(
        db.scalars(
            select(Booking).where(
                and_(
                    Booking.listing_id == listing_id,
                    Booking.status == BookingStatus.confirmed,
                )
            )
        ).all()
    )


def get_blocked_dates_for_listing(db: Session, listing_id: int) -> List[BlockedDate]:
    return list(
        db.scalars(select(BlockedDate).where(BlockedDate.listing_id == listing_id)).all()
    )


def check_availability(
    db: Session,
    listing_id: int,
    check_in: date,
    check_out: date,
) -> bool:
    """Return True if the range [check_in, check_out) is fully available."""
    booking_conflict = db.scalar(
        select(Booking).where(
            and_(
                Booking.listing_id == listing_id,
                Booking.status == BookingStatus.confirmed,
                Booking.check_in < check_out,
                Booking.check_out > check_in,
            )
        )
    )
    if booking_conflict:
        return False

    blocked_conflict = db.scalar(
        select(BlockedDate).where(
            and_(
                BlockedDate.listing_id == listing_id,
                BlockedDate.start_date < check_out,
                BlockedDate.end_date > check_in,
            )
        )
    )
    return blocked_conflict is None


# ── Booking ───────────────────────────────────────────────────────────────


def create_booking(db: Session, data: dict) -> Booking:
    booking = Booking(**data)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def get_booking(db: Session, booking_id: int) -> Optional[Booking]:
    return db.scalar(
        select(Booking)
        .options(selectinload(Booking.listing).selectinload(Listing.images))
        .where(Booking.id == booking_id)
    )


def get_user_bookings(db: Session, user_id: int) -> List[Booking]:
    return list(
        db.scalars(
            select(Booking)
            .options(selectinload(Booking.listing).selectinload(Listing.images))
            .where(Booking.guest_id == user_id)
            .order_by(Booking.check_in.desc())
        ).all()
    )


def get_host_bookings(db: Session, host_id: int) -> List[Booking]:
    """Return all bookings for listings owned by the given host."""
    return list(
        db.scalars(
            select(Booking)
            .join(Listing, Booking.listing_id == Listing.id)
            .options(
                selectinload(Booking.listing).selectinload(Listing.images),
                selectinload(Booking.guest),
            )
            .where(Listing.host_id == host_id)
            .order_by(Booking.check_in.desc())
        ).all()
    )


def cancel_booking(db: Session, booking: Booking) -> Booking:
    booking.status = BookingStatus.cancelled
    db.commit()
    db.refresh(booking)
    return booking


def has_future_confirmed_bookings(db: Session, listing_id: int) -> bool:
    from datetime import date as dt_date
    today = dt_date.today()
    result = db.scalar(
        select(Booking).where(
            and_(
                Booking.listing_id == listing_id,
                Booking.status == BookingStatus.confirmed,
                Booking.check_out > today,
            )
        )
    )
    return result is not None


# ── Favorite ──────────────────────────────────────────────────────────────


def get_favorites(db: Session, user_id: int) -> List[Favorite]:
    return list(
        db.scalars(
            select(Favorite)
            .options(selectinload(Favorite.listing).selectinload(Listing.images))
            .where(Favorite.user_id == user_id)
        ).all()
    )


def get_favorite(db: Session, user_id: int, listing_id: int) -> Optional[Favorite]:
    return db.scalar(
        select(Favorite).where(
            and_(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
        )
    )


def add_favorite(db: Session, user_id: int, listing_id: int) -> Favorite:
    fav = Favorite(user_id=user_id, listing_id=listing_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


def remove_favorite(db: Session, fav: Favorite) -> None:
    db.delete(fav)
    db.commit()


# ── Review ────────────────────────────────────────────────────────────────


def get_listing_reviews(db: Session, listing_id: int) -> List[Review]:
    return list(
        db.scalars(
            select(Review)
            .options(selectinload(Review.author))
            .where(Review.listing_id == listing_id)
            .order_by(Review.created_at.desc())
        ).all()
    )


# ── Amenity ───────────────────────────────────────────────────────────────


def get_all_amenities(db: Session) -> List[Amenity]:
    return list(db.scalars(select(Amenity)).all())
