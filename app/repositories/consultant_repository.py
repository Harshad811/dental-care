from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.consultant import Consultant


class ConsultantRepository(BaseRepository[Consultant]):
    def __init__(self, db: AsyncSession):
        super().__init__(Consultant, db)
