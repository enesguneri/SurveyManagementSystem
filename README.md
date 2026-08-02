# 🚀 User Management System API

A production-ready RESTful API built with **.NET 10** and **PostgreSQL**, adhering to **Clean Architecture** principles. Features secure JWT authentication, role-based access control (RBAC), global exception handling, and performant **Server-Side DataTables** support.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Database Schema](#-database-schema)
- [Development Roadmap (Sprint Plan)](#-development-roadmap-sprint-plan)
- [Getting Started](#-getting-started)
- [Security Configuration](#-security-configuration)

---

## ✨ Features

- 🏗 **Clean Architecture:** Strict separation of concerns across Domain, Application, Persistence, and API layers for high maintainability and testability.
- 🔐 **Authentication & Authorization:** Password hashing & salting using HMACSHA512 combined with JWT (JSON Web Token) bearer authentication.
- 👥 **Role-Based Access Control (RBAC):** Flexible Many-to-Many relationship model between Users and Roles.
- 📊 **Server-Side DataTables Support:** Optimized server-side pagination, multi-column sorting, and dynamic filtering via `IQueryable` LINQ queries.
- 🛡 **Security & Privacy:** Environment-isolated credential management using .NET User Secrets to prevent sensitive data leaks.
- 🌐 **Global Exception Handling:** Standardized error response model (`ApiResponse<T>`) across all API endpoints via custom middleware.

---

## 🛠 Tech Stack

- **Framework:** .NET 10 Web API
- **Database:** PostgreSQL
- **ORM:** Entity Framework Core (Npgsql)
- **Security & Tokens:** System.IdentityModel.Tokens.Jwt, System.Security.Cryptography
- **Documentation:** OpenAPI / Swagger UI
- **Version Control:** Git & GitHub (Git Flow)

---

## 🏛 Project Architecture

```text
UserManagementSystem/
├── src/
│   ├── UserManagement.Domain/        # Entities, Value Objects, Core Models
│   ├── UserManagement.Application/   # DTOs, Interfaces, Service Logic
│   ├── UserManagement.Persistence/   # AppDbContext, Fluent API Mappings, Migrations
│   └── UserManagement.API/           # Controllers, Middlewares, Dependency Injection
```

---

## 🗄 Database Schema

Configured using Entity Framework Core Fluent API:

- **Users:** `Id`, `Name`, `Username`, `Email`, `PasswordHash`, `PasswordSalt`, `CreatedAt`, `IsActive`
- **Roles:** `Id`, `Name`, `CreatedAt`, `IsActive`
- **UserRoles:** `UserId`, `RoleId` *(Composite Primary Key)*

```text
[ Users ] 1 <---> N [ UserRoles ] N <---> 1 [ Roles ]
```

---

## 🗺 Development Roadmap (Sprint Plan)

### 📌 Sprint 1: Architecture Setup & Database Infrastructure (✅ Completed)
- [x] Solution & Clean Architecture setup (`Domain`, `Application`, `Persistence`, `API`)
- [x] Entity modeling and PostgreSQL integration
- [x] Fluent API mapping and Data Seeding configuration
- [x] EF Core Migrations setup and initial database deployment

### 📌 Sprint 2: Security, Authentication & Swagger UI (✅ Completed)
- [x] Standardized API response model (`ApiResponse<T>`) implementation
- [x] Global Exception Handling Middleware integration
- [x] DTO design (`RegisterDto`, `LoginDto`, `UserDto`, `TokenResponseDto`)
- [x] Password Hashing/Salting and JWT Token generation service
- [x] `Login` and `Register` endpoint integration
- [x] Swagger UI JWT Bearer Authorization setup & OpenAPI v2 architecture integration

### 📌 Sprint 3: Server-Side DataTables & User Service (⏳ Planned)
- [ ] Server-Side DataTables request & response DTO modeling
- [ ] Server-side pagination, sorting, and filtering logic via `IQueryable`
- [ ] `UsersController` implementation returning DataTable-compliant JSON

### 📌 Sprint 4: Testing & Documentation (⏳ Planned)
- [ ] Endpoint validation against HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- [ ] Code refactoring and technical documentation completion

---

## 🚀 Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [PostgreSQL](https://www.postgresql.org/download/) & pgAdmin
- Git

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/enesguneri/UserManagementSystem.git
   cd UserManagementSystem
   ```

2. **Configure Database Connection (User Secrets):**
   Set your local PostgreSQL connection string securely without exposing credentials to Git:
   ```bash
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=UserManagementDb;Username=postgres;Password=YOUR_POSTGRES_PASSWORD" --project src/UserManagement.API
   ```

3. **Apply Database Migrations:**
   ```bash
   dotnet ef database update --project src/UserManagement.Persistence --startup-project src/UserManagement.API
   ```

4. **Run the Application:**
   ```bash
   dotnet run --project src/UserManagement.API
   ```

---

## 🔒 Security Configuration

This project enforces strict security practices. Database connection strings, API keys, and JWT Secret Keys are **never** hardcoded in repository files or `appsettings.json`. The `.NET User Secrets` manager is utilized in local development, ensuring sensitive credentials remain isolated from public source control.