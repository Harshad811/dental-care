from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.case_repository import CaseRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.case import Case, CaseStatus


class CaseService:
    def __init__(self, db: AsyncSession):
        self.repo = CaseRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> Case:
        case = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="CREATE_CASE", entity_type="CASE", entity_id=str(case.id), details="Case created")
        return case

    async def get(self, case_id: str) -> Optional[Case]:
        return await self.repo.get(case_id)

    async def get_all(self, skip: int = 0, limit: int = 100, filters: dict = None) -> List[Case]:
        return await self.repo.get_all(skip=skip, limit=limit, filters=filters)

    async def update(self, case_id: str, data: dict, user_id: str = None) -> Optional[Case]:
        if "status" in data:
            data["status"] = CaseStatus(data["status"])
        case = await self.repo.update(case_id, **data)
        if case:
            await self.audit_log_repo.create(user_id=user_id, action="UPDATE_CASE", entity_type="CASE", entity_id=case_id, details=f"Case updated")
        return case

    async def assign_consultant(self, case_id: str, consultant_id: str, user_id: str = None) -> Optional[Case]:
        case = await self.repo.update(case_id, consultant_id=consultant_id)
        if case:
            await self.audit_log_repo.create(user_id=user_id, action="ASSIGN_CONSULTANT", entity_type="CASE", entity_id=case_id, details=f"Consultant assigned")
        return case

    async def complete(self, case_id: str, user_id: str = None) -> Optional[Case]:
        case = await self.repo.update(case_id, status=CaseStatus.COMPLETED)
        if case:
            await self.audit_log_repo.create(user_id=user_id, action="COMPLETE_CASE", entity_type="CASE", entity_id=case_id, details="Case completed")
        return case
