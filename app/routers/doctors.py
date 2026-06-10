from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import verify_permission, Permission, Role
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(data: UserCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_DOCTOR)
    service = UserService(db)
    data_dict = data.model_dump()
    data_dict["role"] = Role.DOCTOR.value
    return await service.create(data_dict, user_id=current_user.get("sub"))


@router.get("/")
async def get_doctors(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=200), hospital_id: Optional[str] = Query(None), db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = UserService(db)
    filters = {"role": Role.DOCTOR.value}
    if hospital_id:
        filters["hospital_id"] = hospital_id
    return await service.get_all(skip=skip, limit=limit, filters=filters)


@router.get("/{doctor_id}", response_model=UserResponse)
async def get_doctor(doctor_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = UserService(db)
    doctor = await service.get(doctor_id)
    if not doctor or doctor.role != Role.DOCTOR:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.put("/{doctor_id}", response_model=UserResponse)
async def update_doctor(doctor_id: str, data: UserUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_DOCTOR)
    service = UserService(db)
    doctor = await service.update(doctor_id, data.model_dump(exclude_none=True), admin_id=current_user.get("sub"))
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.post("/{doctor_id}/deactivate", response_model=MessageResponse)
async def deactivate_doctor(doctor_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.MANAGE_STAFF)
    service = UserService(db)
    doctor = await service.deactivate(doctor_id, admin_id=current_user.get("sub"))
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return MessageResponse(message="Doctor deactivated successfully")


@router.post("/{doctor_id}/activate", response_model=MessageResponse)
async def activate_doctor(doctor_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.MANAGE_STAFF)
    service = UserService(db)
    doctor = await service.activate(doctor_id, admin_id=current_user.get("sub"))
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return MessageResponse(message="Doctor activated successfully")
