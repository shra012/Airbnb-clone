# Airbnb Lab Architecture Plan

## Overview
The lab splits into three independently deployable services that share a common relational database (MySQL or Supabase-hosted PostgreSQL):

1. **backedn (Express.js)** – REST API powering traveler and owner experiences, handling authentication, profiles, properties, bookings, favorites, and dashboards.
2. **frontend (React)** – Responsive SPA that consumes the Express REST APIs and triggers the AI concierge overlay.
3. **agent-service (FastAPI + LangChain)** – AI concierge microservice producing itineraries based on booking context and traveler preferences.

Each service exposes its own HTTP interface and is run separately during development. Reverse proxies/load balancers are out of scope; local development uses distinct ports.

## Data Model (Relational)
Key tables (preliminary) are designed to stay portable across MySQL and PostgreSQL:

- `users` – common table with role (`TRAVELER`/`OWNER`), password hash, and session metadata.
- `traveler_profiles` – extended traveler info (phone, about, city, country, languages, gender, avatar_url).
- `owner_profiles` – owner-specific profile details.
- `properties` – property master data (owner_id FK, location fields, type, pricing, capacity, bedrooms, bathrooms, description).
- `property_amenities` – amenity strings keyed per property.
- `property_photos` – photo URLs/paths per property.
- `bookings` – booking lifecycle with status enum (`PENDING`, `ACCEPTED`, `CANCELLED`), date ranges, guest count.
- `favorites` – traveler → property mapping.
- `events`/`poi` – optional catalogs to enrich the AI agent (seed/sample data for lab).

## Service Responsibilities

### backedn (Express.js)
- `express-session` with cookie-based sessions storing user id + role.
- `bcrypt` for password hashing.
- REST routes grouped by domain: auth, profiles, properties, bookings, favorites, dashboards.
- Data access via the Prisma client, compatible with both MySQL and PostgreSQL backends.
- Input validation with middleware (e.g., `zod` or `express-validator`).
- Error handling middleware returning consistent JSON.
- Swagger UI (via `swagger-ui-express` + OpenAPI spec) for API documentation.

### frontend (React)
- React + Vite for fast dev experience.
- State management through React Query for data fetching and caching.
- Routing with React Router (traveler/owner dashboards, profiles, property views).
- Axios HTTP client with default session-aware credentials.
- Responsive UI leveraging Tailwind CSS (or Bootstrap if preferred) and accessible components.
- Floating AI Concierge button that opens side panel and calls the FastAPI endpoint.

### agent-service (FastAPI)
- Receives POST payload with booking context and preferences.
- Uses LangChain to compose itinerary (templated prompt + optional tools).
- Integrates Tavily search API wrapper for enrichment (abstracted to easily stub when API key absent).
- Returns JSON containing day-by-day plan, activity cards, restaurant suggestions, and packing list.
- FastAPI automatically exposes interactive docs via `/docs`.

## Configuration and Environment

- Shared `.env` files (with `.env.example` committed) for database credentials, session secrets, Tavily API key, etc.
- Each service will include convenience npm/pip scripts for running dev servers.
- Docker-compose (optional stretch) can orchestrate MySQL + services; initial milestone focuses on local setup instructions.

## Next Steps

1. Scaffold directory structure (`backedn/`, `frontend/`, `agent-service/`).
2. Initialize package managers in each service with baseline dependencies.
3. Implement auth + key feature skeletons iteratively.
4. Add API documentation and README instructions.
