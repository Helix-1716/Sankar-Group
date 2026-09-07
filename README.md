# Sankar Group - Project Management Dashboard

A modern, full-stack project management application built for teams. The dashboard allows teams to track projects, manage tasks via Kanban boards, monitor project progress, and manage team members effectively.

## 🚀 Features

- **Authentication**: Secure Google Sign-In and standard email/password authentication using Firebase.
- **Kanban Board**: Drag-and-drop task management within projects (To Do, In Progress, Done).
- **Project Tracking**: High-level overview of project timelines, statuses, and completion percentages.
- **Team Profiles**: Individual profiles for team members showcasing their roles, contact information, and assigned tasks.
- **Modern UI**: Clean, human-centered design using a crisp black/white/light-red color palette with fluid animations and modern typography (Poppins).

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS (with DaisyUI), React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: Firebase Auth

## 📦 Getting Started

### Prerequisites
- Node.js installed on your machine
- MongoDB instance running locally or via MongoDB Atlas
- Firebase project configured with Google Sign-In enabled

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Helix-1716/Sankar-Group.git
   cd Sankar-Group
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Variables**
   - In `client/`, create a `.env` file with your Firebase configuration keys (VITE_FIREBASE_API_KEY, etc).
   - In `server/`, create a `.env` file with your `MONGO_URI` and any necessary JWT secrets. Also, place your Firebase `serviceAccountKey.json` here.

5. **Run the Application**
   - Open a terminal and start the backend:
     ```bash
     cd server
     npm start
     ```
   - Open another terminal and start the frontend:
     ```bash
     cd client
     npm run dev
     ```

## 📄 License

This project is licensed under the MIT License.