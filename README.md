# Baby Sleep Tracker

A comprehensive web application for mothers to track their babies' sleep patterns. This app supports multiple babies per user (up to 5), detailed sleep logging, and visual analytics through interactive charts.

## Features

### 🔐 User Authentication
- Secure user registration with unique username and password
- JWT-based authentication
- Profile management with mother's name

### 👶 Baby Management
- Add up to 5 babies per user account
- Store baby information including name and birth date
- Edit and delete baby profiles

### 😴 Sleep Tracking
- Log detailed sleep records with:
  - Date and time (start/end times)
  - Sleep type labels (long rock, self rock, after food, nap, night sleep, etc.)
  - Optional notes for additional context
- Edit and delete existing sleep records
- Automatic duration calculation

### 📊 Sleep Analytics
- Interactive linear charts showing daily sleep duration
- Customizable date range selection
- Sleep statistics including:
  - Average daily sleep duration
  - Total number of sleep sessions
  - Days tracked
- Visual representation of sleep patterns over time

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Chart.js** with react-chartjs-2 for data visualization
- **Axios** for API communication
- **CSS3** with responsive design

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database with Neon hosting
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** and **Helmet** for security

### Deployment
- **Vercel** for hosting (both frontend and serverless backend)
- **Neon PostgreSQL** for production database

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (local or Neon account)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd baby_sleep_tracker
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your database connection and JWT secret
# DATABASE_URL=postgresql://username:password@localhost:5432/baby_sleep_tracker
# JWT_SECRET=your_jwt_secret_key_here
# PORT=5000
# NODE_ENV=development
```

### 3. Database Setup
```bash
# Create the database and run the schema
psql -d your_database_url -f src/database/schema.sql
```

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API URL
# REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Running the Application

#### Development Mode
```bash
# Terminal 1: Start the backend server
cd backend
npm run dev

# Terminal 2: Start the frontend development server
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

#### Production Build
```bash
# Build the frontend
cd frontend
npm run build

# Build the backend
cd ../backend
npm run build
npm start
```

## Deployment

### Deploy to Vercel

1. **Set up Neon PostgreSQL Database:**
   - Create an account at [Neon](https://neon.tech)
   - Create a new project and database
   - Copy the connection string

2. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy from project root
   vercel

   # Set environment variables in Vercel dashboard:
   # DATABASE_URL=your_neon_connection_string
   # JWT_SECRET=your_jwt_secret
   ```

3. **Run Database Schema:**
   ```bash
   # Connect to your Neon database and run:
   psql your_neon_connection_string -f backend/src/database/schema.sql
   ```

## Usage Guide

### 1. User Registration
- Navigate to the registration page
- Create an account with a unique username, password, and mother's name
- Automatically logged in after successful registration

### 2. Adding Babies
- After login, use the sidebar to add baby information
- Add up to 5 babies with names and optional birth dates
- Select a baby to start tracking their sleep

### 3. Tracking Sleep
- Use the "Sleep Tracker" tab to log sleep sessions
- Fill in the date, start time, end time, and sleep type
- Add optional notes for context
- View, edit, or delete existing sleep records

### 4. Viewing Analytics
- Switch to the "Sleep Chart" tab
- Select date ranges to view sleep patterns
- Analyze daily sleep totals and trends
- View statistics like average sleep duration

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Babies
- `GET /api/babies` - Get user's babies
- `POST /api/babies` - Add new baby
- `PUT /api/babies/:id` - Update baby
- `DELETE /api/babies/:id` - Delete baby

### Sleep Records
- `GET /api/sleep/baby/:babyId` - Get sleep records
- `GET /api/sleep/baby/:babyId/range` - Get records by date range
- `GET /api/sleep/baby/:babyId/daily-totals` - Get daily totals for charts
- `POST /api/sleep` - Add sleep record
- `PUT /api/sleep/:id` - Update sleep record
- `DELETE /api/sleep/:id` - Delete sleep record

## Sleep Label Types

The application supports various sleep types:
- **Long Rock** - Extended rocking to sleep
- **Self Rock** - Baby self-soothes to sleep
- **After Food** - Sleep following feeding
- **Nap** - Daytime sleep
- **Night Sleep** - Nighttime sleep
- **Car Sleep** - Sleep during car rides
- **Stroller Sleep** - Sleep in stroller

## Security Features

- JWT-based authentication with token expiration
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please create an issue in the GitHub repository.

---

**Made with ❤️ for parents tracking their baby's sleep patterns**