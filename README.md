# 🎓 İzmir Bakırçay University Survey Management System

> İzmir Bakırçay Üniversitesi için geliştirilen modern, güvenli ve dinamik anket yönetim platformu.

[![CI Pipeline](https://github.com/enesguneri/SurveyManagementSystem/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/enesguneri/SurveyManagementSystem/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-140%20passed-brightgreen)](https://github.com/enesguneri/SurveyManagementSystem)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB)](https://react.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing-729B1B)](https://vitest.dev/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1)](https://www.mysql.com/)
[![Material UI](https://img.shields.io/badge/UI-Material%20UI-007FFF)](https://mui.com/)

## 📌 About the Project

The Survey Management System is a full-stack web application that enables authorized users to create, publish, manage, and analyze dynamic surveys.

The platform supports:

- 🔐 Secure authentication, role-based authorization, and protected Admin routes
- 📝 Dynamic survey creation and published survey editing
- 🏢 Unit-based access control
- 📊 Response management, pagination, deletion, and export
- 🤖 Gemini AI-assisted survey generation
- 📥 External option import
- 🎨 Modern and responsive user interface

## ✨ Features

### 🔐 Authentication and Authorization

- User registration and login
- JWT-based authentication with constant-time password verification
- Role-based authorization and frontend route guards (`AdminRoute`)
- Unit-based form authorization
- Admin panel (restricted to Admin users)
- Swagger JWT Bearer authentication

### 📝 Survey Management

- Dynamic survey creation
- Draft, published, and closed survey statuses
- Multiple organizational units per survey
- Anonymous or authenticated survey access
- One-response-per-user rule for authenticated surveys
- Published survey editing (full question editing when 0 responses, title/description editing when responses exist)
- Universal survey preview mode across all statuses (`Draft`, `Published`, `Closed`) for survey owners and administrators with non-persisting test submission validation
- One-click participant link copying directly from survey cards and the preview banner
- Survey reopening back to published state (`POST /api/forms/{publicId}/reopen`)
- Permanent survey deletion with cascading cleanup of questions, options, answers, and role assignments (`DELETE /api/forms/{publicId}`)
- Interactive confirmation dialogs (modals) before deleting questions, deleting surveys, closing, or reopening
- Dynamic option lazy loading (saving source metadata without database row bloating) and on-demand option persistence on response submission
- Card-level scrollable options container in question builder (`maxHeight: 320px`)
- Middle-click (scroll wheel) and Ctrl+Click new tab support across all navigation buttons using `RouterLink`

### 🏢 Unit and Role Management (Admin Panel)

- 2-Tab management interface: **Kullanıcılar** (Users) and **Birimler** (Organizational Units)
- Instant user search bar filtering by name, username, or email
- User role chips with one-click role removal confirmation modal
- Inline `+ Rol Ekle` popover menu for rapid role assignment
- Unit creation card with instant name validation
- Collapsible unit accordions with *"X Kullanıcı Tanımlı"* member badges
- Unit member table with "Birimden Çıkar" action
- Autocomplete unit member assignment
- Permanent unit role deletion (`DELETE /api/roles/{id}`) with safety guards protecting system roles and explicit confirmation modal

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

### 📈 Visual Charts and Analytics

- Google Forms-style interactive response analytics
- SVG Pie Charts for single choice and dropdown questions with slice percentage labels and legend
- Horizontal Bar Charts for multiple choice question distributions
- Rating score distributions with prominent average score indicators
- Matrix question row and column summary breakdowns
- Text response summary lists with clean scrolling view
- Two-tab response dashboard: **"Özet ve Grafikler"** (Summary & Charts) and **"Bireysel Yanıtlar"** (Individual Responses)
- One-click **"Grafiği kopyala"** (Copy Chart and summary statistics to clipboard) feature

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

- AI-assisted survey draft generation using Google Gemini
- Clarification questions for incomplete prompts
- User-specific Gemini API Key & model configuration (`gemini-3.5-flash-lite`, `gemini-3.5-flash`)
- Interactive configuration onboarding and masked key storage
- Visual draft preview and 1-click export to Form Builder
- Manual review before database registration (no automatic database save without user confirmation)

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
| Testing | xUnit, FluentAssertions, Moq, Vitest, WebApplicationFactory |
| CI/CD | GitHub Actions |
| Version Control | Git and GitHub |

## 🏗️ Project Architecture

The backend follows a layered architecture approach.

```text
SurveyManagementSystem/
├── .github/
│   └── workflows/
│       └── ci.yml
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
├── SurveyManagement.Tests/
│   ├── Common/
│   ├── Integration/
│   ├── Security/
│   ├── Services/
│   └── Validation/
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

- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js 20+ and npm](https://nodejs.org/)
- [MySQL Server 8+](https://www.mysql.com/)
- [Git](https://git-scm.com/)
- Entity Framework Core CLI

Install Entity Framework CLI globally:

```powershell
dotnet tool install --global dotnet-ef
```

### 📦 1. Clone & Restore Dependencies

```powershell
git clone https://github.com/enesguneri/SurveyManagementSystem.git
cd SurveyManagementSystem

dotnet restore .\SurveyManagementSystem.slnx
```

### 🗃️ 2. Database & User Secrets Configuration

#### A. Database Connection String
Update the MySQL connection string in `SurveyManagement.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=SurveyManagementDb;User=root;Password=YOUR_MYSQL_PASSWORD"
  }
}
```

#### B. Secret Keys Configuration (User Secrets)
For security, `JwtSettings:SecretKey` (minimum 64 bytes) and `Gemini:ApiKey` are managed outside source control via .NET User Secrets:

```powershell
# Initialize User Secrets
dotnet user-secrets init --project .\SurveyManagement.API

# Set JWT Secret Key (required - at least 64 bytes)
dotnet user-secrets set "JwtSettings:SecretKey" "YOUR_SUPER_SECRET_KEY_THAT_IS_AT_LEAST_64_BYTES_LONG_1234567890_SECURE" --project .\SurveyManagement.API

# Set Gemini AI API Key (optional fallback - users can also configure their personal key directly via the Web UI)
dotnet user-secrets set "Gemini:ApiKey" "YOUR_GEMINI_API_KEY" --project .\SurveyManagement.API
dotnet user-secrets set "Gemini:Model" "gemini-3.5-flash-lite" --project .\SurveyManagement.API
```

> ⚠️ Never commit real database passwords, JWT secrets, or Gemini API keys to GitHub.
> 💡 *Note: Users can also enter and manage their own Gemini API key directly from the AI Assistant web interface (`/ai-assistant`).*

### 🔄 3. Apply Database Migrations

Create the database schema and seed initial system roles (`Admin`, `User`):

```powershell
dotnet ef database update `
  --project .\SurveyManagement.Persistence `
  --startup-project .\SurveyManagement.API
```

### ▶️ 4. Run the API

```powershell
dotnet run --project .\SurveyManagement.API --launch-profile https
```

API will start and Swagger UI will be available at:
- **Swagger UI:** `https://localhost:7143/swagger`

---

## 💻 Frontend Setup

### 📦 1. Install Dependencies

```powershell
cd frontend
npm install
```

### ⚙️ 2. Environment Configuration

Verify API endpoint in `frontend/.env.development`:

```env
VITE_API_BASE_URL=https://localhost:7143/api
```

### ▶️ 3. Run Frontend Development Server

```powershell
npm run dev
```

The application will be accessible at:
- **Web UI:** `http://localhost:5173`

### 🏗️ 4. Build for Production

```powershell
cd frontend
npm run build
```

### 🧹 5. Code Linting

```powershell
cd frontend
npm run lint
```

---

## 🤖 Gemini AI Workflow

The application integrates Google's Gemini generative AI for conversational survey drafting:

1. **User-Specific API Key Configuration:**
   - Every authorized user can manage their personal Google Gemini API key directly from the `/ai-assistant` interface.
   - If a user has not configured a key, an onboarding banner guides them to Google AI Studio with a direct link (`https://aistudio.google.com/app/apikey`) to obtain a free key.
   - Users can select their preferred model: `gemini-3.5-flash-lite` (Recommended, fast) or `gemini-3.5-flash`.
   - Keys are stored securely in the database and masked (`AIzaSy...9X2A`) in the UI.

2. **Conversational Survey Generation:**
   - The user describes the target audience and survey goals in natural language.
   - If information is insufficient, Gemini responds with clarification questions (`NeedsClarification`).
   - Once all requirements are understood, Gemini generates a structured survey draft (`Ready`).

3. **Live Draft Preview & Transfer:**
   - The assistant displays an interactive visual preview of all questions, option choices, matrices, and validations.
   - With a single click ("Bu Taslağı Form Oluşturucuya Aktar"), the generated survey is loaded into the Form Builder for final customization, unit assignment, and publishing.

---

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
- Publishing, closing, and reopening
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
- 2-Tab Admin panel (Users & Units)
- Unit-based role management
- Responsive Turkish interface
- İzmir Bakırçay University branding

### Sprint 6 — AI, Import, Export, Testing, and CI/CD

**Status: Completed ✅**

- Gemini AI assistant
- Clarification questions
- Visual AI draft preview
- Dynamic external options (API & TXT) with validation
- Searchable dropdowns
- CSV & Excel response export
- Secure external API handling
- Automated test suite (93 Backend xUnit + 30 Frontend Vitest)
- GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)

### Sprint 7 — Advanced Form Lifecycle, 2-Tab Admin Suite, Dynamic Options, and UX Polish

**Status: Completed ✅**

- Closed survey preview mode with response submission lockdown
- Reopening closed surveys back to published state (`POST /api/forms/{publicId}/reopen`)
- Permanent survey deletion with full cascade cleanup (`DELETE /api/forms/{publicId}`)
- Interactive confirmation dialogs before deleting questions, deleting surveys, closing, or reopening
- Dynamic option lazy loading (saving source metadata to `Questions` table without pre-populating database rows)
- Choice verification against source on form response submission
- 2-Tab Admin Panel (instant user search, role chips with delete, inline `+ Rol Ekle` popover, unit creation, accordion list with member counts, add/remove members, and permanent unit role deletion)
- Card-level scrollable options container (`maxHeight: 320px`) in question builder
- Middle-click (scroll wheel) and Ctrl+Click new tab navigation across all buttons via `component={RouterLink}`
- Universal Preview Mode across all survey states (`Draft`, `Published`, `Closed`) with non-persisting test submission simulation
- One-click public survey link copying both on survey cards and in the preview banner
- User-specific Gemini API Key & model configuration associated with the user profile, setup prompt, configuration deletion, and masked key storage
- Idempotent Seed Data initialization (`DbInitializer.cs`) seeding İzmir Bakırçay University administrative and academic units automatically on application startup
- Automated test suite expanded to 140 tests (105 Backend + 35 Frontend, 100% passing)

## 🧪 Testing and CI/CD Pipeline

The project includes an automated test suite comprising **140 tests (100% passing)** across both backend and frontend.

### 🛡️ Backend Tests (105 tests)
- **Unit Tests (98):** Security, 9 question types request validation, response validation, dynamic API/TXT choice validation, on-demand option persistence, SSRF protection, form lifecycle (create, update, publish, close, reopen, delete, draft/closed preview), response identity masking, unit role authorization, CSV and Excel export, response deletion, user-specific Gemini AI configuration & deletion, and idempotent database seed initialization.
- **Integration Tests (7):** `WebApplicationFactory<Program>` testing end-to-end HTTP pipeline, authentication, and admin authorization filters.

Run backend tests:
```powershell
dotnet test SurveyManagementSystem.slnx
```

### ⚡ Frontend Tests (35 tests)
- **Vitest Suite:** TXT, CSV, JSON parsing, BOM cleanup, 500 option limit, token expiration, JWT decoding and role recognition, detailed error extraction, form draft API mapping, question analytics frequency/percentage calculations, and Google Forms-style Undo/Redo history reducer state management.

Run frontend tests:
```powershell
cd frontend
npm test
```

### 🤖 GitHub Actions CI/CD Pipeline
Every push and pull request to `main` or `develop` triggers `.github/workflows/ci.yml`:
1. **Backend CI:** Restores, builds, and runs all 105 backend tests on Ubuntu with .NET 10.
2. **Frontend CI:** Installs dependencies, runs ESLint, executes 35 Vitest tests, and generates the production bundle.

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
