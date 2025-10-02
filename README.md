# Backend API for Learning Platform

This project implements a backend REST API for a learning platform, handling user authentication, profile management, and course enrollment.  It uses Express.js for the server, Mongoose for MongoDB interaction, and JWT for authentication.

## Description

The API provides endpoints for user registration, login, logout, profile creation/update, course enrollment (free courses), and progress tracking.  User data is stored in a MongoDB database, and authentication is handled using JSON Web Tokens (JWT).  The API also includes health check and test endpoints for monitoring and debugging.

## Features

* **User Authentication:**  Register new users, login with username/password, logout, and verify user sessions.
* **Profile Management:** Create, update, and retrieve user profiles including personal information, skills, interests, and course enrollment history.
* **Course Enrollment:** Enroll users in free courses, track course progress, and update course status (in-progress/completed).
* **Progress Tracking:**  Update and retrieve course progress, including completed modules and total hours spent.
* **Error Handling:** Comprehensive error handling with detailed error messages returned in JSON format.

## Technology Stack

* **Node.js:** Server-side JavaScript runtime environment.
* **Express.js:** Web application framework for Node.js.
* **Mongoose:** MongoDB object modeling tool for Node.js.
* **MongoDB:** NoSQL document database.
* **bcrypt:** Password hashing library.
* **jsonwebtoken:** JSON Web Token library for authentication.
* **cors:** CORS middleware to handle cross-origin requests.
* **cookie-parser:** Middleware for parsing cookies.
* **dotenv:** Loads environment variables from a `.env` file.
* **ejs:** Templating engine (although not heavily used in this example).
* **express-validator:** Middleware for validating requests.

## System Workflow

The application follows a standard RESTful API architecture.  Here's a breakdown of the workflow:

1. **Request Handling:**  The `app.js` file acts as the main entry point, setting up the Express.js server, middleware (CORS, cookie parsing, JSON body parsing), and routing.  It uses `userRouter` to handle user-related requests.

2. **Database Connection:** `config/db.js` establishes a connection to the MongoDB database using the `MONGO_URI` environment variable.

3. **User Model:** `models/user.model.js` defines the Mongoose schema for user data (username, email, password).

4. **Profile Model:** `models/profile.model.js` defines the Mongoose schema for user profiles (personal information, courses, progress).  It includes indexes for efficient querying.

5. **User Routes:** `routes/user.routes.js` contains all the API endpoints.  Each endpoint handles requests, validates input using `express-validator`, interacts with the database using Mongoose models, and returns JSON responses.  The workflow for a typical endpoint (e.g., `/user/profile`) is:
    * Receive request (e.g., GET, POST).
    * Verify JWT authentication using `req.cookies.token`.
    * Extract user ID from the decoded token.
    * Query MongoDB using Mongoose models (`userModel`, `Profile`).
    * Process data (e.g., update profile, fetch data).
    * Return JSON response with appropriate status code (200, 400, 500, etc.).

6. **Error Handling:**  `app.js` includes middleware for handling errors and 404 (not found) responses.

7. **Server Start:** `app.js` starts the server on the port specified by the `PORT` environment variable (default 5000).

**Simplified Workflow Diagram:**

```
[Client Request] --> [app.js (middleware)] --> [routes/user.routes.js (endpoint)] --> 
[models/user.model.js or models/profile.model.js (database interaction)] --> [MongoDB] -->
[routes/user.routes.js (data processing)] --> [app.js (response)] --> [Client Response]
```

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file:**  This file should contain your MongoDB connection string and JWT secret:
   ```
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_jwt_secret>
   NODE_ENV=development  // or production
   ```

## Usage

Start the server using:

```bash
npm start 
```

or for development with automatic restarts:

```bash
npm run dev
```

The API endpoints are documented below.  You can test them using tools like Postman or curl.

## API Documentation

**Authentication:**

* `/user/register` (POST): Register a new user.  Requires `username`, `email`, and `password`.
* `/user/login` (POST): Login an existing user. Requires `username` and `password`.
* `/user/verify` (GET): Verify if a user is authenticated. Requires a valid JWT in a cookie named `token`.
* `/user/logout` (POST): Logout the current user. Clears the `token` cookie.

**Profile Management:**

* `/user/profile` (GET): Get the current user's profile. Requires a valid JWT.
* `/user/profile` (POST): Create or update the current user's profile. Requires a valid JWT and profile data.

**Course Management:**

* `/user/enroll-course` (POST): Enroll in a free course. Requires a valid JWT and course data (`courseId`, `title`, `instructor`, `rating`, `totalModules`).
* `/user/update-progress` (POST): Update course progress. Requires a valid JWT, `courseId`, `progress`, and optionally `hoursSpent` and `completedModules`.
* `/user/course-status/:courseId` (GET): Check enrollment status for a specific course. Requires a valid JWT and `courseId`.

## Project Structure

```
backend/
├── app.js             // Main application file
├── config/
│   └── db.js         // Database connection logic
├── models/
│   ├── profile.model.js // Mongoose schema for user profiles
│   └── user.model.js  // Mongoose schema for users
├── routes/
│   └── user.routes.js // API endpoints
└── package.json       // Project dependencies and scripts
└── .gitignore         // Files to ignore in Git
```

## Configuration

The application relies on environment variables stored in a `.env` file:

* `MONGO_URI`: MongoDB connection string.
* `JWT_SECRET`: Secret key for JWT signing.
* `PORT`: Server port (defaults to 5000).
* `NODE_ENV`:  Set to `development` or `production` to adjust cookie settings (secure flag).

## Example Usage (using curl):

**Register a user:**

```bash
curl -X POST -H "Content-Type: application/json" -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}' http://localhost:5000/user/register
```

**Login:**

```bash
curl -X POST -H "Content-Type: application/json" -d '{"username": "testuser", "password": "password123"}' http://localhost:5000/user/login
```

**(Note:  After successful login, a `token` cookie will be set.  Use this token for subsequent requests.)**

**Get user profile:**

```bash
curl -H "Cookie: token=<your_jwt_token>" http://localhost:5000/user/profile
```

Remember to replace `<your_jwt_token>` with the actual token obtained after login.  Similar curl commands can be used to test other API endpoints.  Refer to the API documentation for the required parameters.
