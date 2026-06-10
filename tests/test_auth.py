import pytest
from httpx import AsyncClient
from app.core.security import hash_password
from app.core.permissions import Role
from app.models.user import User
from app.models.hospital import Hospital
from app.models.admin_group import AdminGroup


@pytest.fixture
async def seed_data(db_session):
    group = AdminGroup(name="Test Group", description="Test")
    db_session.add(group)
    await db_session.flush()
    hospital = Hospital(admin_group_id=group.id, name="Test Hospital", address="Test")
    db_session.add(hospital)
    await db_session.flush()
    user = User(hospital_id=hospital.id, email="doctor@test.com", password_hash=hash_password("TestPass123"), full_name="Dr. Test", phone="1234567890", role=Role.DOCTOR, is_active=True, is_verified=True)
    db_session.add(user)
    await db_session.commit()
    return {"email": "doctor@test.com", "password": "TestPass123"}


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, seed_data):
    response = await client.post("/api/v1/auth/login", json={"email": seed_data["email"], "password": seed_data["password"]})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, seed_data):
    response = await client.post("/api/v1/auth/login", json={"email": seed_data["email"], "password": "wrongpassword"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, seed_data):
    login_resp = await client.post("/api/v1/auth/login", json=seed_data)
    refresh_token = login_resp.json()["refresh_token"]
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, seed_data):
    login_resp = await client.post("/api/v1/auth/login", json=seed_data)
    access_token = login_resp.json()["access_token"]
    response = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, seed_data):
    login_resp = await client.post("/api/v1/auth/login", json=seed_data)
    access_token = login_resp.json()["access_token"]
    response = await client.post("/api/v1/auth/change-password", headers={"Authorization": f"Bearer {access_token}"}, json={"current_password": seed_data["password"], "new_password": "NewPass1234"})
    assert response.status_code == 200
