# AI-Powered RFP Management System

**Transform natural language into structured RFPs, automate vendor communication, and make data-driven decisions with AI-powered proposal comparison.**

---

## Overview

This system solves the end-to-end RFP workflow by automating what used to be a manual, error-prone process. Here's how it works in simple terms:

1. **You describe your needs** in plain English (e.g., "I need 100 laptops with 16GB RAM, delivery in 30 days, budget $50k")
2. **AI converts it** into a structured RFP with all the details extracted automatically
3. **You select vendors** from your database and hit send
4. **The system emails** a professional RFP to each vendor
5. **Vendors reply** via email with their proposals
6. **AI parses** their responses into structured data (pricing, delivery, warranty, etc.)
7. **You compare** all proposals side-by-side with AI-generated summaries, scores, and recommendations

No more copying data between spreadsheets, manually parsing emails, or trying to compare apples to oranges. The system handles the heavy lifting so you can focus on making decisions.

---

## Problem Statement

Traditional RFP processes are slow, error-prone, and unstructured. Here's what typically happens:

- **Manual data entry**: Someone types requirements into a template, often missing details or making typos
- **Inconsistent formats**: Each vendor replies differently—some in tables, some in paragraphs, some with attachments
- **Time-consuming comparison**: You spend hours copying data into spreadsheets and trying to normalize it
- **Human error**: Misreading prices, missing delivery dates, or overlooking important terms
- **No audit trail**: Hard to track what was sent, when, and who responded

This system automates the entire workflow using AI, ensuring consistency, reducing errors, and saving hours of manual work. The AI handles the messy parts—extracting structured data from natural language, parsing vendor emails, and generating comparative analysis—so you get clean, actionable data every time.

---

## Tech Stack

### Frontend

- **React 19** with **Vite** - Modern, fast development experience
- **Material UI (MUI)** - Polished, professional UI components
- **React Query (TanStack Query)** - Efficient data fetching and caching
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing

### Backend

- **NestJS** - Enterprise-grade Node.js framework with TypeScript
- **Node.js 22** - ⚠️ **REQUIRED VERSION** - See Prerequisites below
- **TypeORM** - Type-safe database ORM with PostgreSQL
- **Zod** + **class-validator** - Schema validation for inputs and AI outputs
- **Swagger/OpenAPI** - Auto-generated API documentation

### Database

- **PostgreSQL** - Robust relational database with JSONB support for flexible schemas
- Currently configured for Aiven Cloud PostgreSQL (connection in `app.module.ts`)
- Can be configured for local PostgreSQL or other cloud providers

### AI & Email

- **Google Gemini 2.5 Flash** - Fast, cost-effective AI for structured data extraction
- **Nodemailer** - SMTP email sending
- **ImapFlow** - IMAP email receiving (polling-based)
- **dotenv** - Environment variable management

---

## Prerequisites

### ⚠️ Critical: Node.js Version

**This project REQUIRES Node.js version 22.**
**Why?** The project uses modern Node.js features and dependencies that require version 22. Running with an older version will cause build errors.

### Other Requirements

- **PostgreSQL Database** - The project is currently configured to use Aiven Cloud PostgreSQL (connection details in `backend/src/app.module.ts`). For local development, you can set up your own PostgreSQL instance or modify the connection string.
- **Google Gemini API Key** - Get one at https://aistudio.google.com/apikey
- **SMTP Credentials** - For sending emails (Gmail, SendGrid, Mailgun, etc.)
- **IMAP Credentials** - For receiving vendor replies (same as SMTP for Gmail)

---

## Project Setup

### Prerequisites

#### Node.js Version

⚠️ **CRITICAL: This project REQUIRES Node.js version 22**

- The project uses modern Node.js features and dependencies that require version 22
- Running with an older version will cause build errors
- Use `nvm use 22` (if using nvm) or install Node.js 22 directly

#### Database

- **PostgreSQL** (version 12 or higher recommended)
- Can use local PostgreSQL or cloud providers (Aiven, AWS RDS, etc.)
- Default database name: `rfp_db` (can be configured via environment variables)

#### API Keys & Credentials

- **Google Gemini API Key** - Get one at https://aistudio.google.com/apikey
- **Email Credentials** (for SMTP sending):
  - Gmail: Enable 2-Step Verification and create an App Password
- **IMAP Credentials** (for receiving vendor replies):
  - Gmail: Use the same App Password as SMTP

### Installation Steps

#### 1. Clone Repository

```bash
git clone <your-repo-url>
cd rfp-project
```

#### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in all required values (see [Environment Variables](#environment-variables) section below).

**Required variables:**

- `GEMINI_API_KEY` - Your Google Gemini API key
- `SMTP_USER`, `SMTP_PASS` - Email sending credentials
- `IMAP_USER`, `IMAP_PASS` - Email receiving credentials (optional if not using email receiving)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - Database connection details

#### 3. Set Up Backend

```bash
cd backend

# Use Node.js 22 (if using nvm)
nvm use 22

# Install dependencies
npm install

# (Optional) Run seed script to populate database with sample data
npm run seed

# Start development server
npm run start:dev
```

The backend will start on **http://localhost:7676**

- Swagger API documentation: **http://localhost:7676/api**

#### 4. Set Up Frontend

Open a **new terminal** window:

```bash
cd frontend

# Use Node.js 22 (if using nvm)
nvm use 22

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on **http://localhost:5173**

#### 5. Verify Setup

1. Open http://localhost:5173 in your browser
2. You should see the landing page
3. Try creating a test RFP to verify AI integration works
4. Check http://localhost:7676/api for Swagger documentation

### Database Setup

#### Local PostgreSQL Setup

If using local PostgreSQL:

```bash
# Create database (PostgreSQL CLI)
createdb rfp_db

# Or using psql
psql -U postgres
CREATE DATABASE rfp_db;
```

Then configure in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=rfp_db
```

#### Cloud PostgreSQL Setup

For cloud providers (Aiven, AWS RDS, etc.), use the connection details provided by your provider in `backend/.env`.

**Note:** The application uses `synchronize: true` in TypeORM for development, which automatically creates/updates tables. For production, disable this and use migrations.

### Email Configuration

#### Configuring Email Sending (SMTP)

**For Gmail:**

1. Enable **2-Step Verification** in your Google Account
2. Generate an **App Password**: https://myaccount.google.com/apppasswords
3. Use the app password (not your regular password) in `SMTP_PASS`

**For SendGrid:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

**For Mailgun:**

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your_mailgun_username
SMTP_PASS=your_mailgun_password
```

#### Configuring Email Receiving (IMAP)

**For Gmail:**

- Use the same App Password as SMTP
- Default settings work with Gmail IMAP

**For other providers:**

- Configure `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS` appropriately
- The system polls for new emails every 60 seconds

**Testing Email Receiving:**

1. Send a test RFP to a vendor
2. Reply to that email from the vendor's email address
3. Include the RFP ID in the subject or body
4. Wait up to 60 seconds (or trigger manual check via API: `POST /email/check-replies`)
5. The proposal should appear in the "Received Proposals" page

### Seed Data

The project includes a seed script that populates the database with sample data for testing:

```bash
cd backend
npm run seed
```

This creates:

- **3 sample vendors** (Tech Solutions Inc., Global Supplies Co., Premium Services Ltd.) (Please update your email id to recieve emails or add vendors via UI)

### Running Everything Locally

**Complete Local Development Setup:**

1. **Terminal 1 - Backend:**

   ```bash
   cd backend
   nvm use 22
   npm run start:dev
   ```

2. **Terminal 2 - Frontend:**

   ```bash
   cd frontend
   nvm use 22
   npm run dev
   ```

3. **Terminal 3 - Database (if using local PostgreSQL):**
   ```bash
   # Ensure PostgreSQL is running
   pg_ctl -D /usr/local/var/postgres start  # macOS
   # or use your system's PostgreSQL service manager
   ```

All services should now be running:

- Frontend: http://localhost:5173
- Backend: http://localhost:7676
- API Docs: http://localhost:7676/api

---

## Environment Variables

All environment variables go in `backend/.env`. A complete example file is provided at `backend/.env.example` - copy it to create your `.env` file:

```bash
cp backend/.env.example backend/.env
```

**⚠️ Never commit `.env` to version control** - it contains sensitive credentials.

Here's what you need:

### Required Variables

```env
# AI Configuration
GEMINI_API_KEY=your-api-key-here          # Get from https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash             # Optional, defaults to gemini-2.5-flash

DB_HOST=your_db_host
DB_PORT=your_db_port
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=rfp_db

# Email - Sending (SMTP)
SMTP_HOST=smtp.gmail.com                   # Your SMTP server
SMTP_PORT=587                              # Usually 587 for TLS
SMTP_USER=your-email@gmail.com            # Your email address
SMTP_PASS=your-app-password               # App password (not regular password)
SMTP_FROM=your-email@gmail.com            # From address (usually same as SMTP_USER)

# Email - Receiving (IMAP)
IMAP_HOST=imap.gmail.com                   # Your IMAP server
IMAP_PORT=993                              # Usually 993 for SSL
IMAP_USER=your-email@gmail.com            # Same as SMTP_USER
IMAP_PASS=your-app-password               # Same as SMTP_PASS
```

### Optional Variables

```env
# Application
PORT=7676                                  # Backend port (default: 7676)
FRONTEND_URL=http://localhost:5173        # For CORS (default: http://localhost:5173)
NODE_ENV=development                      # Environment mode

### Gmail Setup Tips

For Gmail specifically:

1. Enable **2-Step Verification** in your Google Account
2. Generate an **App Password**: https://myaccount.google.com/apppasswords
3. Use the app password (not your regular password) in both `SMTP_PASS` and `IMAP_PASS`

---

## System Architecture

Here's how the pieces fit together:

```

┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│ React │────────▶│ NestJS │────────▶│ PostgreSQL │
│ Frontend │ HTTP │ Backend │ SQL │ Database │
└─────────────┘ └─────────────┘ └──────────────┘
│
├─────────────┐
│ │
▼ ▼
┌──────────┐ ┌──────────┐
│ Gemini │ │ SMTP │
│ AI │ │ Email │
└──────────┘ └──────────┘
▲ │
│ │
┌──────────┐ │
│ IMAP │◀──────┘
│ Email │
└──────────┘

````

### Backend Module Structure

The backend is organized into focused modules:

- **`/rfp`** - RFP creation, management, and sending
- **`/vendor`** - Vendor CRUD operations
- **`/proposal`** - Proposal storage and comparison
- **`/email`** - SMTP sending and IMAP receiving
- **`/ai`** - AI service with prompt templates

Each module follows NestJS conventions: controller (routes), service (business logic), module (dependency injection), and DTOs (data validation).

---

## Data Models / Database Schema

The system uses three main entities:

### RFP Entity

```typescript
{
  id: UUID; // Unique identifier
  description_raw: TEXT; // Original natural language input
  structured_data: JSONB; // AI-extracted structured data:
  //   - budget: number
  //   - items: [{name, quantity, specifications}]
  //   - delivery_timeline: string
  //   - payment_terms: string
  //   - warranty: string
  //   - category: string
  created_at: TIMESTAMP; // When RFP was created
}
````

### Vendor Entity

```typescript
{
  id: UUID; // Unique identifier
  name: VARCHAR; // Vendor company name
  email: VARCHAR(unique); // Contact email
  metadata: JSONB; // Flexible JSON for additional info
  //   (e.g., industry, rating, notes)
  created_at: TIMESTAMP;
}
```

### Proposal Entity

```typescript
{
  id: UUID; // Unique identifier
  vendor_id: UUID(FK); // Links to Vendor
  rfp_id: UUID(FK); // Links to RFP
  raw_email: TEXT; // Original vendor email response
  structured_proposal: JSONB; // AI-parsed structured data:
  //   - price: number
  //   - items: [{name, quantity, unit_price, total_price}]
  //   - delivery_days: number
  //   - warranty: string
  //   - notes: string
  //   - completeness: number (0-100)
  ai_summary: TEXT; // AI-generated summary
  score: FLOAT; // Comparison score (0-100)
  created_at: TIMESTAMP;
}
```

**Why JSONB?** PostgreSQL's JSONB type gives us flexibility to store structured data without rigid schemas, while still allowing efficient querying and indexing. This is perfect for AI-generated data that might vary in structure.

---

## Design Decisions & Architecture Decision Records (ADRs)

This section documents key architectural and design decisions made during the development of this system.

### ADR-001: JSONB vs Normalized Tables for Structured Data

**Decision:** Use JSONB columns (`structured_data`, `structured_proposal`, `metadata`) instead of fully normalized relational tables.

**Context:**

- The system needs to store AI-extracted data that varies in structure
- RFP requirements can differ significantly (IT procurement vs consulting services vs facilities management)
- Vendor proposals have variable fields depending on the type of RFP
- AI outputs are structured but not perfectly consistent across all use cases

**Decision Drivers:**

1. **Flexibility**: AI-generated data structures vary, and we don't want to limit future RFP types
2. **Simplicity**: Faster to implement and iterate without complex schema migrations
3. **Performance**: JSONB allows efficient querying and indexing of nested data
4. **Development Speed**: No need to design and migrate tables for every new field type

**Alternatives Considered:**

1. **Fully Normalized Schema**: Separate tables for items, pricing, warranties, etc.
   - Pros: Strong type safety, clear relationships, easier reporting
   - Cons: Complex migrations for new RFP types, rigid schema, more joins
   - Rejected because it limits flexibility for diverse RFP types

2. **Hybrid Approach**: Core fields normalized, metadata as JSONB
   - Pros: Balance of structure and flexibility
   - Cons: Added complexity, still requires migrations for core fields
   - Considered but rejected due to added complexity without sufficient benefit

**Trade-offs:**

- ✅ **Pros:**
  - Flexible schema accommodates any RFP type
  - Fast iteration without migrations
  - PostgreSQL JSONB provides efficient querying
  - Easy to add new fields without code changes
- ❌ **Cons:**
  - Less type safety at the database level
  - Harder to write complex analytical queries
  - Requires careful validation in application code (handled via Zod schemas)

**Validation:**

- All JSONB data is validated using Zod schemas before storage
- TypeScript types provide compile-time safety
- JSONB indexes enable efficient queries on nested fields when needed

**Future Considerations:**

- If specific queries become common, we can add generated columns or views
- For analytics/reporting, we can extract key fields to separate normalized tables
- Current approach supports MVP while maintaining flexibility for future needs

### ADR-002: IMAP Polling vs Webhooks for Email Receiving

**Decision:** Use IMAP polling (checking every 60 seconds) instead of webhooks for receiving vendor email replies.

**Context:**

- Need to receive vendor proposal replies via email
- Different email providers have different capabilities
- System needs to work with common email providers (Gmail, Outlook, etc.)

**Decision Drivers:**

1. **Universal Compatibility**: IMAP works with all email providers
2. **No Additional Infrastructure**: Doesn't require webhook endpoints or additional services
3. **Simplicity**: Easier to implement and debug
4. **Privacy**: No need to expose public endpoints

**Alternatives Considered:**

1. **Email Webhooks** (SendGrid, Mailgun)
   - Pros: Real-time, no polling overhead
   - Cons: Requires webhook infrastructure, provider-specific
   - Not chosen: Adds complexity and provider lock-in

2. **Email Service API** (Gmail API, Microsoft Graph)
   - Pros: Real-time, more control
   - Cons: OAuth complexity, provider-specific
   - Not chosen: More complex setup, requires OAuth flows

**Trade-offs:**

- ✅ **Pros:**
  - Works with any email provider
  - Simple implementation
  - No public endpoints needed
  - Predictable polling interval
- ❌ **Cons:**
  - 60-second delay (acceptable for RFP workflow)
  - Continuous polling (minimal overhead for low volume)

**Future Considerations:**

- Can add webhook support as an option for providers that support it
- Polling interval can be adjusted based on needs
- For high-volume scenarios, consider event-driven architecture

### ADR-003: Google Gemini 2.5 Flash for AI Processing

**Decision:** Use Google Gemini 2.5 Flash as the primary AI model for all AI operations.

**Context:**

- Need reliable, fast AI for structured data extraction
- Cost-effectiveness is important for MVP
- JSON output consistency is critical

**Decision Drivers:**

1. **Performance**: Fast response times for good user experience
2. **Cost**: Cost-effective for structured data extraction tasks
3. **JSON Output**: Reliable structured JSON generation
4. **API Stability**: Well-documented, stable API

**Trade-offs:**

- ✅ **Pros:**
  - Fast response times
  - Cost-effective
  - Good JSON generation
  - Single model simplifies codebase
- ❌ **Cons:**
  - Single point of failure (mitigated by error handling)
  - No automatic fallback (can be added later)

**Future Considerations:**

- Can add fallback models (GPT-4, Claude) for improved reliability
- Can implement retry logic with exponential backoff
- Model can be switched via environment variable for testing

### ADR-004: ConfigService vs Direct process.env Access

**Decision:** Use NestJS ConfigService consistently throughout the application instead of direct `process.env` access.

**Context:**

- NestJS provides ConfigService for managing configuration
- Mixed usage creates inconsistency and testing challenges
- ConfigService provides type safety and validation capabilities

**Rationale:**

1. **Consistency**: Single pattern for configuration access
2. **Testability**: Easier to mock ConfigService in tests
3. **Type Safety**: Can provide default values and type hints
4. **Future-Proof**: Enables configuration validation and schema validation

**Implementation:**

- All configuration access uses `configService.get<T>()` method
- Default values provided where appropriate
- ConfigModule is global for easy injection

### ADR-005: Draft RFPs Feature

**Decision:** Support draft RFPs that don't require AI processing until ready to send.

**Context:**

- Users may want to save RFPs before they're complete
- AI processing costs money and time
- Users might want to edit descriptions before generating structured data

**Rationale:**

1. **User Experience**: Allows saving work in progress
2. **Cost Optimization**: Avoids unnecessary AI API calls
3. **Flexibility**: Users can refine descriptions before AI processing

**Implementation:**

- `is_draft` flag on RFP entity
- Drafts have empty/default structured_data
- Conversion endpoint generates structured data when ready

---

## Core Features (High-Level)

### 1. Create RFP from Natural Language

**Flow**: Type description → AI converts → Preview structured data → Regenerate if needed → Send to vendors

- Enter your requirements in plain English
- AI extracts budget, items, quantities, timelines, terms, warranty
- See structured JSON and email preview side-by-side
- Regenerate if AI missed something or you want different extraction
- Edit description and regenerate until it's perfect
- Select multiple vendors and send with one click

**Example Input**: "I need 100 laptops with 16GB RAM, Intel i7, SSD storage. Delivery within 30 days. Budget $50,000. Payment terms: Net 30. Warranty: 2 years."

**AI Output**: Structured JSON with all fields extracted, ready to send.

### 2. Vendor Management (CRUD)

- Create, read, update, delete vendors
- Store vendor metadata (industry, rating, notes) as flexible JSON
- Multi-select vendors when sending RFPs
- View all vendors in a clean list interface

### 3. View Sent Proposals

- See all RFPs you've sent to vendors
- Track delivery status per vendor (sent/pending/failed)
- View email previews and structured data
- See timestamps and error messages for failed sends
- Compact, grouped view by RFP

### 4. Receive & Compare Proposals

**Receive Flow**: Vendor replies via email → IMAP listener picks it up → AI parses → Proposal appears in system

**Compare Flow**: View received proposals → Click "Compare" → AI analyzes all proposals → Get scores, summaries, and recommendations

- Automatic email parsing when vendors reply
- AI extracts pricing, delivery, warranty, notes
- View parsed proposals with AI summaries
- Compare multiple proposals side-by-side
- Get AI-generated scores (0-100) for each vendor
- See recommended vendor with reasoning
- Deterministic scoring for consistent comparisons

---

## API Documentation

The system exposes a RESTful API following RESTful conventions. Full interactive documentation is available at `http://localhost:7676/api` (Swagger UI) when the backend is running.

### Base URL

- **Development:** `http://localhost:7676`
- **Production:** Configure via `FRONTEND_URL` and reverse proxy

All endpoints return JSON and use standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, missing data)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Main Endpoints

#### RFP Management

#### RFP Management

**Create RFP from Natural Language**

```http
POST /rfps
Content-Type: application/json

{
  "description": "I need 100 laptops with 16GB RAM, Intel i7, SSD storage. Delivery within 30 days. Budget $50,000. Payment terms: Net 30. Warranty: 2 years."
}
```

**Success Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description_raw": "I need 100 laptops with 16GB RAM...",
  "structured_data": {
    "budget": 50000,
    "budget_currency": "USD",
    "items": [
      {
        "name": "laptops",
        "quantity": 100,
        "specifications": "16GB RAM, Intel i7, SSD storage"
      }
    ],
    "delivery_timeline": "30 days",
    "payment_terms": "Net 30",
    "warranty": "2 years",
    "category": "IT Equipment"
  },
  "is_draft": false,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "The description provided is not detailed enough to create a valid RFP...",
  "error": "Bad Request"
}
```

---

**Get All RFPs**

```http
GET /rfps
```

**Success Response (200):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "description_raw": "...",
    "structured_data": {...},
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

---

**Get RFP by ID**

```http
GET /rfps/:id
```

**Success Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description_raw": "...",
  "structured_data": {...},
  "proposals": [
    {
      "id": "...",
      "vendor_id": "...",
      "score": 85,
      "ai_summary": "..."
    }
  ],
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "RFP with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

**Create Draft RFP**

```http
POST /rfps/drafts
Content-Type: application/json

{
  "description": "Draft description - will be processed later"
}
```

**Success Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description_raw": "Draft description...",
  "structured_data": {
    "budget": null,
    "items": [],
    ...
  },
  "is_draft": true,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

---

**Get All Drafts**

```http
GET /rfps/drafts
```

---

**Convert Draft to RFP**

```http
POST /rfps/:id/convert-to-rfp
Content-Type: application/json

{
  "description": "Optional: Updated description"
}
```

---

**Update RFP**

```http
PATCH /rfps/:id
Content-Type: application/json

{
  "description": "Updated description with more details..."
}
```

**Note:** Updating description regenerates structured_data using AI.

---

**Regenerate Structured Data**

```http
POST /rfps/:id/regenerate
```

**Success Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "structured_data": {
    // New AI-generated structured data
  }
}
```

---

**Send RFP to Vendors**

```http
POST /rfps/:id/send
Content-Type: application/json

{
  "vendor_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Success Response (200):**

```json
[
  {
    "vendor_id": "550e8400-e29b-41d4-a716-446655440001",
    "success": true,
    "message": "Email sent successfully to vendor@example.com"
  },
  {
    "vendor_id": "550e8400-e29b-41d4-a716-446655440002",
    "success": false,
    "message": "Failed to send email: Invalid email address"
  }
]
```

---

**Get Email Preview**

```http
GET /rfps/:id/email-preview
```

**Success Response (200):**

```json
{
  "subject": "RFP Request - IT Equipment",
  "html": "<html>...professional email HTML...</html>",
  "text": "Plain text version of email..."
}
```

#### Vendor Management

**Create Vendor**

```http
POST /vendors
Content-Type: application/json

{
  "name": "Tech Solutions Inc.",
  "email": "vendor@example.com",
  "metadata": {
    "industry": "IT",
    "rating": 4.5,
    "notes": "Reliable vendor for hardware"
  }
}
```

**Success Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Tech Solutions Inc.",
  "email": "vendor@example.com",
  "metadata": {
    "industry": "IT",
    "rating": 4.5,
    "notes": "Reliable vendor for hardware"
  },
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

---

**Get All Vendors**

```http
GET /vendors
```

**Success Response (200):**

```json
[
  {
    "id": "...",
    "name": "Tech Solutions Inc.",
    "email": "vendor@example.com",
    "metadata": {...},
    "created_at": "..."
  }
]
```

---

**Get Vendor by ID**

```http
GET /vendors/:id
```

---

**Update Vendor**

```http
PATCH /vendors/:id
Content-Type: application/json

{
  "name": "Updated Company Name",
  "metadata": {
    "rating": 4.8
  }
}
```

---

**Delete Vendor**

```http
DELETE /vendors/:id
```

**Success Response (200):**

```json
{
  "message": "Vendor deleted successfully"
}
```

#### Proposal Management

**Get All Proposals**

```http
GET /proposals
```

**Success Response (200):**

```json
[
  {
    "id": "...",
    "vendor_id": "...",
    "rfp_id": "...",
    "vendor_name": "Tech Solutions Inc.",
    "vendor_email": "vendor@example.com",
    "raw_email": "Original email text...",
    "structured_proposal": {
      "price": 48000,
      "items": [...],
      "delivery_days": 25,
      "warranty": "2 years",
      "completeness": 95
    },
    "ai_summary": "Vendor offers competitive pricing...",
    "score": 85,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

---

**Get Proposals for RFP**

```http
GET /proposals/rfp/:rfpId
```

---

**Get Proposal by ID**

```http
GET /proposals/:id
```

---

**Compare Proposals for an RFP**

```http
GET /proposals/rfp/:rfpId/compare
```

**Success Response (200):**

```json
{
  "summary": "AI-generated comparison of all proposals showing key differences in pricing, delivery, and value...",
  "scores": {
    "550e8400-e29b-41d4-a716-446655440001": {
      "score": 85,
      "reasoning": "Competitive pricing with good delivery timeline. Strong warranty terms."
    },
    "550e8400-e29b-41d4-a716-446655440002": {
      "score": 72,
      "reasoning": "Higher price but excellent warranty. Delivery timeline is longer."
    }
  },
  "recommended_vendor": {
    "vendor_id": "550e8400-e29b-41d4-a716-446655440001",
    "reason": "Best balance of price, delivery speed, and warranty coverage."
  }
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Need at least 2 proposals to compare",
  "error": "Bad Request"
}
```

---

**Update Proposal**

```http
PATCH /proposals/:id
Content-Type: application/json

{
  "structured_proposal": {
    "price": 47500,
    "delivery_days": 20
  },
  "score": 90
}
```

**Note:** Used for manual corrections when AI parsing needs adjustment.

#### Email Management

**Get All Sent Emails**

```http
GET /email/sent
```

**Success Response (200):**

```json
[
  {
    "id": "...",
    "rfp_id": "...",
    "vendor_id": "...",
    "vendor_email": "vendor@example.com",
    "subject": "RFP Request - IT Equipment",
    "sent_at": "2024-01-15T10:30:00.000Z",
    "status": "sent",
    "error_message": null
  }
]
```

---

**Get Sent Emails for RFP**

```http
GET /email/sent/rfp/:rfpId
```

---

**Manually Check for New Email Replies**

```http
POST /email/check-replies
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Checked for new emails successfully",
  "processed": 3
}
```

**Note:** This triggers the IMAP email checking process manually. The system automatically checks every 60 seconds, but this endpoint allows immediate checking.

All endpoints use proper HTTP status codes, return JSON, and include error messages in a consistent format.

---

## AI Integration & Prompt Design

The system uses three AI functions, each with carefully designed prompts:

### 1. `generateStructuredRfp(description: string)`

**Purpose**: Convert natural language RFP description into structured JSON

**Process**:

1. User provides free-form text description
2. Prompt instructs AI to extract: budget, items (name, quantity, specifications), delivery_timeline, payment_terms, warranty, category, metadata
3. AI returns JSON only (enforced via prompt)
4. Output validated against Zod schema
5. If validation fails or data is too vague, user gets helpful error message

**Prompt Location**: `backend/src/ai/prompts/generate-rfp.prompt.ts`

**Key Design Decisions**:

- Prompt explicitly tells AI to return `null` for vague inputs (prevents hallucination)
- JSON-only output enforced with "Return ONLY valid JSON, no other text"
- Validation catches malformed JSON or missing required fields
- User sees clear error if description lacks detail

### 2. `parseVendorEmail(email_body: string)`

**Purpose**: Extract structured proposal data from vendor email replies

**Process**:

1. Raw email body (text) is extracted from IMAP
2. Prompt instructs AI to find: price, items, delivery_days, warranty, notes, completeness score
3. AI handles messy email formats (quoted replies, signatures, formatting)
4. Output validated against Zod schema
5. Proposal saved with structured data

**Prompt Location**: `backend/src/ai/prompts/parse-proposal.prompt.ts`

**Key Design Decisions**:

- Prompt emphasizes extracting from messy, real-world email formats
- Completeness score (0-100) helps identify incomplete proposals
- Handles cases where vendor doesn't provide all requested info
- Structured output enables programmatic comparison

### 3. `compareProposals(proposals: Proposal[])`

**Purpose**: Compare multiple proposals and generate scores/recommendations

**Process**:

1. All proposals for an RFP are collected
2. Prompt instructs AI to analyze: pricing, delivery, warranty, completeness, value
3. AI generates scores (0-100) for each vendor with reasoning
4. AI recommends best vendor with explanation
5. Scores and summaries saved to proposals

**Prompt Location**: `backend/src/ai/prompts/compare-proposals.prompt.ts`

**Key Design Decisions**:

- Deterministic scoring criteria (price, delivery, warranty, completeness)
- Explainable AI: each score includes reasoning
- Recommended vendor includes clear rationale
- Scores are numeric for easy sorting/filtering

### Prompt Storage & Validation

All prompts are stored in `backend/src/ai/prompts/` as TypeScript files, making them:

- Easy to version control
- Simple to modify and test
- Type-safe (imported as constants)

**JSON-Only Enforcement**: The system uses regex to extract JSON from AI responses (`content.match(/\{[\s\S]*\}/)`), then parses and validates with Zod. This handles cases where AI adds explanatory text before/after JSON.

**Validation**: Every AI output is validated against a Zod schema before being saved. Invalid outputs throw errors with helpful messages, preventing bad data from entering the system.

---

## Email Setup

### Outbound Email (SMTP)

The system sends professional HTML emails to vendors using SMTP.

**Configuration**:

- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `.env`
- Emails include structured RFP data in a clean, readable format
- Each email includes RFP ID in footer for tracking replies
- Subject line: "RFP Request - [Category]"

**Email Template**: The system generates HTML emails with:

- Professional header and styling
- Budget, items, delivery timeline, payment terms, warranty
- Clear call-to-action: "Reply to this email with your proposal"
- RFP ID for automatic matching

### Inbound Email (IMAP)

The system receives vendor replies via IMAP polling.

**How It Works**:

1. IMAP listener connects to your email inbox on startup
2. Checks for new unread emails every 60 seconds
3. Extracts email body, sender, subject
4. Attempts to match email to RFP using multiple heuristics:
   - RFP ID in subject or body
   - In-Reply-To header matching
   - Subject line patterns
   - Context-based matching (recent RFPs sent to this vendor)
5. If matched, AI parses email and creates proposal
6. Email marked as read

**Configuration**:

- Set `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS` in `.env`
- For Gmail, use same credentials as SMTP (app password)

**Manual Check**: You can manually trigger email checking via API:

```bash
POST /email/check-replies
```

**Local Testing**: To test inbound emails locally:

1. Send a test email to your configured IMAP inbox
2. Include RFP ID in subject: "Re: RFP Request - [Category] [RFP-ID]"
3. Or reply to a sent RFP email (In-Reply-To header will match)
4. Wait up to 60 seconds, or trigger manual check
5. Proposal should appear in "Received Proposals" page

**Webhook Alternative**: The system is designed to support webhooks (e.g., SendGrid, Mailgun) instead of IMAP. The `processIncomingEmail()` method can be called directly from a webhook endpoint.

---

## Testing / Seed Data

### Seed Database

The project includes a seed script that populates the database with sample data:

```bash
cd backend
npm run seed
```

This creates:

- 3 sample vendors (Tech Solutions Inc., Global Supplies Co., Premium Services Ltd.)
- 1 sample RFP (laptop procurement)
- 2 sample proposals (from different vendors)

Use this to quickly test the comparison feature or see how data is structured.

### Manual Testing Checklist

Follow this flow to test the complete system:

1. **Create RFP**
   - Go to Create RFP page
   - Enter: "I need 50 office chairs, ergonomic, delivery in 2 weeks, budget $10,000"
   - Click "Create RFP"
   - Verify structured data appears (budget: 10000, items: chairs, etc.)
   - Check email preview looks correct

2. **Regenerate RFP**
   - Click "Regenerate" button
   - Verify structured data updates (may be slightly different)
   - Check email preview updates

3. **Edit Description**
   - Click "Edit Description"
   - Modify text: "I need 50 office chairs, ergonomic, delivery in 2 weeks, budget $15,000"
   - Save
   - Verify budget updates to 15000

4. **Select Vendors & Send**
   - Go to Vendor List page, create vendors if needed
   - Return to Create RFP page
   - Select 2-3 vendors
   - Click "Send Email to Selected Vendors"
   - Check "Sent Proposals" page - should show sent status

5. **Simulate Vendor Reply**
   - Send an email to your IMAP inbox
   - Subject: "Re: RFP Request - Office Furniture [your-rfp-id]"
   - Body: "We can provide 50 ergonomic chairs at $180 each. Total: $9,000. Delivery: 10 days. Warranty: 5 years."
   - Wait 60 seconds or trigger manual check: `POST /email/check-replies`
   - Go to "Received Proposals" page - proposal should appear

6. **Compare Proposals**
   - If you have 2+ proposals for same RFP
   - Go to "Received Proposals" page
   - Click "Compare" button
   - Verify AI-generated scores, summaries, and recommendations appear

---

## Known Limitations

The system has some realistic constraints:

1. **RFP Matching Heuristics**: Matching vendor replies to RFPs uses heuristics (RFP ID, In-Reply-To, subject patterns, context). In rare cases, a reply might not match automatically and would need manual linking. This is a trade-off for simplicity—a production system might use more sophisticated matching or require manual confirmation.

2. **Email Parsing Accuracy**: While AI is good at extracting structured data from emails, very messy or non-standard formats might require manual correction. The system allows editing parsed proposals for this reason.

3. **IMAP Polling Delay**: The system checks for new emails every 60 seconds. For real-time processing, a webhook-based approach would be better, but IMAP polling works well for most use cases and doesn't require additional infrastructure.

4. **AI Output Validation**: The system validates AI outputs, but edge cases (very unusual vendor responses, ambiguous requirements) might produce unexpected results. The regenerate and edit features help users correct these cases.

5. **No OCR**: The system doesn't parse PDF attachments or images. Vendors must reply in plain text or HTML email format.

6. **Single Language**: Currently optimized for English. Non-English RFPs or vendor replies may have reduced accuracy.

These limitations are documented so users understand the system's boundaries and can work within them effectively.

---

## Assumptions

Several assumptions that were made in building this project:

1. **Email Threading**: Vendors reply in the same email thread (using In-Reply-To header) or include RFP ID in subject/body. This enables automatic matching.

2. **Structured Vendor Responses**: Vendors provide pricing, delivery, and warranty information in their email replies. The system can handle various formats, but completely unstructured responses may require manual correction.

3. **Optional Fields**: Not all RFPs will have all fields (budget, warranty, etc.). The system handles null/optional fields gracefully.

4. **Single RFP per Email**: Each vendor email reply corresponds to one RFP. If a vendor replies about multiple RFPs in one email, only the first/most relevant RFP will be matched.

5. **Vendor Email Consistency**: Vendors use the same email address registered in the system. Replies from different addresses won't automatically match to vendors.

6. **AI Model Availability**: Google Gemini 2.5 Flash is available and within rate limits. The system doesn't include fallback models or retry logic beyond basic error handling.

7. **Database Schema Stability**: The JSONB fields (structured_data, structured_proposal, metadata) can evolve, but breaking changes would require data migration.

These assumptions are reasonable for a production MVP and can be addressed in future iterations based on real-world usage.

---

## AI Tools Usage

This section documents the AI tools and assistance used during the development of this project, following best practices for transparency.

### Tools Used

**Primary Development Tools:**

- **Cursor** - AI-powered IDE for code completion, refactoring, and debugging
- **GitHub Copilot** - Code suggestions and auto-completion
- **Claude (Anthropic)** - Code review, architecture discussions, and complex problem-solving
- **ChatGPT (OpenAI)** - Quick syntax help, API documentation lookups, and debugging assistance

### What AI Tools Helped With

#### 1. Boilerplate Code Generation

- **NestJS Module Structure**: Generated initial module templates (controllers, services, modules)
- **TypeORM Entities**: Created entity definitions with proper decorators and relationships
- **DTO Classes**: Generated DTOs with validation decorators
- **Swagger Decorators**: Added API documentation decorators to controllers

**Example:** Initial RFP, Vendor, and Proposal modules were scaffolded using AI suggestions, then customized for specific requirements.

#### 2. Prompt Engineering for AI Features

- **Structured Prompt Design**: Helped design prompts for Gemini API that reliably return JSON
- **Error Handling Strategies**: Suggested approaches for handling AI parsing failures
- **Validation Logic**: Assisted in creating Zod schemas that match AI outputs

**Notable Prompts:**

- RFP generation prompt that ensures null returns for vague inputs
- Email parsing prompt that handles messy, quoted email formats
- Comparison prompt with deterministic scoring criteria

#### 3. Architecture & Design Decisions

- **Database Schema Design**: Discussed trade-offs between JSONB vs normalized tables
- **Email Handling Strategy**: Evaluated IMAP polling vs webhooks vs API approaches
- **Error Handling Patterns**: Designed consistent error responses across API

**Key Discussion:** JSONB decision was made after discussing flexibility vs type safety trade-offs with AI assistance, leading to ADR-001.

#### 4. Debugging & Problem Solving

- **TypeORM Query Issues**: Debugged complex queries and relationships
- **Email Parsing Edge Cases**: Identified and fixed issues with quoted replies and signatures
- **AI Response Parsing**: Improved regex patterns for extracting JSON from AI responses

**Example:** Fixed IMAP email parsing that was failing on nested quoted replies by using AI to analyze email structure patterns.

#### 5. Code Refactoring

- **ConfigService Migration**: Assisted in converting from `process.env` to `ConfigService` for consistency
- **Type Safety Improvements**: Suggested TypeScript type improvements and Zod schema refinements
- **Error Message Clarity**: Improved user-facing error messages based on AI suggestions

#### 6. Documentation

- **API Documentation**: Generated Swagger/OpenAPI annotations
- **README Structure**: Organized documentation sections logically
- **Code Comments**: Added helpful comments explaining complex logic

### Notable Approaches & Techniques

#### Prompt Engineering Patterns

1. **JSON-Only Enforcement**: Used explicit instructions like "Return ONLY valid JSON, no other text" to minimize parsing errors
2. **Schema-Based Validation**: Combined AI generation with Zod validation to catch errors early
3. **Fallback Handling**: Designed prompts to return null/empty structures for ambiguous inputs rather than hallucinating data

#### Code Generation Workflow

1. **Describe Intent**: Explain what needs to be built
2. **Review Generated Code**: Check for correctness and best practices
3. **Iterate**: Refine based on testing and requirements
4. **Customize**: Adapt generated code to project-specific needs

### What Changed Due to AI Tools

1. **Faster Development**: Reduced time on boilerplate by ~60%, allowing focus on business logic
2. **Better Error Handling**: AI suggestions improved error messages and handling strategies
3. **Consistent Patterns**: AI helped maintain consistent coding patterns across modules
4. **Documentation Quality**: Generated comprehensive documentation that might have been skipped manually

### Learning & Adaptation

**What We Learned:**

- AI is excellent for scaffolding but requires careful review for business logic
- Prompt engineering is crucial for reliable AI outputs
- Combining AI generation with strong validation (Zod) provides best results
- AI tools are particularly helpful for repetitive patterns and documentation

**What We Changed:**

- **Initial Approach**: Started with less structured prompts, leading to inconsistent outputs
- **Improved Approach**: Added explicit JSON-only instructions and comprehensive Zod validation
- **Testing Strategy**: Added validation layer after realizing AI outputs needed verification
- **Error Messages**: Improved user-facing errors based on patterns discovered through AI-assisted debugging

### Limitations & Manual Work

**What Still Required Manual Work:**

- Business logic and domain-specific rules
- Complex state management and workflows
- Integration testing and end-to-end validation
- Performance optimization for email polling
- Security considerations and environment variable management

**AI Tool Limitations Encountered:**

- Sometimes generated code didn't follow project-specific conventions
- Needed manual review of AI-suggested optimizations
- Prompt tuning required multiple iterations for reliable outputs
- Some edge cases weren't anticipated by AI suggestions

### Best Practices Discovered

1. **Always Validate AI Outputs**: Use Zod/TypeScript for runtime validation
2. **Iterate on Prompts**: First AI prompt is rarely perfect
3. **Review Generated Code**: Don't blindly accept AI suggestions
4. **Combine Approaches**: Use AI for structure, manual for business logic
5. **Document Decisions**: Keep track of why certain approaches were chosen

---

## License

UNLICENSED

---

**Built with ❤️ using modern web technologies and AI**
