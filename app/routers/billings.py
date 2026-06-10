from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import verify_permission, Permission
from app.services.billing_service import BillingService
from app.schemas.billing import BillingCreate, BillingUpdate, BillingResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/billings", tags=["Billings"])


@router.post("/", response_model=BillingResponse, status_code=status.HTTP_201_CREATED)
async def create_billing(data: BillingCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.MANAGE_BILLING)
    service = BillingService(db)
    return await service.create(data.model_dump(), user_id=current_user.get("sub"))


@router.get("/by-case/{case_id}")
async def get_billings_by_case(case_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = BillingService(db)
    return await service.get_by_case(case_id)


@router.get("/{billing_id}", response_model=BillingResponse)
async def get_billing(billing_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = BillingService(db)
    billing = await service.get(billing_id)
    if not billing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Billing not found")
    return billing


@router.put("/{billing_id}/payment", response_model=BillingResponse)
async def update_payment(billing_id: str, data: BillingUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.UPDATE_BILLING)
    service = BillingService(db)
    paid_amount = data.paid_amount or 0
    billing = await service.update_payment(billing_id, paid_amount, user_id=current_user.get("sub"))
    if not billing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Billing not found")
    return billing
