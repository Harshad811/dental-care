from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.case import Case


class CaseRepository(BaseRepository[Case]):
    def __init__(self, db: AsyncSession):
        super().__init__(Case, db)
