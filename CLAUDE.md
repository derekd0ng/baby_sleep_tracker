# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend Development (from `/backend`)
- `npm run dev` - Start development server with hot reload using nodemon
- `npm run build` - Compile TypeScript to JavaScript in `/dist` directory
- `npm start` - Run compiled JavaScript from `/dist/index.js`

### Frontend Development (from `/frontend`)
- `npm start` - Start React development server (http://localhost:3000)
- `npm run build` - Create production build in `/build` directory
- `npm test` - Run Jest test suite

### Database Setup
- Run schema: `psql -d <database_url> -f backend/src/database/schema.sql`
- Schema location: `backend/src/database/schema.sql`

## Architecture Overview

### Project Structure
This is a full-stack baby sleep tracking application with:
- **Frontend**: React 18 + TypeScript in `/frontend` directory
- **Backend**: Express.js + TypeScript in `/backend` directory  
- **Database**: PostgreSQL with schema in `backend/src/database/schema.sql`
- **Deployment**: Vercel serverless functions with Neon PostgreSQL

### Database Schema
The application uses three main tables:
- `users` - Authentication and mother profile info
- `babies` - Baby profiles (max 5 per user, enforced by DB constraint)
- `sleep_records` - Sleep tracking data with automatic duration calculation

### Authentication Flow
- JWT-based authentication with bcrypt password hashing
- Auth middleware in `backend/src/middleware/auth.ts` validates tokens
- Frontend stores JWT in localStorage and includes in Axios requests
- Token expiration handled with automatic redirect to login

### API Architecture
RESTful API with three main route modules:
- `backend/src/routes/auth.ts` - Registration and login
- `backend/src/routes/babies.ts` - Baby CRUD operations
- `backend/src/routes/sleep.ts` - Sleep record management and analytics

### Frontend Architecture
- React Context (`AuthContext`) manages global authentication state
- Protected routes using `ProtectedRoute` component
- Dashboard with tabbed interface for sleep tracking vs. analytics
- Chart.js integration for sleep duration visualization

### Key Data Flow
1. User authentication creates JWT token stored in AuthContext
2. Baby selection in sidebar updates selected baby state in Dashboard
3. Sleep records are CRUD operations with real-time duration calculation
4. Chart data fetched via `/api/sleep/baby/:babyId/daily-totals` endpoint
5. All API calls use Axios interceptors for token management

### Environment Configuration
- Backend: `.env` with `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`
- Frontend: `.env.local` with `REACT_APP_API_URL`
- Production: Vercel environment variables configured in `vercel.json`

### Sleep Label System
Predefined sleep types in `SleepTracker.tsx`:
- `long_rock`, `self_rock`, `after_food`, `nap`, `night_sleep`, `car_sleep`, `stroller_sleep`

### Security Features
- JWT token expiration and refresh handling
- Input validation on all endpoints  
- CORS configuration for cross-origin requests
- Helmet.js security headers
- Password hashing with bcrypt salt rounds
- Ownership verification (users can only access their own babies/sleep records)

### Chart Implementation
Uses Chart.js with react-chartjs-2 wrapper:
- Linear chart showing daily sleep totals over time
- X-axis: dates, Y-axis: total sleep hours
- Date range selector for filtering data
- Statistics cards showing averages and totals

### Deployment Notes
- Vercel handles both frontend (static) and backend (serverless functions)
- Database schema must be manually applied to production Neon database
- Environment variables configured in Vercel dashboard
- Frontend build outputs to `/build`, backend compiles to `/dist`