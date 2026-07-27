# Task Manager Frontend

This workspace contains the React frontend for the TaskFlow full-stack task manager.

## Frontend application

The application lives in [`react_frontend`](./react_frontend) and provides an accessible, responsive task CRUD workflow.

### Run locally

```bash
cd react_frontend
npm install
npm run dev
```

The frontend listens on port `3000` when the preview environment supplies that port configuration. It calls the FastAPI backend at `http://localhost:3001` by default. Set `VITE_API_BASE_URL` through the container environment to use another backend URL.

### Run the complete stack

Start the services in dependency order:

1. Start the in-memory database service on `http://localhost:3002`.
2. Start the FastAPI backend on `http://localhost:3001`. Its `DATABASE_SERVICE_URL` must point to the database service; the local default already does.
3. Run this frontend on `http://localhost:3000`.

The browser uses `VITE_API_BASE_URL` (default `http://localhost:3001`) for all task requests. The backend permits that origin by default through `CORS_ORIGINS`.

### Task API contract

The UI consumes the backend's `/tasks` REST resource:

- `GET /tasks`
- `POST /tasks`
- `PUT /tasks/{id}`
- `DELETE /tasks/{id}`

A task has `title` (required, maximum 120 characters), optional `description` (maximum 500 characters), and `status` (`todo`, `in_progress`, or `done`).

### Integration smoke check

After the three services are running, open the frontend and create a task, edit its title or status, then delete it. Refreshing the page after each mutation confirms the UI is reading persisted state through the backend and database service.

- A blank title or description longer than 500 characters is rejected by the form before it is sent.
- Invalid request payloads and unknown task IDs are rejected by the backend with a clear error response.
- When the backend or database service is unavailable, the UI keeps its current data and displays a non-technical error notification.
- `GET http://localhost:3001/health` verifies the backend can reach storage; `GET http://localhost:3002/health` verifies storage directly.

### Test and coverage

```bash
cd react_frontend
npm test
```

The command runs Jest and React Testing Library tests non-interactively, creates `react_frontend/coverage/lcov.info`, and enforces an 85% global coverage threshold. SonarQube settings are in `react_frontend/sonar-project.properties`.
