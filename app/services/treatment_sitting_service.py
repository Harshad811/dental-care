from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.treatment_sitting_repository import TreatmentSittingRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.treatment_sitting import TreatmentSitting


class TreatmentSittingService:
    def __init__(self, db: AsyncSession):
        self.repo = TreatmentSittingRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> TreatmentSitting:
        sitting = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="CREATE_TREATMENT_SITTING", entity_type="TREATMENT_SITTING", entity_id=str(sitting.id), details=f"Sitting #{sitting.sitting_number} created")
        return sitting

    async def get(self, sitting_id: str) -> Optional[TreatmentSitting]:
        return await self.repo.get(sitting_id)

    async def get_by_plan(self, treatment_plan_id: str) -> List[TreatmentSitting]:
        return await self.repo.get_all(filters={"treatment_plan_id": treatment_plan_id})

    async def update(self, sitting_id: str, data: dict, user_id: str = None) -> Optional[TreatmentSitting]:
        sitting = await self.repo.update(sitting_id, **data)
        if sitting:
            await self.audit_log_repo.create(user_id=user_id, action="UPDATE_TREATMENT_SITTING", entity_type="TREATMENT_SITTING", entity_id=sitting_id, details="Treatment sitting updated")
        return sitting
