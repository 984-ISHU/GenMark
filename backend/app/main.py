from fastapi import FastAPI
from app.routes import project, dataset, user, generatedoutput, send_email, edit_output
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    docs_url=None,       # disables /docs (Swagger UI)
    redoc_url=None,      # disables /redoc (ReDoc documentation)
    openapi_url=None     # disables /openapi.json (OpenAPI schema endpoint)
)

origins = [
    "https://gen-mark.vercel.app",  # ✅ Your deployed frontend
    "http://localhost:5173",           # Optional for local testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],     # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],     # Allow all headers
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

@app.api_route("/", methods=["GET", "HEAD"])
async def root_health():
    return {"status": "ok"}
