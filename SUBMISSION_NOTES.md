# ShelfLife — Submission Notes (Node.js, React, MS SQL Stack)

This document describes the architectural design, database schemas, lightweight identity, real-time events, and testing details for the **ShelfLife** household inventory tracker application.

---

## 1. Stack Choices & Architecture

We reconstructed the application to conform exactly to the required stack:
* **Backend**: Express Server written in **TypeScript** (`backend/src/`).
* **Frontend**: React Single-Page Application bootstrapped with **Vite & Tailwind CSS v4** (`frontend/src/`).
* **Database**: Microsoft SQL Server (**MS SQL**), using the official `mssql` client driver (`backend/src/db.ts`).

### Local Development Resilience (No-Friction Fallback)
Since MS SQL Server cannot run natively on macOS and Docker is not available in the workspace environment, we designed the database connector in `backend/src/db.ts` to be highly resilient:
* If the user configures MS SQL connection parameters in the `.env` file, the server connects directly to the MS SQL instance and initializes the database tables dynamically.
* If no MS SQL configurations are provided or the connection fails, the database driver automatically logs a warning and falls back to a **zero-friction In-Memory database**.
* **This fallback ensures the application runs instantly out of the box** after executing `npm install` and `npm run dev` in both folders, conforming to the local-only instructions.

---

## 2. Identity Guardrail & PIN Login

We implemented a **Passwordless PIN-based Identity** check:
* **Registration**: When a display name (e.g., `Alice`) is first submitted, the server generates a random 6-digit numeric PIN. The display name and PIN are stored in `localStorage` in the browser.
* **Impersonation Prevention**: If someone else on another browser/device attempts to log in as `Alice`, the server checks the database and requires her 6-digit PIN. If they cannot provide it, they are blocked.
* **Reveal PIN UI**: Users can click the "Key" icon in the header to show and copy their PIN, allowing them to log in on secondary devices (such as kitchen tablets or mobile phones).

---

## 3. Quantity Modeling

We modeled three clean quantity representations in the database to prevent placeholders or fake numbers:
* **Count** (e.g. `4 onions`): stored with `quantityType: "count"`, `quantityValue: 4`, and `unit: null`.
* **Weight** (e.g. `2kg flour`): stored with `quantityType: "weight"`, `quantityValue: 2`, and `unit: "kg"`.
* **Presence Only** (e.g. `Salt`): stored with `quantityType: "boolean"`, `quantityValue: null`, and `unit: null`.

The UI modal dynamically hides/shows fields depending on the selected quantity type, preventing users from being forced to input numbers.

---

## 4. Real-time Synchronization (SSE + Polling Fallback)

* **Server-Sent Events (SSE)**: We exposed `/api/events` in the backend. The router registers each response stream in an active Set. Whenever a user adds, edits, deletes, or consumes an item, the server broadcasts an event packet to all active streams.
* **Fallback Polling**: The client hook `useRealTime` establishes an `EventSource` connection. If the connection fails or drops, it automatically drops back to polling the `/api/items` endpoint every 5 seconds. This guarantees that screen updates work under any networking constraint.

---

## 5. Integration Tests

We included a comprehensive Jest test suite at `backend/tests/api.test.ts` running 14 assertions:
* **Identity Guardrail**: Asserts display name lengths, character formats, registration PIN creation, and login credential checks.
* **API Validation**: Verifies that empty name submissions, missing categories, negative counts, and invalid weight units (anything other than `g`/`kg`) are strictly rejected.
* **CRUD & Consumption**: Asserts adding items, editing quantities, marking items as used, and deleting mistaken entries.

---

## 6. Resolutions of Architectural Tensions

The project specifications contain four distinct points of tension. Here is how we resolved them:

### 1. Casual Login vs. Impersonation Prevention
* **Tension**: Users want a frictionless login (just a name, no passwords), but they also don't want housemates logging in under someone else's name to make edits.
* **Resolution**: We implemented a **Passwordless PIN-based Guardrail**. Upon first registering a name, the server generates a unique 6-digit PIN and stores it in the client session storage. If another device or browser tries to log in as that user, they must provide the PIN. A "Key" icon allows users to view and copy their PIN to secondary devices.

### 2. Diverse Quantities (Numeric, Weight, Binary)
* **Tension**: Quantities differ depending on the item: counted (4 onions), weighed (500g rice), or binary presence (salt is either there or not). We must support all three without forcing users to type fake numbers.
* **Resolution**: The `Items` schema uses an explicit `quantityType` column (`count`, `weight`, or `boolean`). If `boolean` ("Presence Only") is selected, the input fields for quantity values and units are disabled and stored as `null` in the database, preventing fake numbers.

### 3. "No Full Edit History" vs. Knowing Who Used the Last Unit
* **Tension**: Housemates want to know who used the last unit of something (to assign restocking duties) but explicitly rejected building a heavy, bloated historical edit tracking system.
* **Resolution**: The `Items` schema includes three direct tracking fields: `addedById`, `lastTouchedById`, and `usedUpById`. When an item's status is toggled to `used`, the `usedUpById` field is populated with the ID of the active user. This stores the necessary restocking data directly on the item, avoiding complex version tracking.

### 4. Real-time Consistency Mechanism
* **Tension**: Multiple users must see changes immediately without heavy server connection overhead.
* **Resolution**: We chose **Server-Sent Events (SSE)** with a **5-second Polling Fallback**. SSE uses standard HTTP streaming to broadcast updates to all active clients instantly upon item CRUD actions, avoiding the complex state management of WebSockets. In environments where SSE is blocked (e.g. firewall/old browser), the client falls back to 5-second polling, ensuring consistency within the 1-minute constraint.

