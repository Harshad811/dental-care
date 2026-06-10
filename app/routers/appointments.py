from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import verify_permission, Permission, Role
from app.services.appointment_service import AppointmentService
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(data: AppointmentCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_APPOINTMENT)
    service = AppointmentService(db)
    return await service.create(data.model_dump(), user_id=current_user.get("sub"))


@router.get("/")
async def get_appointments(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=200), patient_id: Optional[str] = Query(None), doctor_id: Optional[str] = Query(None), status_filter: Optional[str] = Query(None, alias="status"), db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = AppointmentService(db)
    filters = {}
    if patient_id:
        filters["patient_id"] = patient_id
    if doctor_id:
        filters["doctor_id"] = doctor_id
    if status_filter:
        filters["status"] = status_filter
    if current_user.get("role") == Role.DOCTOR.value:
        filters["doctor_id"] = current_user.get("sub")
    return await service.get_all(skip=skip, limit=limit, filters=filters or None)


@router.get("/upcoming")
async def get_upcoming_appointments(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = AppointmentService(db)
    doctor_id = current_user.get("sub") if current_user.get("role") == Role.DOCTOR.value else None
    return await service.get_upcoming(doctor_id=doctor_id)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = AppointmentService(db)
    appointment = await service.get(appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: str, data: AppointmentUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.MANAGE_APPOINTMENTS)
    service = AppointmentService(db)
    appointment = await service.update(appointment_id, data.model_dump(exclude_none=True), user_id=current_user.get("sub"))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appointment


@router.post("/{appointment_id}/cancel", response_model=MessageResponse)
async def cancel_appointment(appointment_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.MANAGE_APPOINTMENTS)
    service = AppointmentService(db)
    appointment = await service.cancel(appointment_id, user_id=current_user.get("sub"))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return MessageResponse(message="Appointment cancelled successfully")
