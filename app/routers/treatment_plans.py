from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import verify_permission, Permission
from app.services.treatment_plan_service import TreatmentPlanService
from app.schemas.treatment_plan import TreatmentPlanCreate, TreatmentPlanUpdate, TreatmentPlanResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/treatment-plans", tags=["Treatment Plans"])


@router.post("/", response_model=TreatmentPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_treatment_plan(data: TreatmentPlanCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_TREATMENT_PLAN)
    service = TreatmentPlanService(db)
    return await service.create(data.model_dump(), user_id=current_user.get("sub"))


@router.get("/by-case/{case_id}")
async def get_plans_by_case(case_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = TreatmentPlanService(db)
    return await service.get_by_case(case_id)


@router.get("/{plan_id}", response_model=TreatmentPlanResponse)
async def get_treatment_plan(plan_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = TreatmentPlanService(db)
    plan = await service.get(plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment plan not found")
    return plan


@router.put("/{plan_id}", response_model=TreatmentPlanResponse)
async def update_treatment_plan(plan_id: str, data: TreatmentPlanUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_TREATMENT_PLAN)
    service = TreatmentPlanService(db)
    plan = await service.update(plan_id, data.model_dump(exclude_none=True), user_id=current_user.get("sub"))
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment plan not found")
    return plan


@router.delete("/{plan_id}", response_model=MessageResponse)
async def delete_treatment_plan(plan_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_TREATMENT_PLAN)
    service = TreatmentPlanService(db)
    deleted = await service.delete(plan_id, user_id=current_user.get("sub"))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment plan not found")
    return MessageResponse(message="Treatment plan deleted successfully")
