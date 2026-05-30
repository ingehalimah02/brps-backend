# Burnout Risk Prediction System - Express.js Backend with Supabase Integration

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

#### 1. Sign Out (Logout)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/logout`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Signed out successfully from all active sessions."
  }
  ```

#### 2. Update Password
- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/auth/update-password`
- **Request Body**:
  ```json
  {
    "old_password": "securepassword123",
    "new_password": "newsecurepassword456"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully"
  }
  ```

#### 3. Retrieve Current User Profile
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/users/profile`

#### 4. Edit User Profile
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

---

### 📊 Burnout Assessment Routes (Requires Header `Authorization: Bearer <access_token>`)

These endpoints manage employee stress levels and evaluate potential burnout risks using a Machine Learning predictor model. **For maximum security and simplicity, the `user_id` is automatically inferred from the authenticated user's access token (`req.user.id`).** Users are prevented from reading, writing, or modifying other users' assessment data.

#### 1. Create Assessment
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/burnout-assessments`
- **Request Body**: (Note that `user_id` is NOT required in the body; it is resolved automatically from the login token)
  ```json
  {
    "stress_level": 4,
    "workload_level": 3,
    "work_life_balance": 2,
    "job_satisfacation": 3
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Assessment created successfully",
    "data": {
      "id": "assessment-uuid-here",
      "user_id": "supabase-uuid-of-logged-in-user",
      "stress_level": 4,
      "workload_level": 3,
      "work_life_balance": 2,
      "job_satisfacation": 3,
      "burnout_score": null,
      "burnout_label": null,
      "prediction_confidence": null,
      "created_at": "...",
      "updated_at": "..."
    }
  }
  ```

#### 2. Get All Assessments
Retrieves assessments belonging only to the currently logged-in user.
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/burnout-assessments`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "assessment-uuid-here",
        "user_id": "supabase-uuid-of-logged-in-user",
        "stress_level": 4,
        "workload_level": 3,
        "work_life_balance": 2,
        "job_satisfacation": 3,
        "burnout_score": null,
        "burnout_label": null,
        "prediction_confidence": null,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
  ```

#### 3. Get Assessment by ID
Retrieves a specific assessment by UUID, strictly ensuring it belongs to the logged-in user.
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/burnout-assessments/:id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "assessment-uuid-here",
      "user_id": "supabase-uuid-of-logged-in-user",
      "stress_level": 4,
      ...
    }
  }
  ```

#### 4. Update Assessment
Updates the assessment by UUID, strictly ensuring it belongs to the logged-in user.
- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/burnout-assessments/:id`
- **Request Body**: (Same payload as Create, excluding `user_id`)
  ```json
  {
    "stress_level": 4,
    "workload_level": 3,
    "work_life_balance": 3,
    "job_satisfacation": 4
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assessment updated successfully",
    "data": {
      "id": "assessment-uuid-here",
      "user_id": "supabase-uuid-of-logged-in-user",
      "stress_level": 4,
      "workload_level": 3,
      "work_life_balance": 3,
      "job_satisfacation": 4,
      ...
    }
  }
  ```

#### 5. Delete Assessment
Deletes the assessment by UUID, strictly ensuring it belongs to the logged-in user.
- **Method**: `DELETE`
- **URL**: `http://localhost:5000/api/burnout-assessments/:id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assessment deleted successfully"
  }
  ```

#### 6. Predict Burnout Risk (ML Integration)
Triggers the Machine Learning predictor for the assessment UUID, strictly ensuring it belongs to the logged-in user. Analyzes the user's workspace profile metrics and the assessment levels, updates the database, and returns the detailed prediction report.
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/burnout-assessments/:id/predict`
- **Response (200 OK)**:
  ```json
  {
    "status_code": 200,
    "success": true,
    "data": {
      "burnout_probability": 0.9998857378959656,
      "burnout_probability_percent": "100.0%",
      "risk_level": "Tinggi",
      "hr_recommendation": "Evaluasi kondisi kerja karyawan secara berkala untuk mencegah stres berlebih.",
      "ui_theme_color": "#F39C12",
      "ai_wellness_recommendations": [
        "Lakukan mindfulness atau breathing exercise 10–15 menit setiap hari.",
        "Kurangi multitasking berlebihan agar fokus kerja lebih stabil.",
        "Kurangi lembur dan prioritaskan work-life balance.",
        "Hindari bekerja tanpa jeda terlalu lama.",
        "Diskusikan hambatan kerja dengan HR atau atasan."
      ]
    },
    "assessment_id": "assessment-uuid-here",
    "burnout_assessment_uuid": "assessment-uuid-here"
  }
  ```
  *(Note: This updates the database record fields `burnout_score` with `burnout_probability`, `burnout_label` with `risk_level`, and `prediction_confidence` with `hr_recommendation`)*
