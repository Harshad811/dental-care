from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.refresh_token import RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: AsyncSession):
        super().__init__(RefreshToken, db)

    async def get_by_token_hash(self, token_hash: str) -> Optional[RefreshToken]:
        query = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def revoke_user_tokens(self, user_id: str) -> None:
        query = select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)
        result = await self.db.execute(query)
        tokens = result.scalars().all()
        for token in tokens:
            token.is_revoked = True
        await self.db.flush()
