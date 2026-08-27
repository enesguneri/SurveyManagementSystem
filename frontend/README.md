# 🎓 İzmir Bakırçay University Survey Management System — Frontend

The frontend application of the İzmir Bakırçay University Survey Management System.

This application provides a modern and responsive interface for:

- 🔐 Authentication
- 📝 Survey creation and editing
- 📊 Survey response management
- 🏢 Unit-based authorization
- 🤖 Gemini AI-assisted survey generation
- 📥 Option importing
- 📤 CSV and Excel response export

## 🛠️ Technology Stack

- React
- TypeScript
- Vite
- Material UI
- Material UI Icons
- Axios
- React Router
- Papa Parse
- Vitest
- ESLint

## 📦 Installation

From the `frontend` directory, install the dependencies:

```powershell
npm install
```

## ⚙️ Environment Configuration

Configure the backend API address in:

```text
.env.development
```

Example:

```env
VITE_API_BASE_URL=https://localhost:7143/api
```

> Do not commit private API keys or sensitive environment variables.

## ▶️ Development Server

Start the frontend development server:

```powershell
npm run dev
```

The application runs on:

```text
http://localhost:5173
```

## 🏗️ Production Build

Create a production build:

```powershell
npm run build
```

The generated files are placed in:

```text
dist/
```

## 🧪 Testing

Run Vitest unit tests:

```powershell
npm test
```

The test suite covers:
- `optionImport.test.ts`: TXT, CSV (PapaParse), JSON array/object parsing, UTF-8 BOM stripping, and 500 options limit.
- `authStorage.test.ts`: LocalStorage token persistence, expiration checking (`isExpired`), and secure session clearing.

## 🧹 Linting

Run ESLint:

```powershell
npm run lint
```

Recommended checks before committing:

```powershell
npm run lint
npm test
npm run build
```

## 🧭 Application Routes

| Route | Description |
|---|---|
| `/` | Home page |
| `/login` | User login |
| `/register` | User registration |
| `/forms/new` | Create a new survey |
| `/forms` | Manageable surveys |
| `/forms/:publicId/edit` | Edit a draft survey |
| `/forms/:publicId` | View and complete a published survey |
| `/forms/:publicId/responses` | View survey responses |
| `/ai/survey` | Gemini AI-assisted survey creation |
| `/admin` | Administration panel |

## ✨ Main Capabilities

### 🔐 Authentication

- User registration
- User login
- JWT token storage
- Automatic authorization header
- Protected routes
- Automatic redirection for unauthenticated users
- Logout functionality

### 📝 Survey Builder

- Dynamic question creation
- Question reordering
- Required question settings
- Question descriptions
- Validation rules
- Draft saving
- Survey publishing
- Survey closing
- Anonymous or authenticated access selection
- Unit assignment
- Respondent identity visibility setting

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

### 📥 Option Import

Choice options can be imported from:

- TXT files
- CSV files
- JSON files
- External HTTPS APIs

The interface supports:

- Searchable dropdown options
- JSON path selection
- Text property selection
- Import preview
- Duplicate removal
- Import validation
- Error messages for invalid sources

### 📤 Response Export

Authorized users can export survey responses as:

- CSV
- Excel (`.xlsx`)

Export actions are available only to users who have permission to manage the related survey.

### 🤖 Gemini AI Assistant

The AI assistant allows users to create a survey draft from a natural language description.

Workflow:

1. The user enters a survey description.
2. Gemini generates a survey draft.
3. Gemini asks clarification questions when required.
4. The frontend displays the draft visually.
5. The user reviews and edits the draft.
6. The user transfers the draft to the survey builder.
7. The user manually saves the survey.

The generated survey is not automatically saved to the database.

### 👤 Response Submission

- Public survey response submission
- Authenticated survey response submission
- One-response-per-authenticated-user rule
- Submission success state
- Previously submitted survey state
- Respondent identity visibility warning
- Required question validation

## 🎨 UI and Design System

The application uses Material UI and follows a shared design system.

The interface includes:

- İzmir Bakırçay University branding
- University logo
- Turkish page titles
- Responsive layouts
- Shared color palette
- Shared typography
- Consistent buttons and form controls
- Card-based layouts
- Responsive mobile support
- Shared `BrandHeader` component
- Modern dashboard design
- Consistent loading and error states

## 📁 Source Directory Structure

```text
src/
├── api/
│   ├── adminApi.ts       # Admin API requests
│   ├── aiApi.ts          # Gemini AI API requests
│   ├── apiClient.ts      # Shared Axios client
│   ├── authApi.ts        # Authentication requests
│   ├── formApi.ts        # Survey API requests
│   ├── optionApi.ts      # Option import requests
│   └── roleApi.ts        # Role and unit requests
│
├── assets/
│   └── ...               # Frontend assets
│
├── auth/
│   ├── AuthContext.tsx   # Authentication state
│   ├── ProtectedRoute.tsx
│   └── useAuth.ts
│
├── components/
│   ├── layout/
│   └── ...               # Reusable UI components
│
├── pages/
│   ├── AdminPanelPage.tsx
│   ├── AiSurveyAssistantPage.tsx
│   ├── DashboardPage.tsx
│   ├── FormBuilderPage.tsx
│   ├── FormResponsesPage.tsx
│   ├── LoginPage.tsx
│   ├── ManageableFormsPage.tsx
│   ├── PublishedFormPage.tsx
│   └── RegisterPage.tsx
│
├── types/
│   ├── ai.ts
│   ├── api.ts
│   ├── formApi.ts
│   └── ...
│
├── theme.ts              # Material UI theme
├── index.css             # Global styles
├── App.tsx               # Application routing
└── main.tsx              # Application entry point
```

## 🔌 API Communication

API communication is handled through Axios.

The shared API client:

- Reads the base URL from an environment variable
- Automatically adds the JWT token
- Applies request timeouts
- Handles unauthorized responses
- Provides a shared configuration for API modules

Example:

```env
VITE_API_BASE_URL=https://localhost:7143/api
```

Feature-based API modules include:

- `authApi.ts`
- `adminApi.ts`
- `aiApi.ts`
- `formApi.ts`
- `optionApi.ts`
- `roleApi.ts`

## 🔑 Authentication Flow

1. The user registers or logs in.
2. The API returns a JWT access token.
3. The token is stored in the browser.
4. Authenticated requests automatically include the token.
5. Protected routes verify authentication state.
6. Unauthenticated users are redirected to `/login`.
7. The user can log out from the shared header.

## 📝 Survey Management Flow

1. The user opens the home page.
2. The user creates a new survey.
3. The user selects the access type.
4. The user optionally assigns organizational units.
5. Dynamic questions are added.
6. Question validation rules are configured.
7. The survey is saved as a draft.
8. The survey is published.
9. Respondents complete the survey.
10. Authorized users view the responses.
11. Authorized users export responses as CSV or Excel.

## 🔒 Frontend Security Practices

- JWT tokens are automatically added to protected requests.
- Protected pages use route guards.
- Sensitive API keys are not stored in frontend source files.
- `.env` files are excluded from version control.
- Form access is validated by the backend.
- Export buttons are displayed according to authorization.
- Respondent identity visibility follows the survey settings.
- API errors are displayed with user-friendly messages.

## 🌿 Git Workflow

The project follows Git Flow.

Main branches:

- `main`
- `develop`

Feature branch example:

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/new-frontend-feature
```

### Conventional Commits

```text
feat(frontend): add survey builder
fix(forms): resolve draft loading issue
refactor(ui): improve dashboard layout
docs: update frontend documentation
chore(frontend): update dependencies
```

## 🧪 Recommended Checks Before Commit

```powershell
npm run lint
npm run build
git diff --check
```

## 📌 Project Status

Frontend features currently completed:

- Authentication pages
- Protected routing
- Dashboard
- Survey builder
- Survey editing
- Survey response page
- Response viewer
- Admin panel
- Unit-based authorization interface
- Dropdown option importing
- CSV and Excel export actions
- Gemini AI survey assistant
- Vitest automated unit tests
- Responsive university-themed design

Production deployment configuration is planned for a later stage.
