from fastapi import FastAPI
from app.routes import project, dataset, user, generatedoutput, send_email, edit_output
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()
VITE_APP_URL = os.getenv('VITE_APP_UL')

app = FastAPI(
    title="Your Project API",
    description="Backend API for managing projects, datasets, products, and users",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[VITE_APP_URL],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(dataset.router)
app.include_router(user.router)
app.include_router(project.router)
app.include_router(send_email.router)
app.include_router(generatedoutput.router)
app.include_router(edit_output.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the API"}

