from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.appointment import Appointment, AppointmentStatus


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.repo = AppointmentRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> Appointment:
        appointment = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="CREATE_APPOINTMENT", entity_type="APPOINTMENT", entity_id=str(appointment.id), details="Appointment created")
        return appointment

    async def get(self, appointment_id: str) -> Optional[Appointment]:
        return await self.repo.get(appointment_id)

    async def get_all(self, skip: int = 0, limit: int = 100, filters: dict = None) -> List[Appointment]:
        return await self.repo.get_all(skip=skip, limit=limit, filters=filters)

    async def update(self, appointment_id: str, data: dict, user_id: str = None) -> Optional[Appointment]:
        if "status" in data:
            data["status"] = AppointmentStatus(data["status"])
        appointment = await self.repo.update(appointment_id, **data)
        if appointment:
            await self.audit_log_repo.create(user_id=user_id, action="UPDATE_APPOINTMENT", entity_type="APPOINTMENT", entity_id=appointment_id, details=f"Appointment updated")
        return appointment

    async def get_upcoming(self, doctor_id: str = None, hospital_id: str = None) -> List[Appointment]:
        filters = {"status": AppointmentStatus.SCHEDULED.value}
        if doctor_id:
            filters["doctor_id"] = doctor_id
        return await self.repo.get_all(filters=filters)

    async def cancel(self, appointment_id: str, user_id: str = None) -> Optional[Appointment]:
        return await self.update(appointment_id, {"status": AppointmentStatus.CANCELLED.value}, user_id)
