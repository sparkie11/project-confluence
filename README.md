# Confluencr Project

This project consists of a FastAPI backend and a React frontend.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

*   Python 3.8+
*   Node.js (LTS version)
*   npm or yarn
*   A Supabase project with a PostgreSQL database.

### Backend Setup

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**

    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure environment variables:**

    Create a `.env` file in the `backend` directory with your Supabase database URL. Replace `YOUR_DATABASE_URL` with your actual Supabase connection string (including `sslmode=require`).

    ```
    DATABASE_URL="YOUR_DATABASE_URL"
    ```

5.  **Run the backend service:**

    ```bash
    python -m dotenv run uvicorn main:app --reload
    ```

    The backend API will be available at `http://localhost:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**

    Create a `.env` file in the `frontend` directory with your Supabase project URL and anonymous key. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase credentials.

    ```
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

4.  **Run the frontend development server:**

    ```bash
    npm run dev
    ```

    The frontend application will be available at `http://localhost:5173`.

## Testing the Service

### Single Transaction Test

1.  Ensure both backend and frontend services are running.
2.  Send a webhook request to the backend:

    ```bash
    curl -X POST "http://localhost:8000/v1/webhooks/transactions" \
         -H "Content-Type: application/json" \
         -d '{
               "transaction_id": "test-transaction-123",
               "source_account": "account-A",
               "destination_account": "account-B",
               "amount": 100.50,
               "currency": "USD"
             }'
    ```

3.  After approximately 30 seconds, verify the transaction status:

    ```bash
    curl "http://localhost:8000/v1/transactions/test-transaction-123"
    ```

    The response should show `"status": "PROCESSED"`.

### Duplicate Prevention Test

1.  Send the same webhook request multiple times (as shown in the single transaction test).
2.  The first request will queue the transaction for processing.
3.  Subsequent requests with the same `transaction_id` should return `{"message": "Webhook already received and processing/processed", "status": "PROCESSING"}` without creating new entries or re-processing.

## Technical Choices

### FastAPI Backend

*   **Asynchronous Processing:** FastAPI's `BackgroundTasks` are used to handle the 30-second transaction processing delay. This ensures the webhook endpoint responds immediately (within 500ms) with a `202 Accepted` status, fulfilling the performance requirement. The actual processing happens in the background, preventing the client from waiting.
*   **Idempotency:** The `receive_webhook` endpoint checks for existing `transaction_id`s before creating a new entry. If a transaction with the same ID already exists, it returns an acknowledgment without re-processing, ensuring idempotency.
*   **Database:** SQLAlchemy is used as the ORM for interacting with the PostgreSQL database (Supabase). This provides a robust and flexible way to manage data models and transactions.
*   **Environment Variables:** Sensitive information like the database URL is managed through environment variables (`.env` file and `python-dotenv`), enhancing security and making the application configurable across different environments.

### React Frontend (Vite)

*   **Modern Tooling:** Vite provides a fast development experience with features like hot module replacement and optimized builds.
*   **Component-Based Architecture:** React facilitates building a modular and reusable UI.
*   **Supabase Client:** The `@supabase/supabase-js` library is used for easy interaction with the Supabase backend, including authentication and database operations.
*   **Environment Variables:** Frontend environment variables (`.env` file and `VITE_` prefix) are used to configure the Supabase client, ensuring flexibility and security.