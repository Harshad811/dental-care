from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import os, shutil, uuid
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import verify_permission, Permission, Role
from app.services.patient_service import PatientService
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.schemas.common import MessageResponse
from app.config import settings

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(data: PatientCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_PATIENT)
    service = PatientService(db)
    return await service.create(data.model_dump(), user_id=current_user.get("sub"))


@router.get("/")
async def get_patients(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=200), hospital_id: Optional[str] = Query(None), doctor_id: Optional[str] = Query(None), db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PatientService(db)
    filters = {}
    if hospital_id:
        filters["hospital_id"] = hospital_id
    if doctor_id:
        filters["doctor_id"] = doctor_id
    if current_user.get("role") == Role.DOCTOR.value:
        filters["doctor_id"] = current_user.get("sub")
    return await service.get_all(skip=skip, limit=limit, filters=filters or None)


@router.get("/search")
async def search_patients(q: str = Query(..., min_length=1), hospital_id: Optional[str] = Query(None), db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PatientService(db)
    return await service.search(q, hospital_id=hospital_id)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PatientService(db)
    patient = await service.get(patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, data: PatientUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.MANAGE_PATIENTS)
    service = PatientService(db)
    patient = await service.update(patient_id, data.model_dump(exclude_none=True), user_id=current_user.get("sub"))
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.post("/{patient_id}/photo", response_model=PatientResponse)
async def upload_patient_photo(patient_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.MANAGE_PATIENTS)
    service = PatientService(db)
    patient = await service.get(patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, "patient_photos")
    os.makedirs(upload_path, exist_ok=True)
    with open(os.path.join(upload_path, filename), "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    patient = await service.update(patient_id, {"photo_url": f"/uploads/patient_photos/{filename}"}, user_id=current_user.get("sub"))
    return patient
