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
