# Secure Exam Platform

A robust, AI-proctored, secure examination platform built with a modern tech stack. Features real-time behavior monitoring, suspicion scoring, and a comprehensive admin reporting dashboard.

## 🚀 Key Features

- **AI Proctoring**: Real-time face detection (powered by `face-api.js`) to monitor for head movements, multiple faces, or face absence.
- **Microphone Monitoring**: Detects persistent background noise or talking using the Web Audio API.
- **Anti-Cheating Safeguards**: 
  - Fullscreen enforcement.
  - Tab switching and window blur detection.
  - Right-click and copy-paste blocking.
- **Automated Suspicion Scoring**: Logic-based scoring system that weights different violations to categorize attempts (SAFE, SUSPICIOUS, HIGH RISK).
- **Admin Dashboard**: Comprehensive view for instructors to review exam attempts, timelines of suspicious events, and detailed reports.
- **Secure Architecture**: JWT-based authentication with role-based access control (Student vs. Admin).

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Vanilla CSS, `face-api.js`, `axios`, `react-router-dom`.
- **Backend**: Node.js, Express, `jsonwebtoken`, `bcryptjs`.
- **Database**: MongoDB (Mongoose).

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB instance)

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/harshbuddy01/secure-exam.git
cd secure-exam
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```
Start the backend:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
```

## 🧪 Testing Scenarios

Refer to the included [Testing Guide](./TESTING.md) to simulate various cheating behaviors and verify the proctoring engine.

## 📄 License
This project is for educational purposes.
