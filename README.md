# GenMark

AI-powered Personalized Content Generator

## Overview

GenMark is a full-stack application designed to help users create, edit, and manage personalized content for products or projects using AI. It supports text, image, and video generation, allowing for seamless workflow from dataset upload to project delivery. GenMark is ideal for marketers, product managers, and creators seeking to generate tailored marketing assets and product descriptions efficiently.

## Features

- **User Authentication:** Secure registration, login, and session management.
- **Dataset Management:** Upload, view, and delete datasets for training and content generation.
- **Project Management:** Create and manage projects, each associated with specific datasets and product information.
- **AI-Powered Generation:** Generate text, images, and videos for your product or project using advanced AI workflows.
- **Editing & Regeneration:** Edit generated content directly or trigger AI-powered regeneration for text, images, or videos.
- **Workflow System:** Track the status of generation and regeneration processes.
- **Download & Streaming:** Preview and download generated images and videos.
- **Modern Frontend:** Built with React and Vite for a fast, responsive user experience.
- **Backend API:** Powered by FastAPI, supporting robust project, dataset, and user management.

## Tech Stack

- **Frontend:** React, Vite, Axios, TailwindCSS
- **Backend:** FastAPI, Python
- **Authentication:** Cookie-based (with support for HTTPOnly cookies)
- **State Management:** React Context API
- **UI Components:** Custom Shadcn/UI components

## Getting Started

### Prerequisites

- Node.js (16+)
- Python 3.8+
- [Poetry](https://python-poetry.org/) or `pip`
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/) and [Vite](https://vitejs.dev/)

### Backend Setup

1. **Install dependencies:**

   ```sh
   cd backend
   poetry install
   # or pip install -r requirements.txt
   ```

2. **Run the FastAPI server:**

   ```sh
   uvicorn app.main:app --reload
   ```

   The backend will be available at `http://localhost:8000`.

### Frontend Setup

1. **Install dependencies:**

   ```sh
   cd frontend
   npm install
   ```

2. **Run the frontend dev server:**

   ```sh
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`.

### Configuration

- Ensure the backend CORS settings allow requests from your frontend URL (`http://localhost:5173` by default).
- Backend and frontend communicate via REST API endpoints (see `/frontend/src/lib/api.js` for details).

## Usage

1. **Register or log in** to your account.
2. **Upload datasets** relevant to your products or use cases.
3. **Create new projects** and provide product details.
4. **Generate content** (text, image, video) with AI-powered workflows.
5. **Edit or regenerate** outputs as needed for higher personalization.
6. **Download or stream** generated assets for use in your campaigns.

## API Endpoints

- **User:** `/user/register`, `/user/login`, `/user/profile`
- **Dataset:** `/datasets/`, `/datasets/upload`, `/datasets/{id}`
- **Project:** `/project/create`, `/project/all`, `/project/{id}`, `/project/outputs/{id}`
- **Generation:** `/project/regenerate/text|image|video/{id}`, `/project/workflow/{id}`
- **Outputs:** `/generated_output/{id}`, `/project/stream/image/{id}`

See `frontend/src/lib/api.js` for a detailed list of API endpoints and usage.

## Development

- React code is located in `frontend/src/`
- Python backend code in `backend/app/`
- UI components in `frontend/src/components/ui/`
- For custom logic, see `frontend/src/lib/` and backend routers in `backend/app/routes/`

## Contribution

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

_GenMark — AI-powered content at your fingertips._
