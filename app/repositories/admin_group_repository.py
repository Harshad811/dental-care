from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.admin_group import AdminGroup


class AdminGroupRepository(BaseRepository[AdminGroup]):
    def __init__(self, db: AsyncSession):
        super().__init__(AdminGroup, db)
