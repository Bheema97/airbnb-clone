"""Pydantic v2 schemas for all API request and response shapes."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


# ── Shared ───────────────────────────────────────────────────────────────


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── User ─────────────────────────────────────────────────────────────────


class UserOut(OrmBase):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None
    role: str
    created_at: datetime


# ── Amenity ──────────────────────────────────────────────────────────────


class AmenityOut(OrmBase):
    id: int
    name: str
    category: str


# ── Listing Image ─────────────────────────────────────────────────────────


class ListingImageOut(OrmBase):
    id: int
    image_url: str
    display_order: int
    alt_text: Optional[str] = None


# ── Listing ───────────────────────────────────────────────────────────────


class ListingCardOut(OrmBase):
    """Lightweight representation for listing grid cards."""
    id: int
    title: str
    city: str
    state: str
    country: str
    property_type: str
    room_type: str
    price_per_night: float
    rating_average: float
    review_count: int
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    status: str
    cover_image: Optional[str] = None  # first image URL, computed by service


class ListingDetailOut(OrmBase):
    """Full representation for the listing detail page."""
    id: int
    title: str
    description: str
    city: str
    state: str
    country: str
    property_type: str
    room_type: str
    price_per_night: float
    cleaning_fee: float
    service_fee_percentage: float
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    rating_average: float
    review_count: int
    status: str
    host: UserOut
    images: List[ListingImageOut] = []
    amenities: List[AmenityOut] = []
    created_at: datetime
    updated_at: datetime


class ListingImageIn(BaseModel):
    image_url: str
    display_order: int = 0
    alt_text: Optional[str] = None

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be a valid http or https URL")
        return v


class ListingCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20)
    property_type: str
    room_type: str
    city: str
    state: str
    country: str
    price_per_night: float = Field(..., gt=0)
    cleaning_fee: float = Field(0.0, ge=0)
    service_fee_percentage: float = Field(0.14, ge=0, le=1)
    max_guests: int = Field(..., ge=1)
    bedrooms: int = Field(1, ge=0)
    beds: int = Field(1, ge=1)
    bathrooms: float = Field(1.0, ge=0.5)
    images: List[ListingImageIn] = Field(..., min_length=1)
    amenity_ids: List[int] = []


class ListingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=20)
    property_type: Optional[str] = None
    room_type: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    price_per_night: Optional[float] = Field(None, gt=0)
    cleaning_fee: Optional[float] = Field(None, ge=0)
    service_fee_percentage: Optional[float] = Field(None, ge=0, le=1)
    max_guests: Optional[int] = Field(None, ge=1)
    bedrooms: Optional[int] = Field(None, ge=0)
    beds: Optional[int] = Field(None, ge=1)
    bathrooms: Optional[float] = Field(None, ge=0.5)
    images: Optional[List[ListingImageIn]] = None
    amenity_ids: Optional[List[int]] = None
    status: Optional[Literal["active", "archived"]] = None


# ── Pagination ───────────────────────────────────────────────────────────


class PaginatedListings(BaseModel):
    items: List[ListingCardOut]
    page: int
    page_size: int
    total_items: int
    total_pages: int


# ── Availability ─────────────────────────────────────────────────────────


class DateRange(BaseModel):
    start: date
    end: date


class AvailabilityOut(BaseModel):
    listing_id: int
    booked_ranges: List[DateRange]
    blocked_ranges: List[DateRange]


# ── Booking ───────────────────────────────────────────────────────────────


class QuoteRequest(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guest_count: int = Field(..., ge=1)


class QuoteOut(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guest_count: int
    nightly_rate: float
    number_of_nights: int
    subtotal: float
    cleaning_fee: float
    service_fee: float
    total_amount: float
    is_available: bool
    unavailability_reason: Optional[str] = None


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guest_count: int = Field(..., ge=1)


class BookingOut(OrmBase):
    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guest_count: int
    nightly_rate: float
    number_of_nights: int
    subtotal: float
    cleaning_fee: float
    service_fee: float
    total_amount: float
    status: str
    created_at: datetime
    listing: Optional[ListingCardOut] = None


# ── Review ────────────────────────────────────────────────────────────────


class ReviewOut(OrmBase):
    id: int
    listing_id: int
    guest_id: int
    rating: int
    comment: str
    created_at: datetime
    author: Optional[UserOut] = None


# ── Favorite ─────────────────────────────────────────────────────────────


class FavoriteOut(OrmBase):
    user_id: int
    listing_id: int
    created_at: datetime
    listing: Optional[ListingCardOut] = None


# ── Host booking summary ──────────────────────────────────────────────────


class HostBookingSummary(OrmBase):
    id: int
    listing_id: int
    listing_title: Optional[str] = None
    guest_id: int
    guest_name: Optional[str] = None
    check_in: date
    check_out: date
    guest_count: int
    total_amount: float
    status: str
    created_at: datetime
