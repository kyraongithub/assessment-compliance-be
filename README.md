# RegXperience Backend - NestJS Application

A comprehensive backend service for compliance and GRC (Governance, Risk, and Compliance) management built with NestJS.

## 🎯 Overview

RegXperience is a compliance management platform that helps organizations manage technology risk assessments and regulatory compliance requirements. This backend provides:

- **PDF Template Processing**: Upload and parse compliance documents using AI
- **Structured Assessment Management**: Create and manage compliance assessments
- **Real-time Notifications**: Live updates via Pusher for template processing status
- **Role-Based Access Control**: Admin and User roles with different permissions
- **Secure Authentication**: JWT-based authentication
- **Queue-Based Processing**: BullMQ for async PDF processing

## 🛠️ Tech Stack

- **NestJS** - Progressive Node.js framework
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Cache and queue management
- **BullMQ** - Job queue system
- **OpenAI** - AI-powered requirement extraction
- **Pusher** - Real-time communication
- **JWT** - Secure authentication
- **Passport.js** - Authentication strategies

## 📋 Prerequisites

- Node.js >= 18
- PostgreSQL database
- Redis server
- OpenAI API key
- Pusher account (for real-time features)

## 🚀 Getting Started

### 1. Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate
```

### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# - DATABASE_URL: PostgreSQL connection string
# - REDIS_HOST, REDIS_PORT: Redis configuration
# - OPENAI_API_KEY: Your OpenAI API key
# - PUSHER_*: Pusher configuration
# - JWT_SECRET: Your JWT secret key
```

### 3. Database Setup

```bash
# Run Prisma migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 4. Start the Application

```bash
# Development mode with watch
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Authentication

- `POST /auth/google` - Login with Google
- `GET /auth/profile` - Get user profile (requires JWT)

### Templates (Admin Only)

- `POST /api/templates/upload` - Upload PDF template (202 Accepted)
- `GET /api/templates` - List all templates
- `GET /api/templates/available` - List available templates
- `GET /api/templates/:id` - Get template details
- `DELETE /api/templates/:id` - Delete template

### Assessments (Authenticated Users)

- `POST /api/assessments` - Create assessment
- `GET /api/assessments` - List user's assessments
- `GET /api/assessments/:id` - Get assessment details
- `POST /api/assessments/:id/submit` - Submit assessment
- `GET /api/assessments/:id/progress` - Get assessment progress

### Submissions (Authenticated Users)

- `POST /api/submissions/assessments/:assessmentId` - Save/update submission
- `GET /api/submissions/assessments/:assessmentId` - List submissions
- `GET /api/submissions/:id` - Get submission details
- `DELETE /api/submissions/:id` - Delete submission

### Review Submissions (Admin Only)

- `PUT /api/submissions/:id/review` - Review submission
- `GET /api/submissions?status=PENDING` - List submissions by status

## 🔄 Workflow

### 1. PDF Template Upload

```bash
POST /api/templates/upload
{
  "title": "MAS Technology Risk Management Guidelines",
  "pdfText": "...", # Full PDF text content
  "pdfUrl": "https://..." # Optional URL
}

# Response (202 Accepted)
{
  "templateId": "cuid123",
  "status": "PROCESSING",
  "jobId": "job-id"
}
```

### 2. AI Processing (Async via BullMQ)

- PDF text is extracted and sent to OpenAI
- Requirements are parsed from the document
- Categories and requirements are created in database
- Template status changes to `AVAILABLE`
- Pusher event triggers for real-time notification

### 3. Create Assessment

```bash
POST /api/assessments
{
  "templateId": "cuid123"
}
```

### 4. Submit Compliance Evidence

```bash
POST /api/submissions/assessments/:assessmentId
{
  "requirementId": "req-id",
  "implementationDetail": "Description of implementation...",
  "evidenceLink": "https://..."
}
```

### 5. Admin Review

```bash
PUT /api/submissions/:id/review
{
  "status": "COMPLIANT" # or REJECTED
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "USER" // or ADMIN
}
```

### Role-Based Access

- **USER**: Can create assessments, submit evidence, view own data
- **ADMIN**: Can upload templates, review submissions, manage users

## 📊 Database Schema

### Core Entities

- **User**: Registered users with role-based access
- **AssessmentTemplate**: Compliance document templates
- **Category**: Requirement categories within templates
- **Requirement**: Individual compliance requirements
- **Assessment**: User's compliance assessment instance
- **Submission**: Evidence/implementation details for requirements

### Relationships

```
User
├── Assessment
    ├── Template
    │   ├── Category
    │   │   └── Requirement
    │   │       └── Submission
    │   └── Assessment
```

## 🚀 Queue Processing

### BullMQ Configuration

- Queue Name: `pdf-processing-queue`
- Redis Connection: Configured via `REDIS_*` environment variables
- Job Retry: 3 attempts with exponential backoff
- Job Timeout: Default BullMQ timeout

### Job Payload

```typescript
{
  templateId: string;
  pdfText: string;
}
```

### Job Flow

1. Job added to queue
2. Worker processes PDF with AI
3. Categories and requirements created
4. Template status updated to AVAILABLE
5. Pusher event triggered
6. Job marked complete or failed

## 🔔 Real-time Events (Pusher)

### Channels

- `admin-channel`: Events for administrators
- `user-{userId}`: Personal user events

### Events

- `TEMPLATE_READY`: Template processing completed
- `TEMPLATE_FAILED`: Template processing failed
- `SUBMISSION_UPDATED`: Submission saved
- `SUBMISSION_REVIEWED`: Admin review decision

### Example Client Integration

```javascript
const pusher = new Pusher({
  key: 'your-pusher-key',
  cluster: 'your-cluster',
});

const channel = pusher.subscribe('admin-channel');
channel.bind('TEMPLATE_READY', (data) => {
  console.log('Template ready:', data.templateId);
});
```

## 🧠 AI Service (OpenAI Integration)

### Extraction Schema

The AI extracts requirements in this structure:

```json
{
  "title": "Document Title",
  "categories": [
    {
      "name": "Category Name",
      "requirements": [
        {
          "title": "Requirement Title",
          "description": "Detailed description"
        }
      ]
    }
  ]
}
```

### System Prompt

The AI acts as a GRC expert to:

- Identify regulatory requirements
- Organize into logical categories
- Extract clear requirement titles and descriptions
- Ensure compliance focus

## 📝 Error Handling

### Common Error Responses

- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test:cov

# Run e2e tests
npm run test:e2e
```

## 📦 Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application entry point
├── auth/                      # Authentication module
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── strategies/            # Passport strategies
│   ├── guards/                # JWT & Role guards
│   └── decorators/            # Custom decorators
├── template/                  # Template management
│   ├── template.service.ts
│   └── template.controller.ts
├── assessment/                # Assessment management
│   ├── assessment.service.ts
│   └── assessment.controller.ts
├── submission/                # Submission management
│   ├── submission.service.ts
│   └── submission.controller.ts
├── queue/                     # BullMQ queue processing
│   ├── pdf-queue.service.ts
│   └── pdf-processor.service.ts
├── ai/                        # OpenAI integration
│   ├── ai.service.ts
│   └── schemas/
├── prisma/                    # Database setup
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── pusher/                    # Real-time notifications
    ├── pusher.service.ts
    └── pusher.module.ts

prisma/
└── schema.prisma              # Database schema
```

## 🔧 Troubleshooting

### Issue: Database Connection Error

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL server is running
- Check network connectivity

### Issue: Redis Connection Error

- Verify Redis is running on `REDIS_HOST:REDIS_PORT`
- Check `REDIS_PASSWORD` if required

### Issue: OpenAI API Error

- Verify `OPENAI_API_KEY` is valid
- Check API key permissions
- Ensure sufficient API credits

### Issue: Queue Jobs Not Processing

- Verify Redis connection
- Check BullMQ worker logs
- Ensure no duplicate workers

## 📖 Documentation

For detailed API documentation, check the endpoint comments in controller files.

## 📄 License

This project is licensed under the UNLICENSED license.

## 🤝 Support

For issues and support, please check the application logs and error responses for detailed debugging information.

---

**Built with ❤️ for regulatory compliance management**
