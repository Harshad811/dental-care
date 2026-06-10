from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date, time


class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_date: date
    appointment_time: time
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    appointment_date: date
    appointment_time: time
    status: str
    notes: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
