# RBAC Matrix (RBAC_MATRIX.md)
## PolliBondhu — Role & Permission Access Control

**Version:** 2.0  
**Date:** August 2026  

---

## 1. Role Hierarchy

```
SUPER_ADMIN
  └── SUB_ADMIN (scoped to assigned departments/areas)
        └── OFFICER (scoped to assigned department/service/location)

SERVICE_PROVIDER (scoped to own services)
NGO_ADMIN (scoped to own NGO)
INSTITUTION_ADMIN (scoped to own institution)
TEACHER/STAFF (scoped to assigned courses/students)
CITIZEN/USER (scoped to own data)
```

---

## 2. Permission Naming Convention

```
{module}.{action}
```

**Modules:** user, role, permission, department, location, service, application, complaint, project, budget, agriculture, education, ngo, messaging, notification, event, news, waste, emergency, audit, settings, dashboard

**Actions:** view, create, update, delete, assign, approve, reject, resolve, manage, broadcast

---

## 3. Permission Matrix

### 3.1 User Management

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| user.view | ✅ (all) | ✅ (assigned) | ✅ (assigned) | ❌ | ❌ | ❌ | ✅ (own students) | ✅ (own) |
| user.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (self) |
| user.update | ✅ (all) | ✅ (assigned) | ❌ | ✅ (own) | ✅ (own NGO) | ✅ (own inst) | ✅ (own) | ✅ (own) |
| user.delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user.deactivate | ✅ | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.2 Role & Permission Management

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| role.view | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| role.create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| role.update | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| role.delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| permission.view | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| permission.assign | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.3 Department Management

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| department.view | ✅ (all) | ✅ (assigned) | ✅ (own) | ❌ | ❌ | ❌ | ❌ | ❌ |
| department.create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| department.update | ✅ | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| department.delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| department.manage_officers | ✅ | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.4 Service Management

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| service.view | ✅ (all) | ✅ (dept) | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) | ❌ | ✅ (public) |
| service.create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| service.update | ✅ (all) | ✅ (dept) | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) | ❌ | ❌ |
| service.delete | ✅ | ✅ (dept) | ❌ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ | ❌ |
| service.approve | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| service.reject | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.5 Application Management

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| application.view | ✅ (all) | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ✅ (own inst) | ✅ (own) | ✅ (own) |
| application.create | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| application.process | ✅ | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ✅ (own inst) | ❌ | ❌ |
| application.approve | ✅ | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ✅ (own inst) | ❌ | ❌ |
| application.reject | ✅ | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ✅ (own inst) | ❌ | ❌ |
| application.request_document | ✅ | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ✅ (own inst) | ❌ | ❌ |

### 3.6 Complaint Management

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| complaint.view | ✅ (all) | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ✅ (own) |
| complaint.create | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| complaint.assign | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| complaint.update | ✅ | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ❌ |
| complaint.resolve | ✅ | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ❌ |
| complaint.verify | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (own) |
| complaint.close | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (own) |

### 3.7 Project & Budget Management

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| project.view | ✅ (all) | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ✅ (public) |
| project.create | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| project.update | ✅ | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ❌ |
| project.delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| project.feedback | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (public) |
| budget.view | ✅ (all) | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (public) |
| budget.create | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| budget.update | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| budget.approve | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.8 Agriculture

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| agriculture.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| agriculture.create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| agriculture.update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| market_price.manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| soil_test.request | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| soil_test.process | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.9 Education

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| institution.view | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (own) | ✅ (own) | ✅ |
| institution.create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| institution.manage | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ (own) | ❌ | ❌ |
| course.view | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (own) | ✅ (own) | ✅ |
| course.create | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ (own) | ❌ | ❌ |
| course.manage | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ (own) | ✅ (own) | ❌ |
| student.view | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ (own) | ✅ (own) | ❌ |
| student.enroll | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ (own) | ❌ | ✅ (self) |

### 3.10 NGOs & Social Support

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| ngo.view | ✅ | ✅ | ✅ | ❌ | ✅ (own) | ❌ | ❌ | ✅ |
| ngo.create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ngo.manage | ✅ | ❌ | ❌ | ❌ | ✅ (own) | ❌ | ❌ | ❌ |
| programme.view | ✅ | ✅ | ✅ | ❌ | ✅ (own) | ❌ | ❌ | ✅ |
| programme.create | ✅ | ❌ | ❌ | ❌ | ✅ (own) | ❌ | ❌ | ❌ |
| programme.enroll | ❌ | ❌ | ❌ | ❌ | ✅ (own) | ❌ | ❌ | ✅ |
| donation.manage | ✅ | ❌ | ❌ | ❌ | ✅ (own) | ❌ | ❌ | ✅ (donate) |

### 3.11 Messaging & Notifications

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| message.send | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| message.receive | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| message.group_create | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| message.department_chat | ✅ | ✅ (dept) | ✅ (own dept) | ❌ | ❌ | ❌ | ❌ | ❌ |
| notification.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| notification.broadcast | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.12 Waste Management

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| waste.view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| waste.report | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| waste.manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| waste.zone.manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.13 Emergency & Events

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| emergency.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| emergency.manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| emergency.contact.manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| event.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| event.create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| event.attend | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| news.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| news.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| news.publish | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.14 Audit & System

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| audit.view | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| audit.export | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings.view | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings.update | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| dashboard.super.view | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| dashboard.subadmin.view | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| dashboard.officer.view | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ❌ | ❌ | ❌ |
| dashboard.citizen.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 3.15 AI Assistant

| Permission | SUPER_ADMIN | SUB_ADMIN | OFFICER | SERVICE_PROVIDER | NGO_ADMIN | INSTITUTION_ADMIN | TEACHER | CITIZEN |
|------------|:-----------:|:---------:|:-------:|:----------------:|:---------:|:-----------------:|:-------:|:-------:|
| ai.chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ai.access_user_data | ✅ (all) | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ❌ | ✅ (own students) | ✅ (own) |
| ai.access_budget_data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ai.access_complaint_data | ✅ (all) | ✅ (dept) | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ✅ (own) |

---

## 4. Data Scoping Rules

### 4.1 SUPER_ADMIN
- Sees ALL data across ALL departments and locations
- Can manage ANY user, ANY service, ANY complaint
- Can view audit logs and system settings

### 4.2 SUB_ADMIN
- Sees data ONLY within assigned departments
- Can manage officers within those departments
- Cannot see data from other departments
- Cannot access system settings or audit logs

### 4.3 OFFICER
- Sees data ONLY for assigned complaints/applications
- Can communicate with citizens on assigned cases
- Cannot see other officers' cases
- Cannot manage departments or users

### 4.4 SERVICE_PROVIDER
- Sees ONLY own services
- Cannot see citizen data
- Cannot see other providers' services

### 4.5 NGO_ADMIN
- Sees ONLY own NGO's programmes and data
- Can manage own NGO members
- Cannot see government or other NGO data

### 4.6 INSTITUTION_ADMIN
- Sees ONLY own institution's courses, students, teachers
- Can manage own institution's announcements
- Cannot see other institutions' data

### 4.7 TEACHER/STAFF
- Sees ONLY students assigned to their courses
- Can manage course content
- Cannot see other teachers' students

### 4.8 CITIZEN
- Sees ONLY own applications, complaints, messages, notifications
- Can view public information (services, projects, news, events)
- Cannot see other citizens' private data
- Cannot see internal admin/officer data

---

## 5. AI RBAC Enforcement

The AI assistant must enforce the same RBAC rules:

1. **Before processing any query**, check user's role and permissions
2. **Never reveal** data the user cannot access through the REST API
3. **Filter responses** based on user's department and location assignments
4. **For budget queries**: Only SUPER_ADMIN can access
5. **For complaint queries**: Only assigned officers see their cases
6. **For user data queries**: Only SUPER_ADMIN/SUB_ADMIN see other users
7. **For application queries**: Citizens see only their own applications
8. **Log all AI interactions** for audit purposes
