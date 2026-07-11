"""
Deterministic seed script.
Run from the backend/ directory:  python seed.py
Safe to run repeatedly — clears existing data first.
"""
from __future__ import annotations

import os
import sys
from datetime import date, timedelta

# Ensure app is importable when run from backend/
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, init_db
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
    UserRole,
)


def clear(db):
    for model in [Review, Favorite, BlockedDate, Booking, ListingAmenity, ListingImage, Listing, Amenity, User]:
        db.query(model).delete()
    db.commit()


def seed():
    init_db()
    db = SessionLocal()
    try:
        clear(db)

        # ── Users ─────────────────────────────────────────────────────────
        users = [
            User(
                name="Alice Chen",
                email="alice@example.com",
                avatar_url="https://i.pravatar.cc/150?img=47",
                role=UserRole.guest,
            ),
            User(
                name="Marco Rivera",
                email="marco@example.com",
                avatar_url="https://i.pravatar.cc/150?img=12",
                role=UserRole.host,
            ),
            User(
                name="Sophie Laurent",
                email="sophie@example.com",
                avatar_url="https://i.pravatar.cc/150?img=32",
                role=UserRole.host,
            ),
            User(
                name="James Okafor",
                email="james@example.com",
                avatar_url="https://i.pravatar.cc/150?img=65",
                role=UserRole.both,
            ),
            User(
                name="Priya Nair",
                email="priya@example.com",
                avatar_url="https://i.pravatar.cc/150?img=25",
                role=UserRole.guest,
            ),
        ]
        db.add_all(users)
        db.flush()

        alice, marco, sophie, james, priya = users

        # ── Amenities ─────────────────────────────────────────────────────
        amenity_data = [
            ("WiFi", "Essentials"),
            ("Kitchen", "Essentials"),
            ("Free parking", "Essentials"),
            ("Air conditioning", "Essentials"),
            ("Heating", "Essentials"),
            ("Washer", "Essentials"),
            ("TV", "Entertainment"),
            ("Pool", "Outdoor"),
            ("Hot tub", "Outdoor"),
            ("BBQ grill", "Outdoor"),
            ("Fire pit", "Outdoor"),
            ("Gym", "Recreation"),
            ("Workspace", "Work"),
            ("Pet-friendly", "Policies"),
            ("Smoke detector", "Safety"),
            ("Carbon monoxide detector", "Safety"),
        ]
        amenities = [Amenity(name=n, category=c) for n, c in amenity_data]
        db.add_all(amenities)
        db.flush()
        a = {am.name: am for am in amenities}

        # ── Listings ──────────────────────────────────────────────────────
        listings_data = [
            # Marco's listings
            dict(
                host_id=marco.id,
                title="Beachfront Villa in Malibu",
                description="Wake up to the sound of waves in this stunning oceanfront villa. Floor-to-ceiling windows frame panoramic Pacific views. The open-plan kitchen leads to a wraparound deck perfect for sunset dinners. Minutes from Zuma Beach and world-class surfing spots.",
                property_type="Villa",
                room_type="Entire place",
                city="Malibu",
                state="California",
                country="United States",
                price_per_night=450.0,
                cleaning_fee=80.0,
                service_fee_percentage=0.14,
                max_guests=8,
                bedrooms=4,
                beds=5,
                bathrooms=3.0,
                rating_average=4.95,
                review_count=128,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", 0, "Beachfront exterior"),
                    ("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", 1, "Living room with ocean view"),
                    ("https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800", 2, "Master bedroom"),
                    ("https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800", 3, "Deck at sunset"),
                ],
                amenity_names=["WiFi", "Kitchen", "Pool", "BBQ grill", "Air conditioning", "Free parking", "TV"],
            ),
            dict(
                host_id=marco.id,
                title="Modern Loft in Downtown Manhattan",
                description="Stylish industrial loft in the heart of NYC. Exposed brick walls meet contemporary furnishings in this architect-designed space. Walk to SoHo galleries, Greenwich Village restaurants, and iconic landmarks. The rooftop garden offers breathtaking skyline views.",
                property_type="Loft",
                room_type="Entire place",
                city="New York",
                state="New York",
                country="United States",
                price_per_night=220.0,
                cleaning_fee=45.0,
                service_fee_percentage=0.14,
                max_guests=4,
                bedrooms=2,
                beds=2,
                bathrooms=1.5,
                rating_average=4.87,
                review_count=94,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800", 0, "Loft interior"),
                    ("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", 1, "Open plan living"),
                    ("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", 2, "Kitchen"),
                    ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", 3, "Rooftop view"),
                ],
                amenity_names=["WiFi", "Kitchen", "Workspace", "Heating", "TV", "Washer"],
            ),
            dict(
                host_id=marco.id,
                title="Cozy Mountain Cabin in Aspen",
                description="Escape to the Rockies in this charming log cabin surrounded by towering pines. A stone fireplace anchors the living room, while the private hot tub lets you soak under starlit skies. Ski-in/ski-out access to Aspen Mountain slopes just 200m away.",
                property_type="Cabin",
                room_type="Entire place",
                city="Aspen",
                state="Colorado",
                country="United States",
                price_per_night=380.0,
                cleaning_fee=65.0,
                service_fee_percentage=0.14,
                max_guests=6,
                bedrooms=3,
                beds=4,
                bathrooms=2.0,
                rating_average=4.92,
                review_count=76,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800", 0, "Cabin exterior in snow"),
                    ("https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800", 1, "Cozy fireplace"),
                    ("https://images.unsplash.com/photo-1560472355-536de3962603?w=800", 2, "Bedroom"),
                    ("https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800", 3, "Hot tub at night"),
                ],
                amenity_names=["WiFi", "Kitchen", "Hot tub", "Fire pit", "Heating", "Free parking", "Pet-friendly"],
            ),
            dict(
                host_id=marco.id,
                title="Tropical Treehouse in Kauai",
                description="Perched among the jungle canopy, this magical treehouse offers an immersive nature retreat. Open-air living spaces welcome tropical breezes. A short hike reaches private waterfall swimming holes. Outdoor shower and hammock lounge complete the paradise experience.",
                property_type="Treehouse",
                room_type="Entire place",
                city="Hanalei",
                state="Hawaii",
                country="United States",
                price_per_night=310.0,
                cleaning_fee=55.0,
                service_fee_percentage=0.14,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1.0,
                rating_average=4.98,
                review_count=203,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800", 0, "Treehouse exterior"),
                    ("https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800", 1, "Interior living space"),
                    ("https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800", 2, "Jungle view from deck"),
                    ("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", 3, "Outdoor shower"),
                ],
                amenity_names=["WiFi", "Kitchen", "BBQ grill", "Pet-friendly"],
            ),
            # Sophie's listings
            dict(
                host_id=sophie.id,
                title="Château Suite in Bordeaux Wine Country",
                description="Stay in a 19th-century château surrounded by prestigious vineyards. The grand suite features original parquet floors, ornate fireplaces, and four-poster beds. A private cellar tasting room is included. Daily cycling tours of the AOC vineyards available.",
                property_type="Castle",
                room_type="Private room",
                city="Bordeaux",
                state="Nouvelle-Aquitaine",
                country="France",
                price_per_night=290.0,
                cleaning_fee=60.0,
                service_fee_percentage=0.14,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1.0,
                rating_average=4.89,
                review_count=57,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1548786811-dd6e453ccca7?w=800", 0, "Château exterior"),
                    ("https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", 1, "Grand suite interior"),
                    ("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", 2, "Vineyard views"),
                    ("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", 3, "Wine cellar"),
                ],
                amenity_names=["WiFi", "Kitchen", "Heating", "TV", "Free parking"],
            ),
            dict(
                host_id=sophie.id,
                title="Houseboat on Amsterdam Canals",
                description="Experience authentic Amsterdam life aboard this beautifully converted 1930s barge. The sun deck overlooks the Prinsengracht canal, perfect for morning coffee. Walk to the Anne Frank House, Rijksmuseum, and the best brown cafés. Bicycles included.",
                property_type="Boat",
                room_type="Entire place",
                city="Amsterdam",
                state="North Holland",
                country="Netherlands",
                price_per_night=195.0,
                cleaning_fee=40.0,
                service_fee_percentage=0.14,
                max_guests=4,
                bedrooms=2,
                beds=2,
                bathrooms=1.0,
                rating_average=4.81,
                review_count=112,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800", 0, "Houseboat on canal"),
                    ("https://images.unsplash.com/photo-1561501878-aabd62634533?w=800", 1, "Interior living area"),
                    ("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", 2, "Canal view from deck"),
                    ("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", 3, "Bedroom below deck"),
                ],
                amenity_names=["WiFi", "Kitchen", "Heating", "Washer", "TV"],
            ),
            dict(
                host_id=sophie.id,
                title="Cliffside Infinity Pool Villa in Santorini",
                description="Perched on Oia's volcanic caldera, this iconic Cycladic villa delivers the quintessential Santorini experience. The infinity pool appears to merge with the Aegean Sea. Watch the world-famous sunset from your private terrace with a glass of local Assyrtiko.",
                property_type="Villa",
                room_type="Entire place",
                city="Oia",
                state="South Aegean",
                country="Greece",
                price_per_night=520.0,
                cleaning_fee=90.0,
                service_fee_percentage=0.14,
                max_guests=6,
                bedrooms=3,
                beds=3,
                bathrooms=2.0,
                rating_average=4.97,
                review_count=189,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800", 0, "Infinity pool with caldera view"),
                    ("https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800", 1, "White-washed exterior"),
                    ("https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800", 2, "Master bedroom with sea view"),
                    ("https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800", 3, "Sunset terrace"),
                ],
                amenity_names=["WiFi", "Kitchen", "Pool", "Air conditioning", "TV", "Hot tub"],
            ),
            dict(
                host_id=sophie.id,
                title="Desert Dome in Joshua Tree",
                description="An otherworldly geodesic dome nestled among Joshua trees and granite boulders. Stargazing is extraordinary through the panoramic skylight. The dome's curved walls create perfect acoustics for music lovers. Outdoor yoga deck faces the sunrise over the desert.",
                property_type="Dome",
                room_type="Entire place",
                city="Joshua Tree",
                state="California",
                country="United States",
                price_per_night=175.0,
                cleaning_fee=35.0,
                service_fee_percentage=0.14,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1.0,
                rating_average=4.94,
                review_count=87,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800", 0, "Dome under stars"),
                    ("https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800", 1, "Desert landscape"),
                    ("https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800", 2, "Dome interior"),
                    ("https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800", 3, "Stargazing skylight"),
                ],
                amenity_names=["WiFi", "Kitchen", "BBQ grill", "Fire pit", "Free parking"],
            ),
            # James's listings (role: both)
            dict(
                host_id=james.id,
                title="Penthouse with Rooftop Pool in Miami Beach",
                description="Live at the apex of South Beach luxury in this full-floor penthouse. The wraparound terrace hosts a private plunge pool and outdoor kitchen with skyline and ocean views. Steps from Collins Avenue nightlife and white sand beaches. Includes concierge service.",
                property_type="Apartment",
                room_type="Entire place",
                city="Miami Beach",
                state="Florida",
                country="United States",
                price_per_night=680.0,
                cleaning_fee=120.0,
                service_fee_percentage=0.14,
                max_guests=6,
                bedrooms=3,
                beds=4,
                bathrooms=3.0,
                rating_average=4.93,
                review_count=64,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1560448075-bb485b067938?w=800", 0, "Penthouse terrace with pool"),
                    ("https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", 1, "Living room"),
                    ("https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=800", 2, "Master suite"),
                    ("https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=800", 3, "Ocean view at dusk"),
                ],
                amenity_names=["WiFi", "Kitchen", "Pool", "Gym", "Air conditioning", "Hot tub", "Workspace", "TV"],
            ),
            dict(
                host_id=james.id,
                title="Lakefront Cottage in the Cotswolds",
                description="This quintessential English stone cottage sits beside a private lake in the heart of the Cotswolds AONB. Original features blend with modern comforts — Aga cooker, roll-top bath, and a garden bursting with roses. Rowing boat and fishing rods provided.",
                property_type="Cottage",
                room_type="Entire place",
                city="Bourton-on-the-Water",
                state="Gloucestershire",
                country="United Kingdom",
                price_per_night=245.0,
                cleaning_fee=50.0,
                service_fee_percentage=0.14,
                max_guests=4,
                bedrooms=2,
                beds=3,
                bathrooms=1.5,
                rating_average=4.88,
                review_count=143,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", 0, "Stone cottage exterior"),
                    ("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800", 1, "Country kitchen"),
                    ("https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=800", 2, "Lakeside garden"),
                    ("https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800", 3, "Cosy living room"),
                ],
                amenity_names=["WiFi", "Kitchen", "Heating", "BBQ grill", "Free parking", "Pet-friendly", "TV"],
            ),
            dict(
                host_id=james.id,
                title="Ryokan-Style Suite in Kyoto",
                description="A contemporary take on the traditional Japanese inn, tucked behind a bamboo garden in Higashiyama district. Tatami rooms, a hinoki cedar soaking tub, and an austere rock garden encourage mindful stillness. Walking distance to Kinkaku-ji and the Philosopher's Path.",
                property_type="House",
                room_type="Private room",
                city="Kyoto",
                state="Kyoto Prefecture",
                country="Japan",
                price_per_night=185.0,
                cleaning_fee=30.0,
                service_fee_percentage=0.14,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1.0,
                rating_average=4.96,
                review_count=211,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800", 0, "Bamboo garden entrance"),
                    ("https://images.unsplash.com/photo-1578469645742-46cae010e5d4?w=800", 1, "Tatami room"),
                    ("https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800", 2, "Soaking tub"),
                    ("https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800", 3, "Rock garden"),
                ],
                amenity_names=["WiFi", "Heating", "TV"],
            ),
            dict(
                host_id=james.id,
                title="Overwater Bungalow in the Maldives",
                description="Float above a crystal lagoon in this iconic overwater bungalow. The glass floor panel reveals the thriving coral reef below. Step directly into the turquoise Indian Ocean from your private water deck. Snorkel, paddleboard, or simply listen to the silence.",
                property_type="Bungalow",
                room_type="Entire place",
                city="North Malé Atoll",
                state="Kaafu Atoll",
                country="Maldives",
                price_per_night=890.0,
                cleaning_fee=150.0,
                service_fee_percentage=0.14,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1.0,
                rating_average=4.99,
                review_count=48,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800", 0, "Overwater bungalow at sunrise"),
                    ("https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800", 1, "Lagoon view from deck"),
                    ("https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800", 2, "Glass floor panel"),
                    ("https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800", 3, "Aerial view of bungalows"),
                ],
                amenity_names=["WiFi", "Air conditioning", "TV", "Kitchen"],
            ),
            dict(
                host_id=marco.id,
                title="Urban Micro-Studio in Tokyo Shibuya",
                description="A cleverly designed micro-studio in the beating heart of Shibuya. Every centimetre is utilised — from the murphy bed system to the fold-out workspace. Standing at Shibuya Crossing is a 3-minute walk. Unlimited-speed fibre WiFi included for digital nomads.",
                property_type="Apartment",
                room_type="Entire place",
                city="Tokyo",
                state="Tokyo Metropolis",
                country="Japan",
                price_per_night=125.0,
                cleaning_fee=20.0,
                service_fee_percentage=0.14,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1.0,
                rating_average=4.73,
                review_count=302,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800", 0, "Compact studio interior"),
                    ("https://images.unsplash.com/photo-1549638441-b787d2e11f14?w=800", 1, "City view at night"),
                    ("https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800", 2, "Workspace setup"),
                    ("https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800", 3, "Shibuya street view"),
                ],
                amenity_names=["WiFi", "Air conditioning", "Heating", "Workspace", "TV"],
            ),
            dict(
                host_id=sophie.id,
                title="Safari Tent in the Serengeti",
                description="Experience glamping at its finest — a luxury canvas tent with king bed, en-suite bathroom, and a private viewing platform overlooking a watering hole. Game drives depart at dawn. Witness the Great Migration from your sundowner chair at dusk.",
                property_type="Tent",
                room_type="Entire place",
                city="Serengeti",
                state="Mara",
                country="Tanzania",
                price_per_night=430.0,
                cleaning_fee=70.0,
                service_fee_percentage=0.14,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1.0,
                rating_average=4.91,
                review_count=39,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800", 0, "Safari tent exterior"),
                    ("https://images.unsplash.com/photo-1504432842672-1a79f78e4084?w=800", 1, "Savanna view at sunrise"),
                    ("https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800", 2, "Luxury tent interior"),
                    ("https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800", 3, "Wildlife at watering hole"),
                ],
                amenity_names=["Heating", "Free parking", "BBQ grill"],
            ),
            dict(
                host_id=marco.id,
                title="Farmhouse in Tuscany Countryside",
                description="A beautifully restored 15th-century stone farmhouse set among rolling Chianti hills. The terracotta-floored kitchen is a cook's dream, and the cellar holds 200 bottles from the estate's own vineyard. A large pool and bocce court complete this authentic agriturismo.",
                property_type="House",
                room_type="Entire place",
                city="Greve in Chianti",
                state="Tuscany",
                country="Italy",
                price_per_night=340.0,
                cleaning_fee=70.0,
                service_fee_percentage=0.14,
                max_guests=10,
                bedrooms=5,
                beds=6,
                bathrooms=4.0,
                rating_average=4.9,
                review_count=166,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800", 0, "Stone farmhouse exterior"),
                    ("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", 1, "Tuscan pool"),
                    ("https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", 2, "Country kitchen"),
                    ("https://images.unsplash.com/photo-1504652517000-ae1068478c59?w=800", 3, "Chianti vineyard views"),
                ],
                amenity_names=["WiFi", "Kitchen", "Pool", "BBQ grill", "Free parking", "Pet-friendly", "TV"],
            ),
            dict(
                host_id=james.id,
                title="Glass Igloo in Lapland",
                description="Sleep under the northern lights in a heated glass igloo perched on an arctic fell. The panoramic curved ceiling gives an unobstructed view of the aurora borealis. Snowshoe trails start at the door, and a private sauna warms you after reindeer sleigh rides.",
                property_type="Cabin",
                room_type="Entire place",
                city="Saariselkä",
                state="Lapland",
                country="Finland",
                price_per_night=395.0,
                cleaning_fee=60.0,
                service_fee_percentage=0.14,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1.0,
                rating_average=4.97,
                review_count=83,
                status=ListingStatus.active,
                images=[
                    ("https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800", 0, "Glass igloo at night"),
                    ("https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=800", 1, "Northern lights"),
                    ("https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800", 2, "Snowy Lapland landscape"),
                    ("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", 3, "Interior with aurora view"),
                ],
                amenity_names=["Heating", "Hot tub", "WiFi", "TV"],
            ),
        ]

        listing_objs = []
        for ld in listings_data:
            img_data = ld.pop("images")
            amenity_names = ld.pop("amenity_names")
            listing = Listing(**ld)
            db.add(listing)
            db.flush()
            for order, (url, disp_order, alt) in enumerate(img_data):
                db.add(ListingImage(listing_id=listing.id, image_url=url, display_order=disp_order, alt_text=alt))
            for an in amenity_names:
                if an in a:
                    db.add(ListingAmenity(listing_id=listing.id, amenity_id=a[an].id))
            listing_objs.append(listing)

        db.flush()

        # Give listing_objs friendly names
        (
            beach_villa, manhattan_loft, aspen_cabin, kauai_treehouse,
            bordeaux_chateau, amsterdam_boat, santorini_villa, joshua_dome,
            miami_penthouse, cotswolds_cottage, kyoto_ryokan, maldives_bungalow,
            tokyo_studio, serengeti_tent, tuscany_farm, lapland_igloo,
        ) = listing_objs

        today = date.today()

        # ── Bookings ──────────────────────────────────────────────────────
        # Alice (guest) bookings
        b1 = Booking(
            listing_id=beach_villa.id,
            guest_id=alice.id,
            check_in=today + timedelta(days=10),
            check_out=today + timedelta(days=17),
            guest_count=4,
            nightly_rate=450.0,
            number_of_nights=7,
            subtotal=3150.0,
            cleaning_fee=80.0,
            service_fee=441.0,
            total_amount=3671.0,
            status=BookingStatus.confirmed,
        )
        b2 = Booking(
            listing_id=manhattan_loft.id,
            guest_id=alice.id,
            check_in=today - timedelta(days=30),
            check_out=today - timedelta(days=25),
            guest_count=2,
            nightly_rate=220.0,
            number_of_nights=5,
            subtotal=1100.0,
            cleaning_fee=45.0,
            service_fee=154.0,
            total_amount=1299.0,
            status=BookingStatus.confirmed,
        )
        # Cancelled booking
        b3 = Booking(
            listing_id=aspen_cabin.id,
            guest_id=alice.id,
            check_in=today + timedelta(days=5),
            check_out=today + timedelta(days=10),
            guest_count=3,
            nightly_rate=380.0,
            number_of_nights=5,
            subtotal=1900.0,
            cleaning_fee=65.0,
            service_fee=266.0,
            total_amount=2231.0,
            status=BookingStatus.cancelled,  # cancelled — should NOT block dates
        )
        # Priya (guest) booking
        b4 = Booking(
            listing_id=santorini_villa.id,
            guest_id=priya.id,
            check_in=today + timedelta(days=20),
            check_out=today + timedelta(days=27),
            guest_count=2,
            nightly_rate=520.0,
            number_of_nights=7,
            subtotal=3640.0,
            cleaning_fee=90.0,
            service_fee=509.6,
            total_amount=4239.6,
            status=BookingStatus.confirmed,
        )
        # James booking as guest
        b5 = Booking(
            listing_id=manhattan_loft.id,
            guest_id=james.id,
            check_in=today + timedelta(days=40),
            check_out=today + timedelta(days=45),
            guest_count=2,
            nightly_rate=220.0,
            number_of_nights=5,
            subtotal=1100.0,
            cleaning_fee=45.0,
            service_fee=154.0,
            total_amount=1299.0,
            status=BookingStatus.confirmed,
        )
        db.add_all([b1, b2, b3, b4, b5])
        db.flush()

        # ── Blocked dates ──────────────────────────────────────────────────
        db.add(BlockedDate(
            listing_id=kyoto_ryokan.id,
            start_date=today + timedelta(days=15),
            end_date=today + timedelta(days=22),
            reason="Host personal stay",
        ))
        db.add(BlockedDate(
            listing_id=lapland_igloo.id,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=12),
            reason="Maintenance",
        ))

        # ── Favorites ──────────────────────────────────────────────────────
        db.add(Favorite(user_id=alice.id, listing_id=santorini_villa.id))
        db.add(Favorite(user_id=alice.id, listing_id=aspen_cabin.id))
        db.add(Favorite(user_id=alice.id, listing_id=kyoto_ryokan.id))
        db.add(Favorite(user_id=priya.id, listing_id=beach_villa.id))
        db.add(Favorite(user_id=priya.id, listing_id=tuscany_farm.id))

        # ── Reviews ───────────────────────────────────────────────────────
        reviews = [
            Review(listing_id=beach_villa.id, guest_id=alice.id, rating=5,
                   comment="Absolutely breathtaking. Woke up every morning to the sound of waves. Marco was an exceptional host — very responsive and thoughtful. Can't wait to return!"),
            Review(listing_id=beach_villa.id, guest_id=priya.id, rating=5,
                   comment="Paradise found. The deck at sunset is something you have to experience. Every detail was perfect."),
            Review(listing_id=manhattan_loft.id, guest_id=alice.id, rating=5,
                   comment="Stylish, central, and incredibly well-equipped. The rooftop garden was our favourite spot. Marco thought of everything."),
            Review(listing_id=aspen_cabin.id, guest_id=priya.id, rating=5,
                   comment="Magical ski holiday. The hot tub under the stars after a day on the slopes is the pinnacle of relaxation."),
            Review(listing_id=santorini_villa.id, guest_id=alice.id, rating=5,
                   comment="Sophie's villa exceeded every expectation. The infinity pool view at sunset is the most beautiful thing I've ever seen."),
            Review(listing_id=kyoto_ryokan.id, guest_id=james.id, rating=5,
                   comment="A deeply peaceful and authentic experience. The hinoki tub and tatami room transported me completely. Extraordinary."),
            Review(listing_id=tuscany_farm.id, guest_id=priya.id, rating=5,
                   comment="Ten of us spent a week here and left wishing we could stay forever. The kitchen, the pool, the wine cellar — perfection."),
            Review(listing_id=lapland_igloo.id, guest_id=alice.id, rating=5,
                   comment="Watching the aurora borealis from our warm bed was a once-in-a-lifetime experience. James is an outstanding host."),
        ]
        db.add_all(reviews)
        db.commit()

        print("[OK] Seed complete!")
        print(f"  Users: {len(users)}")
        print(f"  Listings: {len(listing_objs)}")
        print(f"  Amenities: {len(amenities)}")
        print(f"  Bookings: 5 (4 confirmed, 1 cancelled)")
        print(f"  Blocked date ranges: 2")
        print(f"  Favorites: 5")
        print(f"  Reviews: {len(reviews)}")
        print()
        print("Demo users:")
        for u in users:
            print(f"  ID={u.id}  {u.name:20s}  role={u.role.value:6s}  {u.email}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
