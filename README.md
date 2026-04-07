# Qr-Rm-Material-Tracker

A comprehensive web application designed to track and manage raw materials. It provides features like user authentication, managing raw materials with varying dimensions and types, viewing machine properties, generating QR codes for specific shipments, and downloading reports via Excel.

## Features

- **Authentication**: Secure HttpOnly cookie-based user sign-in and sign-up with server validation.
- **Raw Material Tracking**: Add new material shipments with dimensions, grades, types, UOM, weight, and delivery date.
- **Report Summaries**: Easily view all shipments, track UOM groups, and download summary insights as Excel spreadsheets.
- **Machine Details**: Reference panel for different CNC machining categories (CMC, VMC, TMC).
- **QR Code Generation**: Instantly generate and view QR codes for each specific material shipment added.

## Tech Stack

- **Frontend**: React, Vite, TypeScript (.tsx), React Router, Lucide Icons
- **Backend**: Node.js, Express.js, TypeScript (.ts)
- **Database**: PostgreSQL (Supabase)
- **Key Modules**: 
  - `bcryptjs` for password hashing
  - `jsonwebtoken` & `cookie-parser` for secure session handling
  - `pg` for PostgreSQL database integration
  - `exceljs` for seamless report generation
  - `qrcode.react` for in-app QR code creation

## Prerequisites

- **Node.js**
- **NPM** (Node Package Manager)
- **PostgreSQL Database** running (or a Supabase connection). You will need to map the configuration to point to your desired database and provide your own environment variables.

## Getting Started

1. **Clone the repository/Navigate to project**:
   Navigate into the project directory:
   ```bash
   cd Shipment-app
   ```

2. **Install Dependencies**:
   Install all necessary packages via npm for the backend, then navigate and install frontend packages:
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

3. **Configure Environment variables**:
   Create a `.env` / update `config/Mail.env` file to include necessary PostgreSQL string configurations and JSON web token (`JWT_SECRET`) settings.

4. **Database Seeding (Optional)**:
   If needed, prepopulate or map mock auth users using:
   ```bash
   npm run seed-users
   ```

5. **Run the Application (Development Mode)**:
   The application is decoupled into a UI and an API. You must run both servers simultaneously.
   
   Open one terminal for the Backend API:
   ```bash
   npm run dev:server
   ```
   Open a second terminal for the React Frontend UI:
   ```bash
   npm run dev:client
   ```
   *Your Dashboard will now be accessible natively at `http://localhost:5173/`.*

6. **Production Build**:
   To compile the React layout into rapid static assets for speed testing or deployment, run:
   ```bash
   npm run build:client && npm run preview:client
   ```

## Folder Structure

- `/client`: The React Vite TypeScript Frontend UI Application.
- `/backend`: The Express.js TypeScript Backend API server (`Server.ts`).
- `/config`: Configuration templates like Mail environment variables.
- `/database`: DB seeding scripts (`seed-auth-users.js`).
