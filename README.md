# Secure Authentication Web Application

A full-stack, secure authentication web application built with a Node.js/Express/MongoDB backend and a modern React (Vite + Framer Motion) frontend.

## Features

*   **Modern Animated UI**: Responsive glassmorphism interface built with Tailwind CSS and Framer Motion for smooth, engaging state transitions.
*   **Secure Authentication**:
    *   JWT-based session handling.
    *   Passwords securely hashed using `bcrypt`.
*   **Brute Force Protection**: 
    *   Tracks failed login attempts.
    *   Automatically locks accounts for 15 minutes after 5 failed attempts.
    *   Sends a Security Alert email to the user indicating the lock time.
*   **Comprehensive Signup**:
    *   Real-time username availability checking.
    *   Robust password strength meter (Requires 8 chars, uppercase, number, special char).
*   **Password Recovery**:
    *   Secure 6-digit OTP generation and email delivery via `nodemailer`.
    *   10-minute OTP expiration window.
*   **User Dashboard**:
    *   Displays protected account details.
    *   Visualizes the last 5 active login attempts (Success / Failed), capturing IP address and Browser info.

## Tech Stack

*   **Frontend**: React.js, Vite, React Router v6, Tailwind CSS v4, Framer Motion, Lucide React.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose).
*   **Utilities**: jsonwebtoken, bcrypt, nodemailer, cors, dotenv.

## Installation Instructions

1.  **Clone the Repository** and navigate into the project directory.

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory based on `.env.example`:
    ```env
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/authix
    JWT_SECRET=your_super_secret_jwt_key_here
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USERNAME=your_email@gmail.com
    EMAIL_PASSWORD=your_app_password
    EMAIL_FROM=noreply@authsystem.com
    ```

3.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    ```

## How to Run Locally

1. Ensure your MongoDB service is running locally (`mongod`), or update `MONGO_URI` to point to a cloud cluster (e.g., MongoDB Atlas).

2. Start the Backend server:
    ```bash
    cd backend
    node server.js
    ```
    *The server runs on http://localhost:5000*

3. Start the Frontend development server:
    ```bash
    cd frontend
    npm run dev
    ```
    *The React app usually runs on http://localhost:5173*

## API Endpoints

*   `GET /api/check-username?username=xyz` - Check if a username is available.
*   `POST /api/signup` - Register a new user (Body: username, email, password).
*   `POST /api/login` - Authenticate a user (Body: identifier, password).
*   `POST /api/forgot-password` - Request a password reset OTP (Body: email).
*   `POST /api/verify-otp` - Verify the 6-digit OTP (Body: email, otp).
*   `POST /api/reset-password` - Change to a new password (Body: email, otp, newPassword).
*   `POST /api/logout` - Structurally logs out the user.
*   `GET /api/dashboard` - Get protected user details (Requires Bearer Token).
*   `GET /api/login-logs` - Get user's last 5 login access statuses (Requires Bearer Token).
