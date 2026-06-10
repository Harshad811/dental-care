from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.hospital import Hospital


class HospitalRepository(BaseRepository[Hospital]):
    def __init__(self, db: AsyncSession):
        super().__init__(Hospital, db)
