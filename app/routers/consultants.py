from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import verify_permission, Permission
from app.services.consultant_service import ConsultantService
from app.schemas.consultant import ConsultantCreate, ConsultantUpdate, ConsultantResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/consultants", tags=["Consultants"])


@router.post("/", response_model=ConsultantResponse, status_code=status.HTTP_201_CREATED)
async def create_consultant(data: ConsultantCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_CONSULTANT)
    service = ConsultantService(db)
    return await service.create(data.model_dump(), user_id=current_user.get("sub"))


@router.get("/")
async def get_consultants(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=200), hospital_id: Optional[str] = Query(None), db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = ConsultantService(db)
    filters = {}
    if hospital_id:
        filters["hospital_id"] = hospital_id
    return await service.get_all(skip=skip, limit=limit, filters=filters or None)


@router.get("/{consultant_id}", response_model=ConsultantResponse)
async def get_consultant(consultant_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = ConsultantService(db)
    consultant = await service.get(consultant_id)
    if not consultant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultant not found")
    return consultant


@router.put("/{consultant_id}", response_model=ConsultantResponse)
async def update_consultant(consultant_id: str, data: ConsultantUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_CONSULTANT)
    service = ConsultantService(db)
    consultant = await service.update(consultant_id, data.model_dump(exclude_none=True), user_id=current_user.get("sub"))
    if not consultant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultant not found")
    return consultant
