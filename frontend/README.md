# İzmir Bakırçay University Survey Management System — Frontend

This directory contains the React and TypeScript frontend application of the İzmir Bakırçay University Survey Management System.

## Technology Stack

- React
- TypeScript
- Vite
- Material UI
- Axios
- React Router
- ESLint

## Installation

From the `frontend` directory, install the dependencies:

```powershell
npm install
```

Configure the backend API address in `.env.development`:

```env
VITE_API_BASE_URL=https://localhost:7143/api
```

## Development Server

```powershell
npm run dev
```

The Vite development server runs on:

```text
http://localhost:5173
```

## Production Build

```powershell
npm run build
```

The production files are generated in the `dist/` directory.

## Linting

```powershell
npm run lint
```

## Application Routes

- `/login` — User login
- `/register` — User registration
- `/` — Home page
- `/forms/new` — Create a new survey
- `/forms` — Manageable surveys
- `/forms/:publicId/edit` — Edit a draft survey
- `/forms/:publicId` — View and complete a published survey
- `/forms/:publicId/responses` — View survey responses
- `/admin` — Administration panel

## UI and Design System

The application uses a shared visual language based on Material UI.

The design system includes:

- İzmir Bakırçay University branding
- University logo
- Turkish page titles
- Responsive layouts
- Shared color palette
- Shared button and form styles
- Card-based page layouts
- Responsive mobile support
- Common `BrandHeader` component

## Source Directory Structure

```text
src/
├── api/          # Backend API requests
├── auth/         # Authentication context, token storage, and route protection
├── components/   # Reusable UI and survey components
├── pages/        # Application pages
├── types/        # TypeScript type definitions
├── theme.ts      # Material UI theme configuration
└── index.css     # Global styles
```

## API Communication

API requests are handled through Axios.

The API client:

- Reads the base URL from an environment variable
- Automatically adds the JWT token to the `Authorization` header
- Applies a request timeout
- Provides a shared HTTP client for API modules

Example configuration:

```env
VITE_API_BASE_URL=https://localhost:7143/api
```

## Authentication Flow

1. The user registers or logs in.
2. The API returns a JWT access token.
3. The token is stored locally.
4. Authenticated requests automatically include the token.
5. Protected routes redirect unauthenticated users to the login page.

## Survey Management Flow

1. The user opens the home page.
2. The user creates a new survey.
3. The access type and organizational units are selected.
4. Dynamic questions are added.
5. The survey is saved as a draft.
6. The survey is published.
7. Respondents complete the survey.
8. Authorized users view the responses.

## Recommended Checks Before Commit

```powershell
npm run lint
npm run build
```