from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.patient import Patient


class PatientRepository(BaseRepository[Patient]):
    def __init__(self, db: AsyncSession):
        super().__init__(Patient, db)
