from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.admin_group_repository import AdminGroupRepository
from app.repositories.hospital_repository import HospitalRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.admin_group import AdminGroup


class AdminGroupService:
    def __init__(self, db: AsyncSession):
        self.repo = AdminGroupRepository(db)
        self.hospital_repo = HospitalRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> AdminGroup:
        group = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="CREATE_ADMIN_GROUP", entity_type="ADMIN_GROUP", entity_id=str(group.id), details=f"Admin group '{group.name}' created")
        return group

    async def get(self, group_id: str) -> Optional[AdminGroup]:
        return await self.repo.get(group_id)

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[AdminGroup]:
        return await self.repo.get_all(skip=skip, limit=limit)

    async def update(self, group_id: str, data: dict, user_id: str = None) -> Optional[AdminGroup]:
        group = await self.repo.update(group_id, **data)
        if group:
            await self.audit_log_repo.create(user_id=user_id, action="UPDATE_ADMIN_GROUP", entity_type="ADMIN_GROUP", entity_id=group_id, details="Admin group updated")
        return group

    async def delete(self, group_id: str, user_id: str = None) -> bool:
        result = await self.repo.delete(group_id)
        if result:
            await self.audit_log_repo.create(user_id=user_id, action="DELETE_ADMIN_GROUP", entity_type="ADMIN_GROUP", entity_id=group_id, details="Admin group deleted")
        return result

    async def get_analytics(self, group_id: str = None) -> Dict[str, Any]:
        return {"total_groups": 1 if group_id else await self.repo.count(), "total_hospitals": await self.hospital_repo.count({"admin_group_id": group_id} if group_id else None)}
