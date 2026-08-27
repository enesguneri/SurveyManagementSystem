# 🎓 İzmir Bakırçay University Survey Management System

> İzmir Bakırçay Üniversitesi için geliştirilen modern, güvenli ve dinamik anket yönetim platformu.

[![CI Pipeline](https://github.com/enesguneri/SurveyManagementSystem/actions/workflows/ci.yml/badge.svg)](https://github.com/enesguneri/SurveyManagementSystem/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-83%20passed-brightgreen)](https://github.com/enesguneri/SurveyManagementSystem)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB)](https://react.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing-729B1B)](https://vitest.dev/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1)](https://www.mysql.com/)
[![Material UI](https://img.shields.io/badge/UI-Material%20UI-007FFF)](https://mui.com/)

## 📌 About the Project

The Survey Management System is a full-stack web application that enables authorized users to create, publish, manage, and analyze dynamic surveys.

The platform supports:

- 🔐 Secure authentication and authorization
- 📝 Dynamic survey creation
- 🏢 Unit-based access control
- 📊 Response management and export
- 🤖 Gemini AI-assisted survey generation
- 📥 External option import
- 🎨 Modern and responsive user interface

## ✨ Features

### 🔐 Authentication and Authorization

- User registration and login
- JWT-based authentication
- Password hashing and salting
- Role-based authorization
- Unit-based form authorization
- Admin panel
- Swagger JWT Bearer authentication

### 📝 Survey Management

- Dynamic survey creation
- Draft, published, and closed survey statuses
- Multiple organizational units per survey
- Anonymous or authenticated survey access
- One-response-per-user rule for authenticated surveys
- Draft survey editing
- Survey publishing and closing

### 🧩 Supported Question Types

- Short text
- Long text
- Date
- Single choice
- Multiple choice
- Dropdown
- Rating
- Multiple-choice matrix
- Checkbox matrix

### ✅ Validation

- Required question validation
- Minimum and maximum text length
- Regular expression validation
- Numeric range validation
- Minimum and maximum date validation

### 📊 Response Management

- Response submission
- Response viewing
- Respondent name snapshot
- Respondent email snapshot
- Respondent IP address tracking
- Submission date and time tracking
- Matrix and checkbox matrix responses
- Duplicate submission protection

### 📤 Import and Export

- TXT option import
- CSV option import
- JSON option import
- External HTTPS API option import
- Searchable dropdown options
- CSV response export
- Excel response export
- Separate rows for multiple-choice selections

### 🤖 Gemini AI Assistant

- AI-assisted survey draft generation
- Clarification questions for incomplete prompts
- Visual draft preview
- Manual review before database registration
- No automatic database save without user confirmation

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Backend | .NET 10 Web API, C# |
| ORM | Entity Framework Core |
| Database | MySQL |
| Authentication | JWT Bearer |
| API Documentation | Swagger / OpenAPI |
| Frontend | React, TypeScript, Vite |
| UI | Material UI |
| HTTP Client | Axios |
| AI | Gemini API |
| Version Control | Git and GitHub |

## 🏗️ Project Architecture

The backend follows a layered architecture approach.

```text
SurveyManagementSystem/
├── SurveyManagement.Domain/
│   ├── Entities/
│   └── Enums/
│
├── SurveyManagement.Application/
│   ├── Common/
│   ├── DTOs/
│   ├── Interfaces/
│   └── Services/
│
├── SurveyManagement.Persistence/
│   ├── Context/
│   └── Migrations/
│
├── SurveyManagement.API/
│   ├── Controllers/
│   ├── Middlewares/
│   └── Program.cs
│
└── frontend/
    ├── public/
    ├── src/
    └── package.json
```

### 🧱 Layer Responsibilities

| Layer | Responsibility |
|---|---|
| Domain | Entities, enums, and core business models |
| Application | DTOs, interfaces, business logic, and services |
| Persistence | Database context, migrations, and EF Core configuration |
| API | Controllers, middleware, Swagger, and HTTP pipeline |
| Frontend | User interface, routing, forms, and API communication |

## 🗄️ Database Structure

Main tables:

- `Users`
- `Roles`
- `UserRoles`
- `Forms`
- `FormRoles`
- `Questions`
- `QuestionOptions`
- `QuestionValidations`
- `MatrixRows`
- `MatrixColumns`
- `FormResponses`
- `ResponseAnswers`
- `ResponseAnswerOptions`
- `ResponseMatrixAnswers`

### 🔗 Main Relationships

```text
Users N ──── N Roles
      UserRoles

Forms N ──── N Roles
      FormRoles

Forms 1 ──── N Questions
Questions 1 ──── N QuestionOptions
Questions 1 ──── 1 QuestionValidations

Forms 1 ──── N FormResponses
FormResponses 1 ──── N ResponseAnswers
ResponseAnswers 1 ──── N ResponseAnswerOptions
ResponseAnswers 1 ──── N ResponseMatrixAnswers
```

A form can belong to multiple organizational units through the `FormRoles` junction table.

## 🚀 Backend Setup

### 📋 Prerequisites

- .NET 10 SDK
- MySQL Server 8+
- Git
- Entity Framework Core CLI

Install Entity Framework CLI:

```powershell
dotnet tool install --global dotnet-ef
```

### 📦 Restore and Build

```powershell
dotnet restore .\SurveyManagementSystem.slnx
dotnet build .\SurveyManagementSystem.slnx
```

### 🗃️ Database Configuration

Update the connection string in:

```text
SurveyManagement.API/appsettings.json
```

Example:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=SurveyManagementDb;User=root;Password=YOUR_MYSQL_PASSWORD"
  }
}
```

> ⚠️ Never commit real passwords, JWT secrets, or API keys to GitHub.

### 🔄 Apply Migrations

```powershell
dotnet ef database update `
  --project .\SurveyManagement.Persistence `
  --startup-project .\SurveyManagement.API
```

### ➕ Create a Migration

```powershell
dotnet ef migrations add MigrationName `
  --project .\SurveyManagement.Persistence `
  --startup-project .\SurveyManagement.API
```

### ▶️ Run the API

```powershell
dotnet run --project .\SurveyManagement.API
```

Swagger UI:

```text
https://localhost:7143/swagger
```

## 🤖 Gemini Configuration

Gemini settings should be stored using User Secrets or environment variables.

```powershell
dotnet user-secrets init `
  --project .\SurveyManagement.API
```

```powershell
dotnet user-secrets set "Gemini:ApiKey" "YOUR_GEMINI_API_KEY" `
  --project .\SurveyManagement.API
```

```powershell
dotnet user-secrets set "Gemini:Model" "gemini-3.5-flash-lite" `
  --project .\SurveyManagement.API
```

The AI workflow:

1. The user enters a survey description.
2. Gemini generates a draft.
3. Gemini asks clarification questions if necessary.
4. The frontend displays a visual preview.
5. The user reviews and edits the draft.
6. The user manually saves the survey.

## 💻 Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

The API URL is configured in:

```text
frontend/.env.development
```

Example:

```env
VITE_API_BASE_URL=https://localhost:7143/api
```

### 🏗️ Frontend Build

```powershell
cd frontend
npm run build
```

### 🧹 Frontend Lint

```powershell
cd frontend
npm run lint
```

## 📥 Option Import

The system supports importing choice options from:

- TXT files
- CSV files
- JSON files
- External HTTPS APIs

External API imports include:

- JSON path selection
- Text property selection
- Searchable preview
- Duplicate removal
- Response size limits
- Maximum option count
- Maximum option length
- Local and private network protection

## 📤 Response Export

Authorized users can export responses in:

- CSV format
- Excel format (`.xlsx`)

The export files may contain:

- Response ID
- Submission timestamp
- Respondent name
- Respondent email
- Respondent IP address
- Answer details
- Selected options
- Matrix selections

Export permissions are checked according to the user's access to the related form.

## 🔒 Security

- JWT Bearer authentication
- Role-based authorization
- Unit-based form authorization
- Password hashing and salting
- Global exception middleware
- Secure error responses
- HTTPS-only external option imports
- Local and private IP blocking
- Disabled automatic external redirects
- Unique authenticated response constraint
- Sensitive configuration stored outside source control

## 🌿 Git Workflow

The project follows the Git Flow strategy.

Main branches:

- `main`
- `develop`

Feature branch example:

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/new-feature
```

### 📝 Conventional Commits

```text
feat(forms): add survey publishing workflow
fix(auth): resolve token validation issue
refactor(responses): simplify response processing
docs: update project documentation
chore: update dependencies
```

## 🗺️ Sprint Roadmap

### Sprint 1 — Architecture and Database Infrastructure

**Status: Completed ✅**

- Layered architecture
- Entity modeling
- MySQL integration
- Fluent API relationships
- Data seeding
- EF Core migrations
- PostgreSQL-to-MySQL data migration

### Sprint 2 — Authentication and Authorization

**Status: Completed ✅**

- Registration and login
- Password hashing
- JWT token generation
- Swagger Bearer authentication
- Global exception middleware
- Role-based authorization

### Sprint 3 — Survey Domain and Form Management

**Status: Completed ✅**

- Dynamic survey creation
- Question types
- Question options
- Dropdown support
- Matrix questions
- Validation rules
- Draft editing
- Publishing and closing
- Unit-based form ownership

### Sprint 4 — Survey Responses

**Status: Completed ✅**

- Response submission
- Date and rating responses
- Matrix responses
- Respondent metadata
- IP address tracking
- Response viewing
- One response per authenticated user
- Duplicate race-condition handling

### Sprint 5 — Frontend and Administration

**Status: Completed ✅**

- React frontend
- Survey builder
- Survey listing
- Response viewer
- Admin panel
- Unit-based role management
- Responsive Turkish interface
- İzmir Bakırçay University branding

### Sprint 6 — AI, Import, Export, and Deployment

**Status: AI, import, and export completed; deployment planned 🚧**

- Gemini AI assistant
- Clarification questions
- Visual AI draft preview
- TXT, CSV, JSON, and API option import
- Searchable dropdowns
- CSV response export
- Excel response export
- Secure external API handling
- Docker configuration
- Automated tests
- CI/CD pipeline
- Production deployment

Docker, automated tests, CI/CD, and production deployment are planned for a later stage.

## 📌 Development Principles

The project follows:

- SOLID principles
- Clean Code practices
- Layered architecture
- Separation of concerns
- Secure configuration management
- Conventional Commits
- Git Flow
- Code-first database migrations
