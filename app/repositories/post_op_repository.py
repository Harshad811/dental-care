from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.post_op import PostOp


class PostOpRepository(BaseRepository[PostOp]):
    def __init__(self, db: AsyncSession):
        super().__init__(PostOp, db)
