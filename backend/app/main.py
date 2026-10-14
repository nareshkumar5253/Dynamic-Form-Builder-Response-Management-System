
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.forms import router as forms_router
from app.routers.form_fields import router as form_fields_router
from app.routers.field_options import router as field_options_router
from app.routers.form_responses import router as form_responses_router
from app.routers.activity_logs import router as activity_logs_router
from app.routers.form_exports import router as form_exports_router
from app.routers.dashboard import router as dashboard_router

app = FastAPI(
    title="Dynamic Form Builder And Response Management System",
    description="API for dynamic form creation, submissions, analytics, and management.",
    version="1.0.0",
)

# CORS configuration for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(auth_router)
app.include_router(forms_router)
app.include_router(form_fields_router)
app.include_router(field_options_router)
app.include_router(form_responses_router)
app.include_router(activity_logs_router)
app.include_router(form_exports_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {
        "message": "Dynamic Form Builder API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
