from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.user import User
from app.core.security import hash_password


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> User:
        data["password_hash"] = hash_password(data.pop("password"))
        user = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="CREATE_USER", entity_type="USER", entity_id=str(user.id), details=f"User '{user.email}' created with role {user.role.value}")
        return user

    async def get(self, user_id: str) -> Optional[User]:
        return await self.repo.get(user_id)

    async def get_by_email(self, email: str) -> Optional[User]:
        return await self.repo.get_by_email(email)

    async def get_all(self, skip: int = 0, limit: int = 100, filters: dict = None) -> List[User]:
        return await self.repo.get_all(skip=skip, limit=limit, filters=filters)

    async def update(self, user_id: str, data: dict, admin_id: str = None) -> Optional[User]:
        if "password" in data:
            data["password_hash"] = hash_password(data.pop("password"))
        user = await self.repo.update(user_id, **data)
        if user:
            await self.audit_log_repo.create(user_id=admin_id, action="UPDATE_USER", entity_type="USER", entity_id=user_id, details="User updated")
        return user

    async def deactivate(self, user_id: str, admin_id: str = None) -> Optional[User]:
        user = await self.repo.update(user_id, is_active=False)
        if user:
            await self.audit_log_repo.create(user_id=admin_id, action="DEACTIVATE_USER", entity_type="USER", entity_id=user_id, details=f"User deactivated")
        return user

    async def activate(self, user_id: str, admin_id: str = None) -> Optional[User]:
        user = await self.repo.update(user_id, is_active=True)
        if user:
            await self.audit_log_repo.create(user_id=admin_id, action="ACTIVATE_USER", entity_type="USER", entity_id=user_id, details=f"User activated")
        return user
