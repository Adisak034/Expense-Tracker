# Copilot Instructions for Ocr-Node

## Project Overview
This is a Node.js/Express application for managing expenses and performing OCR on uploaded images. It uses SQLite for data storage and integrates with an external n8n workflow for OCR processing.

## Architecture & Data Flow
- **Backend:**
  - `server.js` is the main entry point. It sets up Express routes for expense management and OCR uploads.
  - `database.js` initializes a SQLite database (`db.sqlite`) and creates an `expenses` table if it doesn't exist.
  - Expense data is managed via `/api/expenses` endpoints (GET for listing, POST for adding).
  - OCR uploads are handled via `/api/ocr/upload`, which forwards files to an n8n webhook (URL must be set in `server.js`).
- **Frontend:**
  - Static files are served from the `public/` directory.
  - Main pages: `index.html`, `add.html`, `dashboard.html`.
  - Client-side logic is in `public/js/` (`main.js`, `add.js`, `dashboard.js`).
  - Styling is in `public/css/style.css`.
- **Uploads:**
  - Uploaded files are temporarily stored in the `uploads/` directory and deleted after processing.

## Developer Workflows
- **Start the server:**
  - Run `node server.js` from the project root.
- **Database:**
  - SQLite DB is auto-created on startup. Initial sample data is inserted if the table is new.
- **Testing:**
  - No formal tests are present. The `npm test` script is a placeholder.
- **OCR Integration:**
  - Set the `N8N_WEBHOOK_URL` in `server.js` before using OCR features.

## Project-Specific Patterns
- All API endpoints return JSON responses with a `message` and `data` field.
- Uploaded files are always deleted after OCR processing (success or error).
- Dates for expenses are stored in `YYYY-MM-DD` format.
- The backend expects form uploads for OCR under the field name `ocrFile`.

## External Dependencies
- Express, Multer, Axios, Form-Data, SQLite3 (see `package.json`).
- n8n workflow for OCR (external service, not included).

## Key Files & Directories
- `server.js`: Main server logic and API routes
- `database.js`: SQLite setup and table creation
- `public/`: Frontend assets
- `uploads/`: Temporary file storage for OCR

## Example: Adding an Expense
- POST `/api/expenses` with `{ "item": "Lunch", "amount": 12.5 }`

## Example: Uploading for OCR
- POST `/api/ocr/upload` with a file field named `ocrFile`

---
For unclear or missing conventions, ask the user for clarification before making assumptions.
