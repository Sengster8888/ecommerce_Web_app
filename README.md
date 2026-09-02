# Cambodia E-Commerce Web App

A robust E-Commerce web application platform tailored for the Cambodian market, featuring a high-security NestJS backend and PostgreSQL database.

## 🚀 Features
- **Secure Authentication:** 
  - Short-lived Access Tokens & Long-lived HttpOnly Refresh Tokens.
  - OTP Email verification for Registration.
  - Forgot & Reset Password flows using OTP verification.
- **Social Login:** Full Google OAuth 2.0 integration via Passport.
- **Prisma ORM:** Strict schema design with precise Decimal typing for financial data.
- **API Documentation:** Interactive Swagger UI documentation.
- **Resilient Emailing:** Built-in SMTP configuration using Nodemailer for sending OTPs.
- **Health Checks:** Built-in NestJS Terminus for monitoring database and system health.

## 📁 Project Structure
- `/ecommerce-backend` - The NestJS backend application.
- Frontend - (To be implemented)

## 🛠️ Backend Setup & Run
1. Navigate to the backend directory: `cd ecommerce-backend`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` (use `.env.example` as a template).
4. Start the database (PostgreSQL required) and run migrations: `npx prisma migrate dev`
5. Generate the Prisma Client: `npx prisma generate`
6. Start the server: `npm run start:dev`

## 📖 API Documentation
Once the server is running, visit **http://localhost:4000/api/docs** to interact with the Swagger API documentation.
