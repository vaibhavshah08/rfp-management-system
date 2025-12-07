# Backend Environment Variables

Complete list of all environment variables used in the backend application.

## Required Environment Variables

### Google Gemini AI Configuration
- **`GEMINI_API_KEY`** (Required)
  - Description: Google Gemini API key for AI features
  - Get it from: https://aistudio.google.com/apikey
  - Used in: `src/ai/ai.service.ts`
  - Example: `GEMINI_API_KEY=your-api-key-here`

- **`GEMINI_MODEL`** (Optional)
  - Description: Gemini model to use
  - Default: `gemini-2.5-flash`
  - Used in: `src/ai/ai.service.ts`
  - Example: `GEMINI_MODEL=gemini-2.5-flash`

### Database Configuration
- **`DB_HOST`** (Optional)
  - Description: PostgreSQL database host
  - Default: `localhost` (used in seed script)
  - Used in: `src/database/seed.script.ts`
  - Example: `DB_HOST=localhost`

- **`DB_PORT`** (Optional)
  - Description: PostgreSQL database port
  - Default: `5432` (used in seed script)
  - Used in: `src/database/seed.script.ts`
  - Example: `DB_PORT=5432`

- **`DB_USERNAME`** (Optional)
  - Description: PostgreSQL database username
  - Default: `postgres` (used in seed script)
  - Used in: `src/database/seed.script.ts`
  - Example: `DB_USERNAME=postgres`

- **`DB_PASSWORD`** (Optional)
  - Description: PostgreSQL database password
  - Default: `postgres` (used in seed script)
  - Used in: `src/database/seed.script.ts`
  - Example: `DB_PASSWORD=postgres`

- **`DB_NAME`** (Optional)
  - Description: PostgreSQL database name
  - Default: `rfp_db` (used in seed script)
  - Used in: `src/database/seed.script.ts`
  - Example: `DB_NAME=rfp_db`

### SMTP Email Configuration (For Sending RFPs)
- **`SMTP_HOST`** (Optional)
  - Description: SMTP server hostname
  - Default: `smtp.gmail.com`
  - Used in: `src/email/email.service.ts`
  - Example: `SMTP_HOST=smtp.gmail.com`

- **`SMTP_PORT`** (Optional)
  - Description: SMTP server port
  - Default: `587`
  - Used in: `src/email/email.service.ts`
  - Example: `SMTP_PORT=587`

- **`SMTP_USER`** (Required)
  - Description: SMTP username/email
  - Used in: `src/email/email.service.ts`
  - Example: `SMTP_USER=your-email@gmail.com`

- **`SMTP_PASS`** (Required)
  - Description: SMTP password or app password
  - Used in: `src/email/email.service.ts`
  - Example: `SMTP_PASS=your-app-password`

- **`SMTP_FROM`** (Optional)
  - Description: From email address
  - Default: `rfp@example.com`
  - Used in: `src/email/email.service.ts`
  - Example: `SMTP_FROM=rfp@example.com`

### IMAP Email Configuration (For Receiving Vendor Responses)
- **`IMAP_HOST`** (Required for email receiving)
  - Description: IMAP server hostname
  - Used in: `src/email/email.service.ts`
  - Example: `IMAP_HOST=imap.gmail.com`

- **`IMAP_PORT`** (Optional)
  - Description: IMAP server port
  - Default: `993`
  - Used in: `src/email/email.service.ts`
  - Example: `IMAP_PORT=993`

- **`IMAP_USER`** (Required for email receiving)
  - Description: IMAP username/email
  - Used in: `src/email/email.service.ts`
  - Example: `IMAP_USER=your-email@gmail.com`

- **`IMAP_PASS`** (Required for email receiving)
  - Description: IMAP password or app password
  - Used in: `src/email/email.service.ts`
  - Example: `IMAP_PASS=your-app-password`

### Application Configuration
- **`PORT`** (Optional)
  - Description: Backend server port
  - Default: `7676`
  - Used in: `src/main.ts`
  - Example: `PORT=7676`

- **`FRONTEND_URL`** (Optional)
  - Description: Frontend URL for CORS configuration
  - Default: `http://localhost:5173`
  - Used in: `src/main.ts`
  - Example: `FRONTEND_URL=http://localhost:5173`

- **`NODE_ENV`** (Optional)
  - Description: Node environment (development/production)
  - Used in: `src/app.module.ts` (commented out)
  - Example: `NODE_ENV=development`

## Complete .env Example

```env
# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash

# Database (for seed script)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=rfp_db

# SMTP (Sending Emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# IMAP (Receiving Emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password

# Application
PORT=7676
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Notes

1. **Database**: Currently hardcoded in `app.module.ts`. Consider moving to environment variables for production.

2. **Email Setup**: 
   - For Gmail, you need to enable 2-Step Verification and create an App Password
   - Use the App Password in `SMTP_PASS` and `IMAP_PASS`

3. **Required vs Optional**:
   - **Required**: `GEMINI_API_KEY`, `SMTP_USER`, `SMTP_PASS`
   - **Required for email receiving**: `IMAP_HOST`, `IMAP_USER`, `IMAP_PASS`
   - All others have defaults or are optional

4. **Security**: Never commit `.env` file to version control. Add it to `.gitignore`.

