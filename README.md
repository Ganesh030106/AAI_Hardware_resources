# AssertIQ Hardware Resources Management System

**AssertIQ** is a full-stack hardware and IT resource management platform for organizations. It features an Express-based Node.js REST API backend and a modern React Vite frontend styled with Tailwind CSS. It supports user/administrator authentication, hardware requests and issues tracking, inventory management, PDF export, and dashboard analytics.

---

## Repository Structure

This repository is organized as a monorepo:

- **`backend/`**: Node.js & Express API server. Connects to MongoDB, manages models/schemas, routes business logic, and generates PDF exports.
- **`frontend/`**: React, Vite, and Tailwind CSS SPA client.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (local installation or MongoDB Atlas cloud instance)

### 2. Installation
From the root of the repository, install the dependencies for both subprojects:
```sh
# Install frontend dependencies
npm run install-frontend

# Install backend dependencies
npm run install-backend
```

### 3. Environment Variables Configuration

#### Backend Configuration
Create a `.env` file in the `backend/` directory:
```env
MONGO_URI="mongodb://127.0.0.1:27017/assert_IQ"
PORT="3000"
```

#### Frontend Configuration
Create a `.env` file in the `frontend/` directory:
```env
# The local development API base (blank defaults to Vite's local dev proxy)
VITE_API_BASE_URL=
```

---

## Running the Application Locally

To run the application locally, start both the backend and frontend servers:

### Start the Backend
Navigate to the `backend/` folder and run the developer server:
```sh
cd backend
npm run dev
```
The backend server will run at `http://localhost:3000` and watch for changes.

### Start the Frontend
Navigate to the `frontend/` folder and run the Vite dev server:
```sh
cd frontend
npm run dev
```
The frontend application will be available at `http://localhost:5173`. Vite's dev server is configured to proxy all `/api/*` requests automatically to `http://localhost:3000`.

---

## Deployment

To deploy this application to production with a **strictly isolated backend** on **Render** and a **static frontend** on **Vercel**, refer to the step-by-step instructions in the [DEPLOYMENT.md](DEPLOYMENT.md) guide in the root directory.
