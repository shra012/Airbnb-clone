# Airbnb Lab

## High-Level Plan
- Build a modular Airbnb-style lab with Express API, React SPA, and a FastAPI agent service.
- Keep data access unified through Prisma so the backend can run on MySQL or Supabase PostgreSQL.
- Document architecture decisions and API boundaries as the project evolves.

## Folder Structure
- `backend/` – Express API, Prisma schema, and service logic.
- `frontend/` – React single-page application.
- `agent-service/` – FastAPI + LangChain itinerary generator.
- `docs/` – Reference materials, including architecture notes.

For deeper details, see [docs/architecture.md](docs/architecture.md).

## Mongo-backed Sessions & Notifications (Backend)
The Express API now persists login sessions and booking notifications in MongoDB Atlas to satisfy Lab 2 requirements.

1. Create a MongoDB Atlas cluster (free tier works) and add an IP allow-list entry for your dev machine/hosting environment.
2. Generate a connection string that targets a database for sessions (e.g., `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/airbnb_sessions`).
3. In `backend/.env`, add `MONGO_SESSION_URI="<your-connection-string>"`. Keep credentials out of source control—use 1Password/GitHub Secrets for sharing.
4. Optionally override `SESSION_SECRET` for additional entropy; otherwise a random value is generated at boot.

Notifications created by Kafka consumers are stored in the same Atlas database (collection `booking_notifications`) and exposed via `GET /api/notifications`. When `MONGO_SESSION_URI` is omitted, the backend falls back to the default in-memory session store and disables notification persistence.

## Local Kafka Stack
Docker Compose now provisions a single-node Confluent Kafka cluster powered by KRaft (no ZooKeeper) plus Kafka UI:

```bash
docker compose up kafka backend kafka-ui
```

Key details:
- Brokers listen on `kafka:9092` for containers and `localhost:29092` for host tooling (KRaft controller is exposed on 9093).
- Inspect topics/records via Kafka UI at http://localhost:8080.
- Bootstrap required topics with the helper script:

```bash
bash scripts/kafka/bootstrap-topics.sh
```

The script creates `booking.requests`, `booking.status`, and `property.notifications` with three partitions each. The backend consumes the first two topics to populate Mongo-backed notifications; configure services with `KAFKA_BROKER_URL` (`localhost:29092` when running Node locally, or `kafka:9092` when running inside Docker/Kubernetes).

## Realtime Notifications (Socket.IO)
- The backend now exposes a Socket.IO server on the same port as the REST API. Clients connect to `ws://localhost:4000/socket.io/` (or your deployed host) and must send cookies so the session can be validated.
- Upon connection the server assigns users to rooms based on their user id (`user:<id>`), role (`role:TRAVELER | role:OWNER`), and any property subscriptions they opt into via the `subscribe:property` event.
- Kafka consumers fan out events instantly:
  - `booking.requests` → owner sockets (`booking:request` event) and Mongo `booking_notifications`.
  - `booking.status` → traveler sockets (`booking:status` event) and Mongo `booking_notifications`.
  - `property.notifications` → all subscribed traveler sockets (`property:update` event) and Mongo `property_notifications`.
- REST fallbacks:
  - `GET /api/notifications` returns the Mongo-backed booking notifications for the authenticated user.
  - `GET /api/properties/:propertyId/notifications` (auth required) returns recent property events for clients that want to hydrate state on page load.
