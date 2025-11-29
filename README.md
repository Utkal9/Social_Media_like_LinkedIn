# 🚀 LinkUps - Professional Networking Platform

**LinkUps** is a full-stack social media application designed for professional networking. It goes beyond standard connections by offering real-time communication, a dynamic theme engine, smart resume generation, and a robust security protocol including email verification and account management.

## ✨ Key Features

### 👤 User Experience & Customization

-   **Dynamic Theme Engine**: Toggle between **"Neon Cyberpunk" (Dark Mode)** for a futuristic look and **"Clean Professional" (Light Mode)** for a standard corporate feel.
-   **Professional Profile**: Manage bio, experience, education, skills, and projects.
-   **Smart Resume Builder**: One-click generation of a formatted `.docx` resume based on your profile data.
-   **Danger Zone**: Full control over data with secure options to permanently delete your account (includes email confirmation).

### 🔐 Security & Authentication

-   **Secure Auth**: JSON Web Tokens (JWT) with Bcrypt password hashing.
-   **OAuth Strategies**: Login via Google and GitHub (Passport.js).
-   **Email Verification**: New users must verify their email (via **Brevo**) before accessing the platform.
-   **Password Reset**: Secure, token-based password recovery flow via email.

### 🌐 Social & Network

-   **Social Feed**: Create posts with rich text, images, and videos.
-   **Interactions**: Like (with 5 reaction types: Like, Love, Celebrate, Insightful, Funny) and comment on posts.
-   **Networking**: Send, accept, or withdraw connection requests. View mutual connections.
-   **Discovery**: Find professionals based on skills and recommendations.

### ⚡ Real-time Communication

-   **Instant Messaging**: Chat with connections in real-time using **Socket.io**.
-   **Video Meetings**: Create and join secure P2P video rooms.
-   **Live Status**: Real-time online/offline status indicators.

### 🛠️ Developer Tools

-   **Live API Documentation**: Integrated **Swagger UI** to visualize and test backend endpoints at `/api-docs`.

---

## 🛠️ Tech Stack

### Frontend

-   **Framework**: [Next.js](https://nextjs.org/) (React)
-   **State Management**: Redux Toolkit
-   **Styling**: CSS Modules (with CSS Variables for Dynamic Theming)
-   **Real-time**: Socket.io-client
-   **Animations**: Framer Motion
-   **Icons**: Heroicons / SVGs

### Backend

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose)
-   **Real-time**: Socket.io
-   **Documentation**: Swagger UI Express & Swagger JSDoc
-   **File Storage**: Cloudinary (via Multer)
-   **Emails**: Brevo (Transactional Emails)
-   **Document Gen**: `docx` library (Resume generation)

---

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
