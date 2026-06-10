from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.treatment_plan_repository import TreatmentPlanRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.treatment_plan import TreatmentPlan


class TreatmentPlanService:
    def __init__(self, db: AsyncSession):
        self.repo = TreatmentPlanRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> TreatmentPlan:
        plan = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="CREATE_TREATMENT_PLAN", entity_type="TREATMENT_PLAN", entity_id=str(plan.id), details=f"Treatment plan '{plan.treatment_name}' created")
        return plan

    async def get(self, plan_id: str) -> Optional[TreatmentPlan]:
        return await self.repo.get(plan_id)

    async def get_by_case(self, case_id: str) -> List[TreatmentPlan]:
        return await self.repo.get_all(filters={"case_id": case_id})

    async def update(self, plan_id: str, data: dict, user_id: str = None) -> Optional[TreatmentPlan]:
        plan = await self.repo.update(plan_id, **data)
        if plan:
            await self.audit_log_repo.create(user_id=user_id, action="UPDATE_TREATMENT_PLAN", entity_type="TREATMENT_PLAN", entity_id=plan_id, details="Treatment plan updated")
        return plan

    async def delete(self, plan_id: str, user_id: str = None) -> bool:
        result = await self.repo.delete(plan_id)
        if result:
            await self.audit_log_repo.create(user_id=user_id, action="DELETE_TREATMENT_PLAN", entity_type="TREATMENT_PLAN", entity_id=plan_id, details="Treatment plan deleted")
        return result
