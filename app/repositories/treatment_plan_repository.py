from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.treatment_plan import TreatmentPlan


class TreatmentPlanRepository(BaseRepository[TreatmentPlan]):
    def __init__(self, db: AsyncSession):
        super().__init__(TreatmentPlan, db)
