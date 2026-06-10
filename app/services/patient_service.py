from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.patient_repository import PatientRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.models.patient import Patient


class PatientService:
    def __init__(self, db: AsyncSession):
        self.repo = PatientRepository(db)
        self.audit_log_repo = AuditLogRepository(db)
        self.db = db

    async def create(self, data: dict, user_id: str = None) -> Patient:
        patient = await self.repo.create(**data)
        await self.audit_log_repo.create(user_id=user_id, action="CREATE_PATIENT", entity_type="PATIENT", entity_id=str(patient.id), details=f"Patient '{patient.full_name}' created")
        return patient

    async def get(self, patient_id: str) -> Optional[Patient]:
        return await self.repo.get(patient_id)

    async def get_all(self, skip: int = 0, limit: int = 100, filters: dict = None) -> List[Patient]:
        return await self.repo.get_all(skip=skip, limit=limit, filters=filters)

    async def search(self, query: str, hospital_id: str = None) -> List[Patient]:
        patients = await self.repo.get_all(filters={"hospital_id": hospital_id} if hospital_id else None)
        return [p for p in patients if query.lower() in p.full_name.lower() or (p.phone and query in p.phone) or (p.email and query.lower() in p.email.lower())]

    async def update(self, patient_id: str, data: dict, user_id: str = None) -> Optional[Patient]:
        patient = await self.repo.update(patient_id, **data)
        if patient:
            await self.audit_log_repo.create(user_id=user_id, action="UPDATE_PATIENT", entity_type="PATIENT", entity_id=patient_id, details="Patient updated")
        return patient
