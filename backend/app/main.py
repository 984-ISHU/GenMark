from fastapi import FastAPI
from app.routes import project, dataset, user, send_email
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(
    title="Your Project API",
    description="Backend API for managing projects, datasets, products, and users",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(dataset.router)
app.include_router(user.router)
app.include_router(project.router)
app.include_router(send_email.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the API"}

