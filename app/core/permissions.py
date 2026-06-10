from enum import Enum
from typing import List
from fastapi import HTTPException, status


class Role(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    GROUP_ADMIN = "GROUP_ADMIN"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    DOCTOR = "DOCTOR"


class Permission(str, Enum):
    CREATE_GROUP_ADMIN = "CREATE_GROUP_ADMIN"
    MANAGE_GROUP_ADMINS = "MANAGE_GROUP_ADMINS"
    VIEW_ALL_HOSPITALS = "VIEW_ALL_HOSPITALS"
    VIEW_GLOBAL_REVENUE = "VIEW_GLOBAL_REVENUE"
    VIEW_GLOBAL_REPORTS = "VIEW_GLOBAL_REPORTS"
    VIEW_ALL_PATIENTS = "VIEW_ALL_PATIENTS"
    VIEW_ALL_DOCTORS = "VIEW_ALL_DOCTORS"
    MANAGE_PLATFORM = "MANAGE_PLATFORM"
    CREATE_HOSPITAL = "CREATE_HOSPITAL"
    CREATE_HOSPITAL_ADMIN = "CREATE_HOSPITAL_ADMIN"
    VIEW_OWN_HOSPITALS = "VIEW_OWN_HOSPITALS"
    VIEW_REVENUE_ANALYTICS = "VIEW_REVENUE_ANALYTICS"
    VIEW_DOCTOR_PERFORMANCE = "VIEW_DOCTOR_PERFORMANCE"
    VIEW_HOSPITAL_PERFORMANCE = "VIEW_HOSPITAL_PERFORMANCE"
    CREATE_DOCTOR = "CREATE_DOCTOR"
    CREATE_CONSULTANT = "CREATE_CONSULTANT"
    MANAGE_PATIENTS = "MANAGE_PATIENTS"
    MANAGE_APPOINTMENTS = "MANAGE_APPOINTMENTS"
    MANAGE_CASES = "MANAGE_CASES"
    MANAGE_BILLING = "MANAGE_BILLING"
    MANAGE_STAFF = "MANAGE_STAFF"
    CREATE_PATIENT = "CREATE_PATIENT"
    CREATE_APPOINTMENT = "CREATE_APPOINTMENT"
    CREATE_CASE = "CREATE_CASE"
    CREATE_TREATMENT_PLAN = "CREATE_TREATMENT_PLAN"
    ADD_PRE_OP = "ADD_PRE_OP"
    ADD_POST_OP = "ADD_POST_OP"
    ASSIGN_CONSULTANT = "ASSIGN_CONSULTANT"
    UPDATE_BILLING = "UPDATE_BILLING"
    COMPLETE_TREATMENT = "COMPLETE_TREATMENT"


ROLE_PERMISSIONS = {
    Role.SUPER_ADMIN: [
        Permission.CREATE_GROUP_ADMIN, Permission.MANAGE_GROUP_ADMINS,
        Permission.VIEW_ALL_HOSPITALS, Permission.VIEW_GLOBAL_REVENUE,
        Permission.VIEW_GLOBAL_REPORTS, Permission.VIEW_ALL_PATIENTS,
        Permission.VIEW_ALL_DOCTORS, Permission.MANAGE_PLATFORM,
    ],
    Role.GROUP_ADMIN: [
        Permission.CREATE_HOSPITAL, Permission.CREATE_HOSPITAL_ADMIN,
        Permission.VIEW_OWN_HOSPITALS, Permission.VIEW_REVENUE_ANALYTICS,
        Permission.VIEW_DOCTOR_PERFORMANCE, Permission.VIEW_HOSPITAL_PERFORMANCE,
    ],
    Role.HOSPITAL_ADMIN: [
        Permission.CREATE_DOCTOR, Permission.CREATE_CONSULTANT,
        Permission.MANAGE_PATIENTS, Permission.MANAGE_APPOINTMENTS,
        Permission.MANAGE_CASES, Permission.MANAGE_BILLING, Permission.MANAGE_STAFF,
    ],
    Role.DOCTOR: [
        Permission.CREATE_PATIENT, Permission.CREATE_APPOINTMENT,
        Permission.CREATE_CASE, Permission.CREATE_TREATMENT_PLAN,
        Permission.ADD_PRE_OP, Permission.ADD_POST_OP,
        Permission.ASSIGN_CONSULTANT, Permission.UPDATE_BILLING,
        Permission.COMPLETE_TREATMENT,
    ],
}


def verify_permission(current_user: dict, *permissions: Permission):
    user_role = current_user.get("role")
    if user_role not in [r.value for r in Role]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")
    user_permissions = ROLE_PERMISSIONS.get(Role(user_role), [])
    for perm in permissions:
        if perm in user_permissions:
            return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing required permission: {permissions[0].value}")
