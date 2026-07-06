# 🚀 LinkUps

**LinkUps** is an advanced, full-stack professional networking and career development platform. Built with Next.js, Express, and MongoDB, it goes beyond standard social networking by integrating a powerful AI-driven career suite (powered by Google Gemini), a smart resume builder, real-time messaging, and instant video meetings.

---

## ✨ Features Built into the Code

### 🧠 AI Career Suite (Powered by Google Gemini)
* **Resume-to-JD Tailoring:** AI automatically rewrites and reorders your resume's summary, experience, and projects to perfectly match a specific Job Description (JD).
* **ATS Match Scoring:** Calculates a 0-100 match score against a JD, identifying matching skills, missing skills, keyword gaps, and actionable ATS tips.
* **AI Mock Interviews:** Generates personalized interview questions (Technical, Behavioral, Situational) based on the user's resume and the target JD, including difficulty ratings and hints.
* **AI Content Enhancer:** One-click enhancement for Professional Summaries, Job Descriptions, and Project Bullet Points to make them ATS-friendly and impactful.
* **PDF to Resume Parsing:** Upload an existing PDF resume, extract the text, and let the AI parse it directly into the platform's database format.

### 📄 Smart Resume Builder
* **Multiple Templates:** Choose between "General" (classic LPU-style with 7 skill categories) and "Specialized" (modern layout with 3 broad skill groups).
* **Dynamic Section Ordering:** Users can customize the exact order of their resume sections (Experience, Projects, Achievements, Certificates, Skills, Education).
* **Auto-Fill from Profile:** Seamlessly imports existing user profile data (bio, past work, education, projects) into new resumes.
* **CloudMedia Integration:** Direct integration with Cloudinary for handling profile pictures on the resume.

### 💬 Real-Time Messaging & Networking
* **Socket.io Chat Engine:** Instant messaging with real-time delivery and read receipts (single tick, double tick, blue ticks).
* **Message Controls:** Edit sent messages (within a 2-minute window) or delete/clear messages permanently.
* **Live Status & Presence:** Real-time "Online" dots and formatted "Last Seen / Active X mins ago" timestamps.
* **Social Feed Reactions:** Interact with posts using 6 distinct reactions (Like, Love, Celebrate, Support, Insightful, Funny).

### 📹 Instant Video Meetings (LinkUps Meet)
* **Secure WebRTC Rooms:** Generate instant, secure video conferencing rooms.
* **In-Chat Calling:** Initiate a direct video call right from the messaging window. The system rings the other user if they are online, or sends a "missed call" notification if they are offline.

### 🔐 Authentication & Security
* **Multi-Strategy Auth:** Support for standard Email/Password, as well as OAuth login via Google and GitHub (via Passport.js).
* **Secure Sessions:** Managed via JSON Web Tokens (JWT) and Express sessions.

### 🛠️ Developer Experience
* **Live API Documentation:** Built-in Swagger UI available at `/api-docs` to easily test and visualize all backend routes.

---

## 💻 Tech Stack

### Frontend
* **Framework:** Next.js 16 / React 19
* **State Management:** Redux Toolkit
* **Styling:** Tailwind CSS & Custom CSS Modules (Dynamic Theming / Holo UI)
* **PDF Handling:** `react-pdftotext`
* **Real-time:** `socket.io-client`
* **Icons:** `lucide-react`

### Backend
* **Runtime:** Node.js / Express.js v5
* **Database:** MongoDB (Mongoose)
* **Real-time:** Socket.io
* **AI Engine:** Google Gemini API (`generativelanguage.googleapis.com`)
* **File Storage:** Cloudinary & Multer
* **Documentation:** Swagger UI Express & Swagger JSDoc
* **Authentication:** Passport.js (Google/GitHub strategies)

---

## ⚙️ Local Setup & Installation

### Prerequisites
* Node.js (v18+ recommended)
* MongoDB instance (local or Atlas)
* Google Gemini API Key
* Cloudinary Account
* Google/GitHub OAuth Credentials (Optional but recommended)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start the server (Dev Mode)
npm run dev
```

## 📦 Installation & Setup

To run this project locally, you need to set up both the **frontend** and **backend** environments.

### Prerequisites

-   Node.js (v16+ recommended)
-   MongoDB Database (Atlas or Local)
-   Cloudinary Account (for media storage)
-   Brevo Account (for sending emails)

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` folder with the following variables:

```env
PORT=9090
MONGO_URL=your_mongodb_connection_string
SESSION_SECRET=your_random_secret_string

# URLs (Crucial for CORS and Email Links)
# Use http://localhost:3000 for local dev, or your Render URL for production
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:9090

# Cloudinary Configuration (Images/Videos)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_verified_sender_email_in_brevo

# OAuth (Optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Start the server:

```bash
npm run dev
```

_The backend will run on http://localhost:9090_

### 2\. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the `frontend` folder:

```env
# Points to your backend server
NEXT_PUBLIC_API_URL=http://localhost:9090
```

Start the application:

```bash
npm run dev
```

_The frontend will run on http://localhost:3000_

---

## 📖 API Documentation

This project includes auto-generated API documentation using Swagger.

1.  Ensure the backend server is running.
2.  Visit: **`http://localhost:9090/api-docs`**
3.  You can explore endpoints, view schemas, and test API calls directly from the browser.

---

## 📂 Project Structure

```text
├── backend/
│   ├── config/         # DB, Cloudinary, Passport, Email Templates
│   ├── controllers/    # Logic for User, Post, Messaging
│   ├── models/         # Mongoose Schemas (User, Post, Message, etc.)
│   ├── routes/         # API Routes (Swagger docs included here)
│   └── server.js       # Entry point, Swagger config & Socket.io setup
│
├── frontend/
│   ├── src/
│   │   ├── Components/ # Reusable UI (Navbar, Footer, Modals)
│   │   ├── config/     # Redux Store & Axios setup
│   │   ├── context/    # Socket & Theme Contexts
│   │   ├── layout/     # Layout wrappers (UserLayout, DashboardLayout)
│   │   ├── pages/      # Next.js Pages (dashboard, profile, login, meet, etc.)
│   │   └── styles/     # Global and module CSS files
│   └── public/         # Static assets
```

## 🛡️ License

This project is open-source and available under the MIT License.
