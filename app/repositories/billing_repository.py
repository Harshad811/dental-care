from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.billing import Billing


class BillingRepository(BaseRepository[Billing]):
    def __init__(self, db: AsyncSession):
        super().__init__(Billing, db)
