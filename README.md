# ShelfLife — Shared Household Inventory Tracker

ShelfLife is a shared household kitchen inventory tracker designed for 3–6 housemates. This version has been built from scratch using:
* **Backend**: Node.js, Express, TypeScript, and MS SQL Server
* **Frontend**: React.js, TypeScript, Tailwind CSS v4, and Vite
* **Test Suite**: Jest and Supertest

---

## Getting Started

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
Copy the environment variables template and configure your MS SQL Server credentials:
```bash
cp .env.example .env
```
*(If no MS SQL credentials are provided or if connection fails, the backend will automatically fall back to a zero-friction In-Memory database for local testing!)*

### 3. Run Backend Integration Tests
Execute the Jest integration test suite to verify validation rules, auth PIN guards, and CRUD endpoints:
```bash
npm run test
```

### 4. Start the Backend Server
```bash
npm run dev
```
The Express server will start listening on port `3001` (with live SSE endpoints).

---

### 5. Install Frontend Dependencies
Open a new terminal tab/window:
```bash
cd frontend
npm install
```

### 6. Start the Frontend Client
```bash
npm run dev
```
The React development server will start on port `3000`. Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## API Routes & Endpoints

* `POST /api/auth` — Handles lightweight username registration and login verification.
* `GET /api/items` — Retrieves all inventory items (active and used).
* `POST /api/items` — Adds a new item (requires display name + token headers).
* `PUT /api/items/:id` — Modifies an existing item.
* `DELETE /api/items/:id` — Removes an item.
* `POST /api/items/:id/use` — Marks an item as consumed / used up.
* `GET /api/events` — Streams Server-Sent Events (SSE) for real-time synchronization.

---

## Seed Data & Quantities

The backend integration test suite validates that:
1. **Basmati Rice** (Grain, `2kg`, no expiry) successfully saves.
2. **Salt** (Spice, presence only, no expiry) successfully saves.
3. **Onions** (Produce, `4` count, expiry in 5 days) successfully saves.
4. **Milk** (Dairy, `1` count, expiry tomorrow) successfully saves.
5. **Empty item names** or missing categories are strictly rejected with `400 Bad Request`.
