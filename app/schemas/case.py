from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CaseCreate(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    consultant_id: Optional[str] = None
    chief_complaint: str = Field(..., min_length=1)
    diagnosis: Optional[str] = None
    notes: Optional[str] = None


class CaseUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    status: Optional[str] = None
    consultant_id: Optional[str] = None
    notes: Optional[str] = None


class CaseResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str]
    consultant_id: Optional[str]
    chief_complaint: str
    diagnosis: Optional[str]
    status: str
    notes: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
