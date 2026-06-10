from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.billing_repository import BillingRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.billing import Billing, PaymentStatus


class BillingService:
    def __init__(self, db: AsyncSession):
        self.repo = BillingRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> Billing:
        data["pending_amount"] = data.get("total_amount", 0) - data.get("paid_amount", 0)
        if data["pending_amount"] <= 0:
            data["payment_status"] = PaymentStatus.PAID.value
        elif data.get("paid_amount", 0) > 0:
            data["payment_status"] = PaymentStatus.PARTIAL.value
        billing = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="CREATE_BILLING", entity_type="BILLING", entity_id=str(billing.id), details=f"Billing created")
        return billing

    async def get(self, billing_id: str) -> Optional[Billing]:
        return await self.repo.get(billing_id)

    async def get_by_case(self, case_id: str) -> List[Billing]:
        return await self.repo.get_all(filters={"case_id": case_id})

    async def update_payment(self, billing_id: str, paid_amount: float, user_id: str = None) -> Optional[Billing]:
        billing = await self.repo.get(billing_id)
        if not billing:
            return None
        billing.paid_amount += paid_amount
        billing.pending_amount = billing.total_amount - billing.paid_amount
        if billing.pending_amount <= 0:
            billing.payment_status = PaymentStatus.PAID
        else:
            billing.payment_status = PaymentStatus.PARTIAL
        await self.db.flush()
        await self.db.refresh(billing)
        await self.audit_log_repo.create(user_id=user_id, action="UPDATE_BILLING_PAYMENT", entity_type="BILLING", entity_id=billing_id, details=f"Payment of {paid_amount} received")
        return billing

    async def get_revenue(self, hospital_id: str = None) -> Dict[str, Any]:
        billings = await self.repo.get_all()
        return {"total_revenue": sum(b.paid_amount for b in billings), "total_pending": sum(b.pending_amount for b in billings), "total_billings": len(billings)}
