# RegXperience Backend

NestJS backend for the RegXperience compliance assessment platform.

## Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Framework | NestJS                             |
| Database  | PostgreSQL + Prisma ORM            |
| Auth      | Google OAuth 2.0 + JWT             |
| Queue     | BullMQ + Redis                     |
| AI        | OpenAI GPT-4o (Structured Outputs) |
| Realtime  | Pusher                             |
| Docs      | Swagger                            |

## Prerequisites

- Node.js >= 18
- PostgreSQL running locally or remote
- Redis running locally or remote
- Google OAuth credentials
- OpenAI API key
- Pusher account

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Setup database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Start development server

```bash
npm run start:dev
```

Server runs at: http://localhost:3001  
Swagger docs at: http://localhost:3001/docs

## API Endpoints

### Auth

| Method | Path                  | Access   | Description                 |
| ------ | --------------------- | -------- | --------------------------- |
| GET    | /auth/google          | Public   | Initiate Google login       |
| GET    | /auth/google/callback | Public   | OAuth callback, returns JWT |
| GET    | /auth/me              | Any auth | Get current user            |

### Templates

| Method | Path              | Access   | Description                             |
| ------ | ----------------- | -------- | --------------------------------------- |
| POST   | /templates/upload | ADMIN    | Upload PDF, triggers AI processing      |
| GET    | /templates        | Any auth | List all templates                      |
| GET    | /templates/:id    | Any auth | Template with categories & requirements |

### Assessments

| Method | Path             | Access | Description                    |
| ------ | ---------------- | ------ | ------------------------------ |
| POST   | /assessments     | USER   | Start assessment from template |
| GET    | /assessments     | USER   | List my assessments            |
| GET    | /assessments/:id | USER   | Assessment details             |

### Submissions

| Method | Path                    | Access | Description                            |
| ------ | ----------------------- | ------ | -------------------------------------- |
| PUT    | /submissions            | USER   | Save/update a submission               |
| PUT    | /submissions/:id/review | ADMIN  | Review submission (COMPLIANT/REJECTED) |

## Pusher Events

| Channel       | Event           | Payload                                                      | Trigger               |
| ------------- | --------------- | ------------------------------------------------------------ | --------------------- |
| admin-channel | TEMPLATE_READY  | `{ templateId, status, categoriesCount, requirementsCount }` | AI processing success |
| admin-channel | TEMPLATE_FAILED | `{ templateId, error }`                                      | AI processing failure |

## Making a User Admin

Via Prisma Studio or direct SQL:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@yourdomain.com';
```
