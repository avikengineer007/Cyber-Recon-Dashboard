# 🛡️ Cyber Recon — Operations & Threat Intelligence Dashboard

**Cyber Recon** is a premium, web-based security reconnaissance and passive intelligence platform. Designed for security operators and administrators, it aggregates public reconnaissance tools and vulnerability pipelines into a visually stunning, telemetry-driven operations dashboard.

---

## 🚀 Key Features

*   **Operator Authentication**: Secure credentials login built on top of `NextAuth`. Includes a developer profile bypass and operator registration.
*   **SSL/TLS Handshake Verifier**: Establish direct socket handshakes to analyze remote certificates, verifying issuer chains, signature algorithms, bit-strength, and checking for validity/expiration. Includes a live handshake trace logger.
*   **WHOIS Directory Lookup**: Retrieve registrar details, name servers, domain creation/update/expiration calendars, and registry status.
*   **DNS Chain Analyzer**: Resolve standard DNS record grids (A, AAAA, MX, NS, TXT, CNAME) for target hostnames.
*   **CVE Search Catalog**: Search for published vulnerabilities against live CVE indexes (with local mock fallbacks).
*   **XML Scan Ingestion**: Ingest and parse Nmap or security scanner XML report logs into structured interactive tables mapping open ports, active services, OS versions, and threat profiles.
*   **Audit Telemetry**: Real-time logging of operator queries, system telemetry streams, and login handshakes.
*   **Prisma Database & In-Memory Fallback**: Configured for Neon or PostgreSQL. If the database link fails, the application automatically falls back to an in-memory mock database state, guaranteeing immediate out-of-the-box local operations.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js 15 (App Router, Server Actions, API routes)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS & Lucide Icons (Dark Cyberpunk / Glassmorphism UI)
*   **Database & ORM**: PostgreSQL & Prisma ORM
*   **Authentication**: NextAuth.js (v5 Beta)
*   **Charting**: Recharts for telemetry visualizations
*   **Deployment**: Docker & Docker Compose

---

## 🏃 Getting Started

### 📋 Prerequisites

*   **Node.js**: Version 20.x or higher
*   **Package Manager**: `npm` (comes with Node.js)
*   **Database**: PostgreSQL (Optional, as the application falls back to an in-memory database if not available)

### 📦 Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/avikengineer007/Cyber-Recon-Dashboard.git
    cd Cyber-Recon-Dashboard
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Copy the sample environment file and configure variables:
    ```bash
    cp .env.example .env
    ```
    Configure the following variables in `.env`:
    *   `DATABASE_URL`: Connection string for PostgreSQL (e.g. Neon or local PG)
    *   `DIRECT_URL`: Direct database connection string (required for serverless pooling)
    *   `NEXTAUTH_SECRET`: Secret key for session security (generated via `openssl rand -base64 32`)
    *   `NEXTAUTH_URL`: Canonical URL of the application. For local development, use `http://localhost:8080`.

4.  **Database Migration** (If database is configured):
    Generate Prisma Client and push schemas:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### ⚡ Running Locally

Start the Next.js development server:
```bash
npm run dev
```
The application will launch on **[http://localhost:8080](http://localhost:8080)**.

To build and run in production mode:
```bash
npm run build
npm run start
```

---

## 🐳 Docker Deployment

The project is fully containerized and ready to deploy using Docker.

### Running with Docker Compose

To start both the Web App and a PostgreSQL database in Docker containers, execute:
```bash
docker-compose up --build -d
```
This spins up:
*   **PostgreSQL**: Exposed on port `5432`
*   **Cyber Recon Web App**: Exposed on port `3000` (Visit **[http://localhost:3000](http://localhost:3000)**)

To tear down the containers:
```bash
docker-compose down -v
```

---

## 🔑 Operator Authentication & Role Keys

*   **Developer Bypass Account**:
    *   **Security Email**: `admin@recon.local`
    *   **Passcode**: `admin123`
*   **Operator Registration**:
    *   Operators can register new accounts via the registration interface.
    *   To register with the `ADMIN` role, use the security code: `ADMIN_SECRET_KEY_2026`.
