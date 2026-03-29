## ADDED Requirements

### Requirement: Embed frontend build artifacts
The system SHALL embed the frontend production build output (contents of `frontend/dist/`) into the Go binary using `//go:embed` directive, so that no external files are needed to serve the web UI.

#### Scenario: Frontend assets available in binary
- **WHEN** the standalone binary is built after running `npm run build` in the frontend directory
- **THEN** all files from `frontend/dist/` (HTML, JS, CSS, images) are embedded in the binary

### Requirement: Serve static files from embedded filesystem
The system SHALL serve the embedded frontend files via the Chi router for all paths that do not match API routes (`/api/v1/*`) or system routes (`/healthz`).

#### Scenario: Serve index.html at root
- **WHEN** a browser requests `GET /`
- **THEN** the server responds with the embedded `index.html` and HTTP 200

#### Scenario: Serve static asset files
- **WHEN** a browser requests `GET /assets/index-abc123.js`
- **THEN** the server responds with the embedded JavaScript file with correct Content-Type

### Requirement: SPA fallback routing
The system SHALL return the embedded `index.html` for any non-API, non-file path to support React Router client-side routing.

#### Scenario: SPA route returns index.html
- **WHEN** a browser requests `GET /console/books` (a React Router route)
- **THEN** the server responds with `index.html` and HTTP 200, allowing React Router to handle the route

#### Scenario: API routes are not affected
- **WHEN** a request is made to `GET /api/v1/books`
- **THEN** the request is handled by the gRPC-gateway API handler, not the static file server

### Requirement: Correct MIME types
The system SHALL serve embedded files with correct Content-Type headers based on file extension.

#### Scenario: JavaScript files served with correct type
- **WHEN** a browser requests a `.js` file from embedded assets
- **THEN** the response Content-Type is `application/javascript`

#### Scenario: CSS files served with correct type
- **WHEN** a browser requests a `.css` file from embedded assets
- **THEN** the response Content-Type is `text/css`
