from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.treatment_sitting import TreatmentSitting


class TreatmentSittingRepository(BaseRepository[TreatmentSitting]):
    def __init__(self, db: AsyncSession):
        super().__init__(TreatmentSitting, db)
