# İzmir Bakırçay University Survey Management System

A full-stack survey management platform developed for İzmir Bakırçay University.

The system allows authorized users to create, publish, manage, and analyze dynamic surveys. It is built with .NET 10 Web API, PostgreSQL, Entity Framework Core, React, TypeScript, and Material UI.

## Features

- JWT-based authentication
- User registration and login
- Role-based authorization
- Admin panel
- Unit-based role management
- Assigning multiple units to a survey
- Dynamic survey creation
- Draft, published, and closed survey statuses
- Short text and paragraph questions
- Single-choice and multiple-choice questions
- Dropdown questions
- Rating questions
- Date questions
- Multiple-choice matrix questions
- Checkbox matrix questions
- Question validation rules
- Anonymous or authenticated survey access
- Respondent name, IP address, and submission date tracking
- Survey response viewing
- Swagger/OpenAPI documentation
- Global exception handling
- Standardized API response model

## Technology Stack

### Backend

- .NET 10 Web API
- Entity Framework Core
- PostgreSQL
- JWT Bearer Authentication
- Swagger / OpenAPI
- Fluent API
- Git and GitHub

### Frontend

- React
- TypeScript
- Vite
- Material UI
- Axios
- React Router

## Project Architecture

```text
SurveyManagementSystem/
├── SurveyManagement.Domain/
│   ├── Entities/
│   └── Enums/
│
├── SurveyManagement.Application/
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
    ├── src/
    ├── public/
    └── package.json
```

## Database Structure

The main database tables are:

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

A survey can belong to multiple organizational units through the `FormRoles` junction table:

```text
Forms N ──── N Roles
       FormRoles
```

## Backend Setup

### Prerequisites

- .NET 10 SDK
- PostgreSQL
- Git
- Entity Framework Core CLI

### Restore and Build

```powershell
dotnet restore .\SurveyManagementSystem.slnx
dotnet build .\SurveyManagementSystem.slnx
```

### Apply Database Migrations

```powershell
dotnet ef database update `
  --project .\SurveyManagement.Persistence `
  --startup-project .\SurveyManagement.API
```

### Run the API

```powershell
dotnet run --project .\SurveyManagement.API
```

Swagger UI:

```text
https://localhost:7143/swagger
```

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

The API base URL is configured in `frontend/.env.development`:

```env
VITE_API_BASE_URL=https://localhost:7143/api
```

## Frontend Build and Lint

```powershell
cd frontend
npm run build
npm run lint
```

## Git Workflow

The project follows the Git Flow strategy.

Main branches:

- `main`
- `develop`

Feature branch example:

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/admin-panel
```

Commit messages follow the Conventional Commits standard:

```text
feat(frontend): modernize survey management interface
fix(auth): resolve authentication context conflict
refactor(forms): improve form builder layout
docs: update project documentation
```

## Sprint Roadmap

### Sprint 1 — Architecture and Database Infrastructure

Status: Completed

- Layered architecture setup
- Entity modeling
- PostgreSQL integration
- Fluent API relationships
- Data seeding
- EF Core migration structure

### Sprint 2 — Authentication and Authorization

Status: Completed

- User registration and login
- Password hashing and salting
- JWT token generation
- Swagger Bearer authentication
- Global exception middleware
- Standard API response model

### Sprint 3 — Survey Domain and Form Management

Status: Completed

- Survey creation
- Dynamic question types
- Question options
- Question validation rules
- Draft update workflow
- Survey publishing and closing
- Survey detail endpoint

### Sprint 4 — Survey Responses

Status: Completed

- Response submission
- Date responses
- Rating responses
- Matrix and checkbox matrix responses
- Respondent identity tracking
- IP address and submission time tracking
- Response viewing endpoint

### Sprint 5 — Frontend and Administration

Status: Core features completed

- React frontend
- Survey builder
- Survey listing
- Draft survey editing
- Response viewer
- Admin panel
- Unit-based role management
- Turkish and responsive user interface

### Sprint 6 — AI Assistance and Deployment

Status: Planned

- Gemini API integration
- AI-assisted survey draft generation
- Clarifying questions for incomplete survey descriptions
- Docker configuration
- Automated tests
- CI/CD pipeline
- Production deployment configuration