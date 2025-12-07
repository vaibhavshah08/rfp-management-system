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

## Installation & Quick Start

Follow these steps exactly:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd rfp-project

# 2. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your credentials (see Environment Variables section)

# 3. Set up and start backend
# Note: Database connection is configured in backend/src/app.module.ts
# For local development, update the connection string or set up your own PostgreSQL instance
cd backend
npm install
npm run seed  # Optional: Populate with sample data
npm run start:dev

# Backend runs on http://localhost:7676
# Swagger docs at http://localhost:7676/api

# 4. In a NEW terminal
cd frontend
npm install
npm run dev

# Frontend runs on http://localhost:5173
```

That's it! Open http://localhost:5173 in your browser and start creating RFPs.

---

## Environment Variables

All environment variables go in `backend/.env`. Here's what you need:

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

The system exposes a RESTful API. Full interactive documentation is available at `http://localhost:7676/api` (Swagger UI).

### Key Endpoints

#### RFP Management

```bash
# Create RFP from natural language
POST /rfps
Body: { "description": "I need 100 laptops..." }
Response: { id, description_raw, structured_data, created_at }

# Get all RFPs
GET /rfps
Response: [{ id, description_raw, structured_data, ... }]

# Get specific RFP
GET /rfps/:id
Response: { id, description_raw, structured_data, proposals, ... }

# Update RFP description (regenerates structured data)
PATCH /rfps/:id
Body: { "description": "Updated description..." }

# Regenerate structured data for existing RFP
POST /rfps/:id/regenerate
Response: { structured_data }

# Send RFP to vendors
POST /rfps/:id/send
Body: { "vendor_ids": ["uuid1", "uuid2"] }
Response: [{ vendor_id, success, message }]

# Get email preview
GET /rfps/:id/email-preview
Response: { html, text, subject }
```

#### Vendor Management

```bash
# Create vendor
POST /vendors
Body: { "name": "Tech Solutions Inc.", "email": "vendor@example.com", "metadata": {...} }

# Get all vendors
GET /vendors

# Get specific vendor
GET /vendors/:id

# Update vendor
PATCH /vendors/:id
Body: { "name": "Updated Name", ... }

# Delete vendor
DELETE /vendors/:id
```

#### Proposal Management

```bash
# Get all proposals
GET /proposals

# Get proposals for specific RFP
GET /proposals/rfp/:rfp_id

# Get specific proposal
GET /proposals/:id

# Compare proposals for an RFP
GET /proposals/rfp/:rfp_id/compare
Response: {
summary: "AI-generated comparison summary",
scores: {
 "vendor_id1": { score: 85, reasoning: "..." },
 "vendor_id2": { score: 72, reasoning: "..." }
},
recommended_vendor: { vendor_id: "...", reason: "..." }
}

# Update proposal (for manual corrections)
PATCH /proposals/:id
Body: { "structured_proposal": {...}, "score": 90 }
```

#### Email Management

```bash
# Get all sent emails
GET /email/sent

# Get sent emails for specific RFP
GET /email/sent/rfp/:rfp_id

# Manually check for new vendor replies
POST /email/check-replies
Response: { success, message, processed: 5 }
```

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

## License

UNLICENSED

---

**Built with ❤️ using modern web technologies and AI**
