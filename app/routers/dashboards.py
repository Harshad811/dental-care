from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import Role
from app.repositories.admin_group_repository import AdminGroupRepository
from app.repositories.hospital_repository import HospitalRepository
from app.repositories.user_repository import UserRepository
from app.repositories.patient_repository import PatientRepository
from app.repositories.case_repository import CaseRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.billing_repository import BillingRepository

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("/super-admin")
async def super_admin_dashboard(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != Role.SUPER_ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    group_repo = AdminGroupRepository(db)
    hospital_repo = HospitalRepository(db)
    user_repo = UserRepository(db)
    patient_repo = PatientRepository(db)
    billing_repo = BillingRepository(db)
    billings = await billing_repo.get_all()
    return {"total_groups": await group_repo.count(), "total_hospitals": await hospital_repo.count(), "total_doctors": await user_repo.count(filters={"role": Role.DOCTOR.value}), "total_patients": await patient_repo.count(), "total_revenue": sum(b.paid_amount for b in billings)}


@router.get("/group-admin")
async def group_admin_dashboard(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    hospital_repo = HospitalRepository(db)
    user_repo = UserRepository(db)
    patient_repo = PatientRepository(db)
    return {"total_hospitals": await hospital_repo.count(), "total_doctors": await user_repo.count(filters={"role": Role.DOCTOR.value}), "total_patients": await patient_repo.count()}


@router.get("/hospital-admin")
async def hospital_admin_dashboard(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    hospital_id = current_user.get("hospital_id")
    patient_repo = PatientRepository(db)
    case_repo = CaseRepository(db)
    appointment_repo = AppointmentRepository(db)
    billing_repo = BillingRepository(db)
    billings = await billing_repo.get_all()
    return {"today_appointments": await appointment_repo.count(), "total_revenue": sum(b.paid_amount for b in billings), "total_patients": await patient_repo.count(filters={"hospital_id": hospital_id}) if hospital_id else 0, "total_cases": await case_repo.count()}


@router.get("/doctor")
async def doctor_dashboard(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    doctor_id = current_user.get("sub")
    patient_repo = PatientRepository(db)
    case_repo = CaseRepository(db)
    appointment_repo = AppointmentRepository(db)
    return {"my_patients": await patient_repo.count(filters={"doctor_id": doctor_id}), "today_appointments": await appointment_repo.count(filters={"doctor_id": doctor_id, "status": "SCHEDULED"}), "active_cases": await case_repo.count(filters={"doctor_id": doctor_id})}
