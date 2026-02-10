# AI Market Intelligence Dashboard - Project Handover Report

## 1. Project Status Summary
*   **Project Name:** AI Market Intelligence Dashboard
*   **Core Objective:** Pivot from a "Weekly Newsletter" to a "Real-time Dashboard" that visualizes high-signal AI news, filtering out noise using LLMs.
*   **Current State:**
    *   **Backend:** Fully functional MVC architecture with a robust AI processing pipeline.
    *   **Database:** PostgreSQL (via Prisma) seeded with 3 weeks of historical data (~35 high-signal articles).
    *   **Frontend:** Clean slate (ready for new implementation).

---

## 2. Backend Architecture & Flow
The backend runs on **Node.js** with **Express**. It is designed as a multi-stage pipeline.

### A. File Structure & Responsibilities

| File Path | Role | Description |
| :--- | :--- | :--- |
| **`server/index.js`** | **Entry Point** | Initializes the server, sets up Cron jobs (Scheduler), and mounts routes. |
| **`server/src/routes/`** | **Traffic Control** | Defines API endpoints (e.g., `GET /api/news`) and directs them to the correct Controller. |
| **`server/src/controllers/`** | **Logic Hub** | Handles request/response logic. Bridges API and Services. |
| **`server/src/services/`** | **The Engine** | Contains the core business logic (Scraper, LLM, Stats). |
| **`server/src/lib/prisma.js`** | **Database** | Singleton instance of Prisma Client (PostgreSQL). |

### B. The "Smart" Pipeline (How it works)

1.  **Ingestion (`newsScraper.js`):**
    *   **Trigger:** Cron (3:00 AM) or Manual Button (`POST /api/scrape`).
    *   **Action:** Fetches raw data from NewsAPIs.
    *   **Refinement:** Scrapes *full text content* from the source URL.
    *   **Storage:** Saves as "Raw Candidates" (Category: "AI", partially scored).

2.  **Analysis (`llmProcessor.js`):**
    *   **Trigger:** Cron (3:30 AM) or triggered immediately after manual scrape.
    *   **Action:** Batches articles (3-5 at a time).
    *   **AI Logic:** OpenRouter (DeepSeek) analysis using a **Strict Taxonomy** (Novelty, Impact, Substance).
    *   **Output:** Updates DB with classification (Impact Type, Sentiment) and "Curator Score".

3.  **Visualization (`statsAggregator.js`):**
    *   **Trigger:** Frontend Dashboard load (`GET /api/stats`).
    *   **Action:** Aggregates data for charts (Trends, Sentiment Matrix, Impact Distributions).

### C. Development Scripts (Git Ignored)
The following scripts were used for development and testing but are excluded from the repo:
*   `seed_historical_data.js`: Backfilled Jan/Feb data using real AI processing.
*   `audit_db.js`: Diagnostic tool to verify data quality.
*   `test_ai_pipeline.js`: Unit test for the LLM integration.

---

## 3. API Endpoints Reference
Use these endpoints to build your Frontend:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | **`/api/news`** | Returns the latest 50 articles. |
| `GET` | **`/api/news?filter=high-signal`** | Returns only articles with `curatorScore >= 70`. |
| `GET` | **`/api/stats`** | Returns JSON for charts (Trends, Matrix, Impact). |
| `POST` | **`/api/scrape`** | Triggers the **Full Pipeline** (Fetch + Immediate AI Analysis). |

---

## 4. Helpful Commands

**Start the Backend:**
```bash
cd my-news-app && cd server
npm start
```

**Start the Frontend:**
```bash
cd my-news-app && cd client
npm run dev
```

**Run Database Studio (Visual Editor):**
```bash
cd server
npx prisma studio
```
