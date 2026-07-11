"""
Pytest configuration: in-memory SQLite test database, TestClient, and fixture helpers.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import Amenity, BlockedDate, Listing, ListingImage, User, UserRole, ListingStatus

TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True, scope="function")
def setup_db():
    """Create tables before each test, drop after."""
    from app import models  # noqa: F401 — registers models
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def guest_user(db):
    u = User(name="Test Guest", email="guest@test.com", avatar_url=None, role=UserRole.guest)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def host_user(db):
    u = User(name="Test Host", email="host@test.com", avatar_url=None, role=UserRole.host)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def sample_amenity(db):
    a = Amenity(name="WiFi", category="Essentials")
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def make_listing(db, host_id, price=100.0, max_guests=4, city="Paris", property_type="Apartment"):
    listing = Listing(
        host_id=host_id,
        title="Test Listing in " + city,
        description="A great place to stay with plenty of amenities and a welcoming host.",
        property_type=property_type,
        room_type="Entire place",
        city=city,
        state="Test State",
        country="Test Country",
        price_per_night=price,
        cleaning_fee=20.0,
        service_fee_percentage=0.14,
        max_guests=max_guests,
        bedrooms=2,
        beds=2,
        bathrooms=1.0,
        rating_average=4.5,
        review_count=10,
        status=ListingStatus.active,
    )
    db.add(listing)
    db.flush()
    db.add(ListingImage(listing_id=listing.id, image_url="https://example.com/img.jpg", display_order=0))
    db.commit()
    db.refresh(listing)
    return listing
