from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.pre_op import PreOp


class PreOpRepository(BaseRepository[PreOp]):
    def __init__(self, db: AsyncSession):
        super().__init__(PreOp, db)
