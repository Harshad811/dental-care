import pytest
from httpx import AsyncClient
from app.core.security import hash_password
from app.core.permissions import Role
from app.models.user import User
from app.models.hospital import Hospital
from app.models.admin_group import AdminGroup


@pytest.fixture
async def seed_roles(db_session):
    group = AdminGroup(name="RBAC Group", description="RBAC Test")
    db_session.add(group)
    await db_session.flush()
    hospital = Hospital(admin_group_id=group.id, name="RBAC Hospital", address="Test")
    db_session.add(hospital)
    await db_session.flush()
    super_admin = User(hospital_id=hospital.id, email="super@test.com", password_hash=hash_password("TestPass123"), full_name="Super Admin", role=Role.SUPER_ADMIN, is_active=True, is_verified=True)
    doctor = User(hospital_id=hospital.id, email="doctor@test.com", password_hash=hash_password("TestPass123"), full_name="Dr. Test", role=Role.DOCTOR, is_active=True, is_verified=True)
    db_session.add_all([super_admin, doctor])
    await db_session.commit()
    return {"super_admin": {"email": "super@test.com", "password": "TestPass123"}, "doctor": {"email": "doctor@test.com", "password": "TestPass123"}}


@pytest.mark.asyncio
async def test_super_admin_access_admin_groups(client: AsyncClient, seed_roles):
    login = await client.post("/api/v1/auth/login", json=seed_roles["super_admin"])
    token = login.json()["access_token"]
    response = await client.get("/api/v1/admin-groups/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_doctor_denied_admin_groups(client: AsyncClient, seed_roles):
    login = await client.post("/api/v1/auth/login", json=seed_roles["doctor"])
    token = login.json()["access_token"]
    response = await client.get("/api/v1/admin-groups/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
