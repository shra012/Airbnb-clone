.PHONY: backend frontend dev

backend:
	@npm --prefix backend run dev

frontend:
	@npm --prefix frontend run dev

dev:
	@echo "Launching backend and frontend dev servers (Ctrl+C to stop both)..."
	@bash -c '\
		set -e; \
		npm --prefix backend run dev & \
		BACK_PID=$$!; \
		npm --prefix frontend run dev & \
		FRONT_PID=$$!; \
		trap "kill $$BACK_PID $$FRONT_PID" INT TERM EXIT; \
		wait $$BACK_PID $$FRONT_PID; \
	'
