# Full-Stack Weather Alert System

This project is a full-stack weather alert system. It allows users to create weather alerts based on location and conditions (e.g., temperature > 30°C). A backend service periodically checks real-time weather data from the Tomorrow.io API against these alerts. If an alert's condition is met, its status is updated to "triggered", and an optional SMS notification can be sent via Twilio. A React frontend provides a user interface to view current weather, create/manage alerts, and see which alerts are currently triggered.

## Technologies Used

- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), `node-schedule` (for task scheduling), `twilio` (for SMS), `zod` (for validation)
- **Frontend:** React, Vite, TypeScript, `@mui/material` (for UI components)
- **Database:** MongoDB
- **External APIs:** Tomorrow.io (Weather Data), Twilio (SMS Notifications)

## Project Structure

This repository uses a monorepo structure:

- `/backend`: Contains the Node.js/Express backend server code.
- `/frontend`: Contains the React/Vite frontend application code.

## Prerequisites

- **Node.js:** Version 20.x or higher recommended (due to frontend dependencies). Using `nvm` (Node Version Manager) is suggested.
- **npm:** Should be installed with Node.js.
- **MongoDB URI:** Connection string for your MongoDB database (local or cloud-hosted like MongoDB Atlas).
- **Tomorrow.io API Key:** Obtain an API key from [Tomorrow.io](https://app.tomorrow.io/signup).
- **Twilio Account:** Obtain an Account SID, Auth Token, and a Twilio phone number from [Twilio](https://www.twilio.com/try-twilio).

## Setup Instructions

1.  **Clone the Repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install Backend Dependencies:**

    ```bash
    cd backend
    npm install
    cd ..
    ```

3.  **Install Frontend Dependencies:**

    ```bash
    cd frontend
    npm install
    cd ..
    ```

4.  **Configure Backend Environment Variables:**

    - Create a file named `.env` in the `/backend` directory.
    - Add the following content, replacing placeholders with your actual credentials:

      ```env
      # Tomorrow.io API Key (replace with your actual key)
      TOMORROW_IO_API_KEY=YOUR_API_KEY_HERE
      ```

## Running the Application

You need to run both the backend and frontend servers concurrently.

1.  **Run the Backend Server:**

    - Open a terminal in the project root.
    - Navigate to the backend directory and start the development server:
      ```bash
      cd backend
      npm run dev
      ```
    - This will compile the TypeScript code, start the server (likely on port 5001), and watch for changes.

2.  **Run the Frontend Server:**

    - Open a **separate** terminal in the project root.
    - Navigate to the frontend directory and start the Vite development server:
      ```bash
      cd frontend
      npm run dev
      ```
    - This will start the frontend application (likely on port 5173) and open it in your browser.

3.  **Access the Application:**
    - Open your web browser and navigate to the URL provided by the Vite server (usually `http://localhost:5173`).

## Notes & Assumptions

- The scheduled job in the backend runs every 5 minutes by default (`*/5 * * * *`) to check alert conditions.
- Basic error handling is implemented, but can be improved.
- Styling is minimal.
- Alert deletion/editing is not implemented.
