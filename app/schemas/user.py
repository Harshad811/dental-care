from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    hospital_id: Optional[str] = None
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None
    role: str
    specialization: Optional[str] = None
    license_number: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    hospital_id: Optional[str]
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    is_active: bool
    specialization: Optional[str]
    license_number: Optional[str]
    is_verified: bool
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
