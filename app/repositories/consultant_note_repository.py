from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.consultant_note import ConsultantNote


class ConsultantNoteRepository(BaseRepository[ConsultantNote]):
    def __init__(self, db: AsyncSession):
        super().__init__(ConsultantNote, db)
