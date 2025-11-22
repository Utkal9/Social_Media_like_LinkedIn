# LinkUps - Professional Networking Platform

LinkUps is a full-stack social media application designed for professional networking. It allows users to build their professional profile, connect with others, share posts, chat in real-time, and even generate a resume automatically from their profile data.

## 🚀 Features

-   **Authentication**: Secure Login and Registration system.
-   **Professional Profile**: Manage your bio, work experience, education, projects, skills, and achievements.
-   **Smart Resume Builder**: Automatically generate and download a formatted `.docx` resume based on your profile data.
-   **Social Feed**: Create posts with text, images, and videos. Like (with multiple reaction types) and comment on posts.
-   **Network Management**: Send, accept, or decline connection requests. View mutual connections.
-   **Real-time Messaging**: Instant chat with your connections using Socket.io.
-   **Video Meetings**: Host or join video calls directly from the platform.
-   **Discovery**: Find new professionals to connect with based on recommendations.

## 🛠️ Tech Stack

### Frontend

-   **Framework**: [Next.js](https://nextjs.org/)
-   **State Management**: Redux Toolkit
-   **Styling**: CSS Modules
-   **Real-time**: Socket.io-client
-   **Icons**: Heroicons / SVGs

### Backend

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose)
-   **Real-time**: Socket.io
-   **File Storage**: Cloudinary (via Multer)
-   **Document Generation**: `docx` (for Resume Builder)
-   **Authentication**: JSON Web Tokens (custom token implementation via crypto/bcrypt)

## 📦 Installation & Setup

To run this project locally, you need to set up both the **frontend** and **backend** environments.

### Prerequisites

-   Node.js installed
-   MongoDB connection string (Local or Atlas)
-   Cloudinary Account (for image/video uploads)

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend
Install dependencies:

Bash

npm install
Create a .env file in the backend folder and add the following variables:

Code snippet

PORT=9090
MONGO_URL=your_mongodb_connection_string
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
Start the server:

Bash

npm run dev
The backend will run on http://localhost:9090.

2. Frontend Setup
Open a new terminal and navigate to the frontend directory:

Bash

cd frontend
Install dependencies:

Bash

npm install
Create a .env.local file in the frontend folder and add the following variables:

Code snippet

NEXT_PUBLIC_API_URL=http://localhost:9090
NEXT_PUBLIC_VIDEO_CALL_URL=http://localhost:3001
# (Note: You might need a separate video server or ZegoCloud integration depending on your video implementation)
Start the application:

Bash

npm run dev
The frontend will run on http://localhost:3000.

📂 Project Structure
├── backend/
│   ├── config/         # Database & Cloudinary config
│   ├── controllers/    # Logic for User, Post, Messaging
│   ├── models/         # Mongoose Schemas (User, Post, Profile, etc.)
│   ├── routes/         # API Routes
│   ├── templates/      # HTML templates (if any)
│   └── server.js       # Entry point & Socket.io setup
│
├── frontend/
│   ├── src/
│   │   ├── config/     # Redux Store & Axios setup
│   │   ├── context/    # Socket Context
│   │   ├── layout/     # Layout wrappers (UserLayout, DashboardLayout)
│   │   ├── pages/      # Next.js Pages (dashboard, profile, login, etc.)
│   │   └── styles/     # Global and module CSS files
│   └── public/         # Static assets
🛡️ License
This project is open-source and available under the MIT License.
```
