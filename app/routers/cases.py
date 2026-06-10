from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import verify_permission, Permission
from app.services.case_service import CaseService
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(data: CaseCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.CREATE_CASE)
    service = CaseService(db)
    return await service.create(data.model_dump(), user_id=current_user.get("sub"))


@router.get("/")
async def get_cases(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=200), patient_id: Optional[str] = Query(None), doctor_id: Optional[str] = Query(None), status_filter: Optional[str] = Query(None, alias="status"), db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = CaseService(db)
    filters = {}
    if patient_id:
        filters["patient_id"] = patient_id
    if doctor_id:
        filters["doctor_id"] = doctor_id
    if status_filter:
        filters["status"] = status_filter
    return await service.get_all(skip=skip, limit=limit, filters=filters or None)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = CaseService(db)
    case = await service.get(case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(case_id: str, data: CaseUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.MANAGE_CASES)
    service = CaseService(db)
    case = await service.update(case_id, data.model_dump(exclude_none=True), user_id=current_user.get("sub"))
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.post("/{case_id}/assign-consultant", response_model=CaseResponse)
async def assign_consultant(case_id: str, consultant_id: str = Query(...), db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.ASSIGN_CONSULTANT)
    service = CaseService(db)
    case = await service.assign_consultant(case_id, consultant_id, user_id=current_user.get("sub"))
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.post("/{case_id}/complete", response_model=CaseResponse)
async def complete_case(case_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    verify_permission(current_user, Permission.COMPLETE_TREATMENT)
    service = CaseService(db)
    case = await service.complete(case_id, user_id=current_user.get("sub"))
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case
