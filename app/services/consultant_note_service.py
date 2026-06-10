from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.consultant_note_repository import ConsultantNoteRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.consultant_note import ConsultantNote


class ConsultantNoteService:
    def __init__(self, db: AsyncSession):
        self.repo = ConsultantNoteRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> ConsultantNote:
        note = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="ADD_CONSULTANT_NOTE", entity_type="CONSULTANT_NOTE", entity_id=str(note.id), details="Consultant note added")
        return note

    async def get_by_case(self, case_id: str) -> List[ConsultantNote]:
        return await self.repo.get_all(filters={"case_id": case_id})
