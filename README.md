# Burn Risk Prediction System - Express.js Backend with Supabase Integration

This project is a robust, custom Express.js backend fully integrated with Supabase for user registration (Sign Up), authentication (Sign In), and profile updates.

## Core Features

- **Supabase Authentication**: Integrates with Supabase Auth for registering and logging in users.
- **Auto-Sync Database Profiles**: Creates a public profile in the database `users` table upon Supabase registration using the exact same `uuid`.
- **Automatic Age Calculation**: Automatically calculates the user's `age` from their `birthday_date` on both sign up and profile edits.
- **Secure Authentication Middleware**: Protects private user endpoints using standard JWT authorization header verification.
- **Robust Field Validation**: Validates inputs with explicit defaults (e.g., number types default to `0` if empty or invalid).

---

## 🛠️ Step 1: Database Schema Setup

Before running the backend, you need to configure the required SQL schema in your Supabase project.

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Create a new query.
3. Open [supabase_schema.sql](file:///c:/burn-risk-prediction-system/brps-backend/supabase_schema.sql), copy the contents, and paste them into the Supabase editor.
4. Click **Run** to execute the query. This will create the `gender_enum` type and the `users` table linked to `auth.users(id)`.

---

## ⚙️ Step 2: Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```env
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

- **SUPABASE_URL**: Found in Supabase Dashboard under *Project Settings -> API*.
- **SUPABASE_ANON_KEY**: Found in Supabase Dashboard under *Project Settings -> API* (labeled `anon public`).
- **SUPABASE_SERVICE_ROLE_KEY**: Found in Supabase Dashboard under *Project Settings -> API* (labeled `service_role`). *Do not share this key publicly!*

---

## 🚀 Step 3: Commands to Run the Project

To install dependencies and start the application, use the following terminal commands inside the `brps-backend` workspace:

### 1. Install Dependencies
```bash
npm install
```

### 2. Start in Development Mode (with Live Reload / Nodemon)
```bash
npm run dev
```

### 3. Start in Production Mode
```bash
npm start
```

---

## 📡 API Endpoints Documentation

### 🔓 Public Routes

#### 1. Sign Up (Register User)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/signup`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "Jane Doe",
    "birthday_date": "1995-05-15",
    "gender": "female" 
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully and database profile created.",
    "data": {
      "session": { ... },
      "user": {
        "id": "supabase-uuid-here",
        "email": "user@example.com",
        "profile": {
          "id": "supabase-uuid-here",
          "name": "Jane Doe",
          "birthday_date": "1995-05-15",
          "gender": "female",
          "age": 31,
          ...
        }
      }
    }
  }
  ```

#### 2. Sign In (Login)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/signin`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Signed in successfully",
    "data": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "...",
      "user": {
        "id": "supabase-uuid-here",
        "email": "user@example.com",
        "profile": { ... }
      }
    }
  }
  ```

---

### 🔒 Protected Routes (Requires Header `Authorization: Bearer <access_token>`)

#### 1. Retrieve Current User Profile
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/users/profile`

#### 2. Edit User Profile
- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/users/profile`
- **Request Body**:
  ```json
  {
    "name": "Jane Austen Doe",
    "birthday_date": "1990-12-16",
    "gender": "female",
    "job_role": "Software Engineer",
    "department": "Engineering",
    "years_experience": 5,
    "work_hours_per_week": 40,
    "remote_ratio": 0.8
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "id": "supabase-uuid-here",
      "name": "Jane Austen Doe",
      "birthday_date": "1990-12-16",
      "gender": "female",
      "age": 35,
      "job_role": "Software Engineer",
      "department": "Engineering",
      "years_experience": 5,
      "work_hours_per_week": 40,
      "remote_ratio": 0.8,
      "created_at": "...",
      "updated_at": "..."
    }
  }
  ```
  *(Note: Age is calculated automatically on update. Missing or invalid number types default to `0`)*
