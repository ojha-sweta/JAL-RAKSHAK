from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dashboard import router as dashboard_router
from app.api.telemetry import router as telemetry_router
from app.api.device import router as device_router
from app.api.alerts import router as alerts_router
from app.api.cycles import router as cycles_router
from app.api.ml import router as ml_router

from app.database.database import Base, engine

from app.models.telemetry import Telemetry
from app.models.cycle import TreatmentCycle
from app.models.command import DeviceCommand
from app.models.device import Device
from app.models.alert import AlertState


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="JAL-RAKSHAK API",
    description=(
        "Backend API for smart water quality monitoring "
        "and adaptive treatment control."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(
    telemetry_router,
    prefix="/api/telemetry",
    tags=["Telemetry"],
)


app.include_router(
    dashboard_router,
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


app.include_router(
    device_router,
    prefix="/api/device",
    tags=["Device"],
)


app.include_router(
    alerts_router,
    prefix="/api/alerts",
    tags=["Alerts"],
)
app.include_router(
    cycles_router,
    prefix="/api/cycles",
    tags=["Cycles"],
)
app.include_router(ml_router, prefix="/api/ml", tags=["Machine Learning"])

# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():

    return {
        "system": "JAL-RAKSHAK",
        "status": "online",
        "service": "FastAPI Backend",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health_check():

    return {
        "status": "healthy",
        "backend": "online",
        "database": "connected",
    }