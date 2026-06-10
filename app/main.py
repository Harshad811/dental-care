import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine
from app.core.security import hash_password
from app.core.permissions import Role
from app.utils.scheduler import check_appointment_reminders, check_missed_appointments
from app.routers import auth, admin_groups, hospitals, doctors, consultants, patients, cases, consultant_notes, treatment_plans, treatment_sittings, appointments, billings, pre_ops, post_ops, dashboards, whatsapp_messaging


def run_migrations():
    base_dir = Path(__file__).resolve().parents[1]
    config = Config(str(base_dir / "alembic" / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL_SYNC)
    command.upgrade(config, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await asyncio.to_thread(run_migrations)
    await seed_super_admin()
    reminder_task = asyncio.create_task(check_appointment_reminders())
    missed_task = asyncio.create_task(check_missed_appointments())
    yield
    reminder_task.cancel()
    missed_task.cancel()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Dental Hospital Management System - Multi-Tenant SaaS Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin_groups.router, prefix="/api/v1")
app.include_router(hospitals.router, prefix="/api/v1")
app.include_router(doctors.router, prefix="/api/v1")
app.include_router(consultants.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1")
app.include_router(cases.router, prefix="/api/v1")
app.include_router(consultant_notes.router, prefix="/api/v1")
app.include_router(treatment_plans.router, prefix="/api/v1")
app.include_router(treatment_sittings.router, prefix="/api/v1")
app.include_router(appointments.router, prefix="/api/v1")
app.include_router(billings.router, prefix="/api/v1")
app.include_router(pre_ops.router, prefix="/api/v1")
app.include_router(post_ops.router, prefix="/api/v1")
app.include_router(dashboards.router, prefix="/api/v1")
app.include_router(whatsapp_messaging.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "version": "1.0.0", "docs": "/docs", "redoc": "/redoc"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


async def seed_super_admin():
    from sqlalchemy import select
    from app.database import async_session_factory
    from app.models.user import User
    async with async_session_factory() as db:
        query = select(User).where(User.email == settings.SUPER_ADMIN_EMAIL)
        result = await db.execute(query)
        existing = result.scalar_one_or_none()
        if not existing:
            super_admin = User(
                email=settings.SUPER_ADMIN_EMAIL,
                password_hash=hash_password(settings.SUPER_ADMIN_PASSWORD),
                full_name="Super Admin",
                role=Role.SUPER_ADMIN,
                is_verified=True,
            )
            db.add(super_admin)
            await db.commit()