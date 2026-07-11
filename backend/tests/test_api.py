"""
Focused backend tests covering all 17 required scenarios.
Run with: pytest tests/ -v
"""
import pytest
from datetime import date, timedelta

from tests.conftest import make_listing
from app.models import BlockedDate, Booking, BookingStatus, Favorite, ListingStatus, User, UserRole


TODAY = date.today()
TOMORROW = TODAY + timedelta(days=1)
IN_3 = TODAY + timedelta(days=3)
IN_5 = TODAY + timedelta(days=5)
IN_7 = TODAY + timedelta(days=7)
IN_10 = TODAY + timedelta(days=10)
IN_14 = TODAY + timedelta(days=14)
IN_20 = TODAY + timedelta(days=20)


# ── 1. Listing pagination ──────────────────────────────────────────────────


def test_listing_pagination(client, db, host_user):
    for i in range(5):
        make_listing(db, host_user.id, city=f"City{i}")
    r = client.get("/api/v1/listings?page=1&page_size=3")
    assert r.status_code == 200
    data = r.json()
    assert data["page"] == 1
    assert data["page_size"] == 3
    assert data["total_items"] == 5
    assert data["total_pages"] == 2
    assert len(data["items"]) == 3


# ── 2. Location filtering ──────────────────────────────────────────────────


def test_location_filter(client, db, host_user):
    make_listing(db, host_user.id, city="Barcelona")
    make_listing(db, host_user.id, city="Tokyo")
    r = client.get("/api/v1/listings?location=barcelona")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["city"] == "Barcelona"


# ── 3. Price filtering ────────────────────────────────────────────────────


def test_price_filter(client, db, host_user):
    make_listing(db, host_user.id, price=50.0)
    make_listing(db, host_user.id, price=200.0)
    make_listing(db, host_user.id, price=500.0)
    r = client.get("/api/v1/listings?min_price=100&max_price=300")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["price_per_night"] == 200.0


# ── 4. Guest-capacity filtering ───────────────────────────────────────────


def test_guest_capacity_filter(client, db, host_user):
    make_listing(db, host_user.id, max_guests=2)
    make_listing(db, host_user.id, max_guests=6)
    r = client.get("/api/v1/listings?guests=5")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["max_guests"] == 6


# ── 5. Unavailable listings excluded from date search ────────────────────


def test_unavailable_listing_excluded_from_search(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    # Create a confirmed booking for IN_5 to IN_10
    booking = Booking(
        listing_id=listing.id, guest_id=guest_user.id,
        check_in=IN_5, check_out=IN_10, guest_count=2,
        nightly_rate=100.0, number_of_nights=5,
        subtotal=500.0, cleaning_fee=20.0, service_fee=70.0,
        total_amount=590.0, status=BookingStatus.confirmed,
    )
    db.add(booking)
    db.commit()

    # Searching overlapping dates should return 0 listings
    r = client.get(f"/api/v1/listings?check_in={IN_7}&check_out={IN_14}")
    assert r.status_code == 200
    assert r.json()["total_items"] == 0
    assert r.json()["total_pages"] == 0

    # Adjacent range (IN_10 to IN_14) should NOT be excluded
    r2 = client.get(f"/api/v1/listings?check_in={IN_10}&check_out={IN_14}")
    assert r2.status_code == 200
    assert r2.json()["total_items"] == 1


# ── 6. Availability endpoint output ──────────────────────────────────────


def test_availability_endpoint(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    booking = Booking(
        listing_id=listing.id, guest_id=guest_user.id,
        check_in=IN_5, check_out=IN_10, guest_count=1,
        nightly_rate=100.0, number_of_nights=5,
        subtotal=500.0, cleaning_fee=20.0, service_fee=70.0,
        total_amount=590.0, status=BookingStatus.confirmed,
    )
    blocked = BlockedDate(listing_id=listing.id, start_date=IN_14, end_date=IN_20, reason="Maintenance")
    db.add_all([booking, blocked])
    db.commit()

    r = client.get(f"/api/v1/listings/{listing.id}/availability")
    assert r.status_code == 200
    data = r.json()
    assert len(data["booked_ranges"]) == 1
    assert data["booked_ranges"][0]["start"] == str(IN_5)
    assert data["booked_ranges"][0]["end"] == str(IN_10)
    assert len(data["blocked_ranges"]) == 1
    assert data["blocked_ranges"][0]["start"] == str(IN_14)


# ── 7. Correct price quote ────────────────────────────────────────────────


def test_price_quote(client, db, host_user):
    listing = make_listing(db, host_user.id, price=100.0)
    # price=100, cleaning=20, service_pct=14%, nights=5
    # subtotal=500, service=70, total=590
    payload = {"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 2}
    r = client.post("/api/v1/bookings/quote", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["nightly_rate"] == 100.0
    assert data["number_of_nights"] == 5
    assert data["subtotal"] == 500.0
    assert data["cleaning_fee"] == 20.0
    assert data["service_fee"] == 70.0
    assert data["total_amount"] == 590.0
    assert data["is_available"] is True


# ── 8. Normal booking ─────────────────────────────────────────────────────


def test_normal_booking(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    payload = {"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 2}
    r = client.post("/api/v1/bookings", json=payload, headers={"X-Demo-User-Id": str(guest_user.id)})
    assert r.status_code == 201
    data = r.json()
    assert data["status"] == "confirmed"
    assert data["number_of_nights"] == 5


# ── 9. Adjacent booking accepted ─────────────────────────────────────────


def test_adjacent_booking_accepted(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    # First booking IN_5 to IN_10
    r1 = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 1}, headers=headers)
    assert r1.status_code == 201
    # Adjacent booking starting exactly at IN_10 — should be accepted
    r2 = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_10), "check_out": str(IN_14), "guest_count": 1}, headers=headers)
    assert r2.status_code == 201


# ── 10. Partial overlap rejected ─────────────────────────────────────────


def test_partial_overlap_rejected(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 1}, headers=headers)
    # Overlaps from IN_7 to IN_14 — partial overlap
    r = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_7), "check_out": str(IN_14), "guest_count": 1}, headers=headers)
    assert r.status_code == 409


# ── 11. Contained overlap rejected ───────────────────────────────────────


def test_contained_overlap_rejected(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_14), "guest_count": 1}, headers=headers)
    # Contained within IN_5 to IN_14
    r = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_7), "check_out": str(IN_10), "guest_count": 1}, headers=headers)
    assert r.status_code == 409


# ── 12. Identical range rejected ─────────────────────────────────────────


def test_identical_range_rejected(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 1}, headers=headers)
    r = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 1}, headers=headers)
    assert r.status_code == 409


# ── 13. Blocked date rejected ─────────────────────────────────────────────


def test_blocked_date_rejected(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    blocked = BlockedDate(listing_id=listing.id, start_date=IN_5, end_date=IN_10, reason="Maintenance")
    db.add(blocked)
    db.commit()
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    r = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 1}, headers=headers)
    assert r.status_code == 409


# ── 14. Excessive guests rejected ────────────────────────────────────────


def test_excessive_guests_rejected(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id, max_guests=2)
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    r = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 5}, headers=headers)
    assert r.status_code == 422


# ── 15. Cancelled booking releases dates ─────────────────────────────────


def test_cancelled_booking_releases_dates(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    r1 = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 1}, headers=headers)
    booking_id = r1.json()["id"]

    # Cancel it
    client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=headers)

    # Now the same dates should be bookable again
    r2 = client.post("/api/v1/bookings", json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 1}, headers=headers)
    assert r2.status_code == 201


# ── 16. Host ownership enforced ───────────────────────────────────────────


def test_host_ownership_enforced(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    # Guest trying to delete host's listing
    r = client.delete(f"/api/v1/listings/{listing.id}", headers={"X-Demo-User-Id": str(guest_user.id)})
    assert r.status_code in (403, 404)  # 403 forbidden


# ── 17. Duplicate favorite prevented ─────────────────────────────────────


def test_duplicate_favorite_prevented(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    r1 = client.post(f"/api/v1/users/{guest_user.id}/favorites/{listing.id}", headers=headers)
    assert r1.status_code == 201
    r2 = client.post(f"/api/v1/users/{guest_user.id}/favorites/{listing.id}", headers=headers)
    assert r2.status_code == 409


# ── Phase 3 host lifecycle ───────────────────────────────────────────────


def test_host_listings_are_private(client, db, host_user):
    other_host = User(name="Other Host", email="other@test.com", role=UserRole.host)
    db.add(other_host)
    db.commit()
    r = client.get(
        f"/api/v1/hosts/{host_user.id}/listings",
        headers={"X-Demo-User-Id": str(other_host.id)},
    )
    assert r.status_code == 403


def test_guest_cannot_create_listing(client, guest_user):
    payload = {
        "title": "A valid guest listing",
        "description": "This description is long enough to pass request validation.",
        "property_type": "Apartment",
        "room_type": "Entire place",
        "city": "Paris",
        "state": "Ile-de-France",
        "country": "France",
        "price_per_night": 120,
        "cleaning_fee": 20,
        "service_fee_percentage": 0.14,
        "max_guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "bathrooms": 1,
        "images": [{"image_url": "https://example.com/stay.jpg", "display_order": 0}],
        "amenity_ids": [],
    }
    r = client.post(
        "/api/v1/listings",
        json=payload,
        headers={"X-Demo-User-Id": str(guest_user.id)},
    )
    assert r.status_code == 403


def test_host_can_create_and_update_listing(client, host_user):
    headers = {"X-Demo-User-Id": str(host_user.id)}
    payload = {
        "title": "Canal Loft Retreat",
        "description": "A bright canal-side loft with generous windows and quiet rooms.",
        "property_type": "Apartment",
        "room_type": "Entire place",
        "city": "Amsterdam",
        "state": "North Holland",
        "country": "Netherlands",
        "price_per_night": 245,
        "cleaning_fee": 35,
        "service_fee_percentage": 0.14,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 1,
        "images": [{"image_url": "https://example.com/loft.jpg", "display_order": 0}],
        "amenity_ids": [],
    }
    created = client.post("/api/v1/listings", json=payload, headers=headers)
    assert created.status_code == 201
    listing_id = created.json()["id"]
    updated = client.patch(
        f"/api/v1/listings/{listing_id}",
        json={"title": "Updated Canal Loft", "price_per_night": 275},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated Canal Loft"
    assert updated.json()["price_per_night"] == 275


def test_other_host_cannot_update_listing(client, db, host_user):
    listing = make_listing(db, host_user.id)
    other_host = User(name="Other Host", email="second@test.com", role=UserRole.host)
    db.add(other_host)
    db.commit()
    r = client.patch(
        f"/api/v1/listings/{listing.id}",
        json={"title": "Changed by another host"},
        headers={"X-Demo-User-Id": str(other_host.id)},
    )
    assert r.status_code == 403


def test_delete_with_future_booking_archives_listing(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    booking = Booking(
        listing_id=listing.id, guest_id=guest_user.id,
        check_in=IN_5, check_out=IN_10, guest_count=1,
        nightly_rate=100, number_of_nights=5, subtotal=500,
        cleaning_fee=20, service_fee=70, total_amount=590,
        status=BookingStatus.confirmed,
    )
    db.add(booking)
    db.commit()
    r = client.delete(
        f"/api/v1/listings/{listing.id}",
        headers={"X-Demo-User-Id": str(host_user.id)},
    )
    assert r.status_code == 204
    db.refresh(listing)
    assert listing.status == ListingStatus.archived


# ── Phase 4 edge-case regression ─────────────────────────────────────────


@pytest.mark.parametrize(
    "check_in,check_out",
    [
        (IN_5, IN_5),
        (IN_10, IN_5),
        (TODAY - timedelta(days=1), IN_5),
    ],
)
def test_invalid_booking_dates_rejected(client, db, host_user, guest_user, check_in, check_out):
    listing = make_listing(db, host_user.id)
    r = client.post(
        "/api/v1/bookings",
        json={"listing_id": listing.id, "check_in": str(check_in), "check_out": str(check_out), "guest_count": 1},
        headers={"X-Demo-User-Id": str(guest_user.id)},
    )
    assert r.status_code == 422


def test_zero_guests_rejected(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    r = client.post(
        "/api/v1/bookings",
        json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 0},
        headers={"X-Demo-User-Id": str(guest_user.id)},
    )
    assert r.status_code == 422


def test_range_containing_existing_booking_rejected(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    headers = {"X-Demo-User-Id": str(guest_user.id)}
    client.post(
        "/api/v1/bookings",
        json={"listing_id": listing.id, "check_in": str(IN_7), "check_out": str(IN_10), "guest_count": 1},
        headers=headers,
    )
    r = client.post(
        "/api/v1/bookings",
        json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_14), "guest_count": 1},
        headers=headers,
    )
    assert r.status_code == 409


@pytest.mark.parametrize(
    "query",
    [
        "check_in=not-a-date&check_out=2030-01-02",
        f"check_in={IN_5}",
        f"check_in={IN_10}&check_out={IN_5}",
        "min_price=500&max_price=100",
        "amenities=wifi",
    ],
)
def test_invalid_listing_search_rejected(client, query):
    r = client.get(f"/api/v1/listings?{query}")
    assert r.status_code == 422


def test_booking_detail_requires_related_user(client, db, host_user, guest_user):
    listing = make_listing(db, host_user.id)
    created = client.post(
        "/api/v1/bookings",
        json={"listing_id": listing.id, "check_in": str(IN_5), "check_out": str(IN_10), "guest_count": 1},
        headers={"X-Demo-User-Id": str(guest_user.id)},
    )
    other_guest = User(name="Other Guest", email="private@test.com", role=UserRole.guest)
    db.add(other_guest)
    db.commit()
    booking_id = created.json()["id"]
    denied = client.get(f"/api/v1/bookings/{booking_id}", headers={"X-Demo-User-Id": str(other_guest.id)})
    assert denied.status_code == 403
    owner = client.get(f"/api/v1/bookings/{booking_id}", headers={"X-Demo-User-Id": str(guest_user.id)})
    host = client.get(f"/api/v1/bookings/{booking_id}", headers={"X-Demo-User-Id": str(host_user.id)})
    assert owner.status_code == 200
    assert host.status_code == 200
