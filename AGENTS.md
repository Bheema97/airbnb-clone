# AGENTS.md

## Product

Build an original Airbnb-inspired accommodation marketplace that demonstrates the core guest and host workflows required by the assignment.

The application must feel like a modern, photo-forward accommodation marketplace rather than a generic CRUD dashboard.

Do not copy Airbnb source code, logos, protected assets, listing descriptions, or proprietary written content.

## Time Constraint

The target implementation time is 12–16 hours.

Prioritise:

1. Working guest booking flow
2. Booking conflict prevention
3. Persistent database records
4. Search and pagination
5. Host listing CRUD
6. Responsive marketplace UI
7. Deployment and documentation

Do not add optional features until every required feature works.

## Technical Stack

### Frontend

* Next.js App Router
* TypeScript
* Tailwind CSS
* Native `fetch` through a central API client
* React Hook Form
* Zod
* React Day Picker or an equivalent lightweight date-range picker
* Sonner or react-hot-toast for notifications

TanStack Query is optional. Use it only if it clearly simplifies server-state handling. Do not introduce it merely for architectural appearance.

### Backend

* Python
* FastAPI
* SQLAlchemy 2
* Pydantic
* SQLite
* Pytest

Do not use Alembic for this assignment.

Create tables using:

`Base.metadata.create_all()`

Provide a deterministic seed script that can safely populate a fresh database.

## Repository Structure

```text
airbnb-clone/
├── frontend/
├── backend/
├── docs/
├── AGENTS.md
├── README.md
├── .env.example
└── Makefile
```

## Frontend Routes

Implement:

* `/`
* `/search`
* `/listings/[id]`
* `/checkout/[listingId]`
* `/booking-confirmation/[bookingId]`
* `/trips`
* `/favorites`
* `/host`
* `/host/listings/new`
* `/host/listings/[id]/edit`

## Backend Architecture

Use the following separation:

* `routes/` for HTTP handling
* `services/` for business logic
* `crud.py` or `repositories/` for database queries
* `models.py` for SQLAlchemy models
* `schemas.py` for Pydantic request and response models
* `database.py` for SQLite setup
* `seed.py` for deterministic sample data

Do not place booking business logic directly inside route handlers.

## Frontend Architecture

Use:

* reusable visual components
* one central API client
* shared form components
* URL search parameters for search and filters
* server data fetched from the FastAPI backend
* no duplicated hardcoded listing dataset in the frontend

Presentation components must not construct backend URLs directly.

## Mock Authentication

Implement a visible demo-user switcher.

Seed:

* at least one guest
* at least two hosts

The selected demo user must determine:

* whether host pages are visible
* which listings a host owns
* which bookings appear in My Trips
* which favorites belong to the user

Use a central mechanism such as:

* `X-Demo-User-Id` request header, or
* a centrally supplied user ID

Host ownership must still be enforced by the backend.

## Required Database Entities

### User

* id
* name
* email
* avatar_url
* role
* created_at

Role may be:

* guest
* host
* both

### Listing

* id
* host_id
* title
* description
* property_type
* room_type
* city
* state
* country
* price_per_night
* cleaning_fee
* service_fee_percentage
* max_guests
* bedrooms
* beds
* bathrooms
* rating_average
* review_count
* status
* created_at
* updated_at

### ListingImage

* id
* listing_id
* image_url
* display_order
* alt_text

### Amenity

* id
* name
* category

### ListingAmenity

* listing_id
* amenity_id

### Booking

* id
* listing_id
* guest_id
* check_in
* check_out
* guest_count
* nightly_rate
* number_of_nights
* subtotal
* cleaning_fee
* service_fee
* total_amount
* status
* created_at

The booking table must preserve a pricing snapshot so later listing-price changes do not alter old bookings.

### BlockedDate

* id
* listing_id
* start_date
* end_date
* reason

### Favorite

* user_id
* listing_id
* created_at

Add a unique constraint on:

`user_id + listing_id`

### Review

* id
* listing_id
* guest_id
* rating
* comment
* created_at

Reviews may be seeded and displayed as read-only.

Creating reviews is optional and must not delay the required build.

## Booking Rules

Treat stays as half-open ranges:

`[check_in, check_out)`

An overlap exists when:

```text
new_check_in < existing_check_out
AND
new_check_out > existing_check_in
```

Therefore, a booking ending on July 14 does not conflict with another booking beginning on July 14.

The backend must enforce:

* check-out is after check-in
* dates are not in the past
* guest count is at least one
* guest count does not exceed listing capacity
* confirmed bookings block dates
* host-blocked dates block dates
* cancelled bookings do not block dates
* booking creation rechecks availability
* booking creation returns HTTP 409 for a conflict
* all price calculations occur on the backend
* the frontend must not submit an authoritative total
* duplicate submissions must be prevented

## Price Breakdown

The backend must calculate and return:

* nightly rate
* number of nights
* subtotal
* cleaning fee
* service fee
* total amount

Calculation:

```text
subtotal = nightly_rate × number_of_nights
service_fee = subtotal × service_fee_percentage
total = subtotal + cleaning_fee + service_fee
```

Use decimal-safe calculations or careful rounding to two decimal places.

## Listing Search

The listings endpoint must support:

* location
* check-in
* check-out
* guests
* minimum price
* maximum price
* property type
* amenities
* minimum rating
* sorting
* page
* page size

The API response must include pagination metadata:

* page
* page_size
* total_items
* total_pages
* items

When dates are supplied, exclude listings that are unavailable for the requested range.

## Availability Calendar

Implement:

`GET /api/v1/listings/{listing_id}/availability`

Return confirmed booking ranges and blocked date ranges.

The listing detail calendar must visually disable unavailable dates before booking submission.

The backend must still repeat the conflict check when the booking is created.

## Required API Groups

### Listings

* list and search listings
* retrieve listing details
* retrieve availability
* create listing
* update listing
* delete or archive listing
* retrieve host-owned listings

### Bookings

* create price quote
* create booking
* retrieve booking
* retrieve user trips
* cancel booking
* retrieve host booking summary

### Favorites

* list favorites
* add favorite
* remove favorite

## Host Listing Rules

* only the owner can edit a listing
* only the owner can delete or archive a listing
* listing prices and capacities must be positive
* at least one image URL is required
* image URLs must be validated
* listings with future confirmed bookings should normally be archived rather than destructively deleted

## Required User Experience

Implement:

* responsive navigation
* marketplace listing grid
* search bar
* filter controls
* pagination or Load More
* listing detail gallery
* availability calendar
* dynamic price quote
* mocked checkout
* booking confirmation
* My Trips
* favorites
* host dashboard
* create and edit listing forms
* success and error toasts
* loading skeletons
* empty states
* error states
* desktop and mobile layouts

## Simplifications

Use:

* URL-based listing images
* static SVG or Canvas map
* read-only reviews
* mocked checkout
* demo-user switching
* fixed service-fee percentages
* page-based pagination or Load More

Do not implement unless all core features are complete:

* real authentication
* real payments
* cloud image upload
* messaging
* interactive pricing map
* identity verification
* review submission
* dark mode
* advanced host analytics
* complex revenue charts

## Deployment

Target:

* Vercel for frontend
* Render or Railway for backend

Use environment variables for the API base URL and CORS origins.

SQLite persistence must be addressed explicitly.

Acceptable demo strategies:

1. Use persistent disk storage when the hosting service supports it.
2. Recreate and reseed the database on application startup.

If the database is reseeded on restart, state this clearly in the README as a demo limitation.

Do not allow hardcoded localhost URLs in production configuration.

## README Requirements

The README must include:

* project overview
* live demo placeholder
* repository placeholder
* feature list
* technical stack
* architecture overview
* repository structure
* database schema
* Mermaid ER diagram
* API overview
* local setup
* environment variables
* database creation and seeding
* test commands
* demo users
* deployment instructions
* SQLite persistence assumption
* mocked features
* known limitations
* future improvements

Update the README during implementation. Do not leave it entirely until the final hour.

## Testing Priorities

### Backend

Test:

* listing pagination
* listing filters
* date availability
* adjacent bookings
* overlapping bookings
* guest-capacity validation
* backend price calculation
* booking persistence
* cancellation releasing dates
* host ownership
* favorite uniqueness

### End-to-End

Test:

1. Search and open a listing
2. Select available dates and receive a quote
3. Complete a booking
4. Confirm the booking appears in My Trips
5. Reject an overlapping booking
6. Create and edit a host listing

Do not pursue broad test coverage at the expense of completing the product.

## Required Verification

After every major implementation phase:

1. start the affected services
2. exercise the primary flow in the browser
3. run relevant tests
4. run frontend type-checking
5. run frontend linting
6. fix blocking errors
7. report changed files
8. report remaining limitations

Generated files alone do not count as a completed feature.
