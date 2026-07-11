# Interview notes

## Why FastAPI

FastAPI provides typed request validation, automatic OpenAPI documentation, dependency injection, and concise route definitions. It fit the assignment's limited implementation window while keeping HTTP handling separate from services and persistence.

## Why Alembic was omitted

The assignment explicitly uses `Base.metadata.create_all()` and does not require migrations. For a short-lived SQLite demo with a deterministic seed, this removes migration setup and keeps evaluation focused on marketplace behavior. A maintained production database would use Alembic from the first schema change.

## Why `create_all()` is sufficient here

The database can be created from an empty file, seeded deterministically, and reset during isolated tests. `create_all()` does not evolve an existing schema, so it is suitable only for this timed fresh-database workflow.

## Booking overlap and adjacent stays

Stays are half-open ranges. A conflict exists when `new_check_in < existing_check_out` and `new_check_out > existing_check_in`. The checkout day is not an occupied night, so one stay ending July 14 and another beginning July 14 are compatible.

The availability calendar guides the user, the quote reports current availability, and booking creation repeats the check. The final check is essential because another guest can book after a quote is generated.

## Why the backend calculates and snapshots prices

Clients are not trusted to submit totals. The backend reads the current nightly rate and fees, calculates with decimal-safe two-place rounding, and persists every component on the Booking. Historical reservations therefore remain unchanged when a host edits future listing prices.

## Pagination

The listing query applies all filters before counting. It returns `page`, `page_size`, `total_items`, `total_pages`, and the requested offset/limit items. The frontend writes the page into the URL and preserves all active filters during navigation.

## Availability data flow

`GET /api/v1/listings/{id}/availability` returns confirmed booking ranges and host-blocked ranges. The frontend expands each half-open range into unavailable nights, styles them in React Day Picker, and prevents ranges containing unavailable nights. The backend remains authoritative.

## Mock authentication and ownership

The selected seeded user is sent through `X-Demo-User-Id`. Route and service checks ensure users only read their own trips and favorites, only host roles manage listings, and only the listing owner updates, archives, or deletes it. This demonstrates authorization boundaries without implementing password and token infrastructure.

## Listing lifecycle

Active listings appear in search. Hosts may archive and reactivate them. A delete request for a listing with a future confirmed reservation archives it instead, preserving the booking and its relationships.

## Replacing SQLite with PostgreSQL

Change the SQLAlchemy URL and driver, introduce Alembic migrations, replace SQLite-specific connection arguments, and deploy a managed PostgreSQL database. Booking creation should run in a transaction with row locking, serializable retry logic, or a PostgreSQL exclusion constraint over date ranges.

## Adding real authentication

Use a trusted identity provider or password flow, store password hashes where applicable, issue secure HTTP-only sessions or validate JWTs, and derive the user ID and role from verified claims. The demo header would be removed, while the existing service ownership rules would remain useful defense in depth.

## Adding payments

Create a payment intent from the backend-calculated quote, confirm it on the client with the payment provider's SDK, and finalize the booking only after a verified webhook. Use idempotency keys for both payment and booking creation, persist payment state, and handle expirations and refunds.

## Persistence and deployment

The recommended demo deployment mounts a persistent disk and points `DATABASE_PATH` to it. `SEED_IF_EMPTY=true` initializes a new disk once. `SEED_ON_START=true` is an explicit ephemeral alternative that resets data on every restart and must be documented as such.
