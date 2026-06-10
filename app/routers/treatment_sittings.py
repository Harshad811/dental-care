from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import verify_permission, Permission
from app.services.treatment_sitting_service import TreatmentSittingService
from app.schemas.treatment_sitting import TreatmentSittingCreate, TreatmentSittingUpdate, TreatmentSittingResponse

router = APIRouter(prefix="/treatment-sittings", tags=["Treatment Sittings"])


@router.post("/", response_model=TreatmentSittingResponse, status_code=status.HTTP_201_CREATED)
async def create_sitting(data: TreatmentSittingCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_TREATMENT_PLAN)
    service = TreatmentSittingService(db)
    return await service.create(data.model_dump(), user_id=current_user.get("sub"))


@router.get("/by-plan/{plan_id}")
async def get_sittings_by_plan(plan_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = TreatmentSittingService(db)
    return await service.get_by_plan(plan_id)


@router.get("/{sitting_id}", response_model=TreatmentSittingResponse)
async def get_sitting(sitting_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = TreatmentSittingService(db)
    sitting = await service.get(sitting_id)
    if not sitting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment sitting not found")
    return sitting


@router.put("/{sitting_id}", response_model=TreatmentSittingResponse)
async def update_sitting(sitting_id: str, data: TreatmentSittingUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_TREATMENT_PLAN)
    service = TreatmentSittingService(db)
    sitting = await service.update(sitting_id, data.model_dump(exclude_none=True), user_id=current_user.get("sub"))
    if not sitting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment sitting not found")
    return sitting
