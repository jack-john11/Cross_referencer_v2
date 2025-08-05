# Source Tree - Project Organization Structure

This document defines the monorepo organization structure that supports multi-tier AI processing, real-time communication, and clear separation of concerns.

## Project Structure

```plaintext
ecologen-monorepo/
├── apps/
│   ├── web/                           # Next.js Frontend Application
│   │   ├── app/                       # Next.js 14+ App Router
│   │   │   ├── (authenticated)/       # Protected routes group
│   │   │   │   ├── dashboard/         # Project dashboard
│   │   │   │   ├── projects/          # Project management
│   │   │   │   │   └── [id]/          # Dynamic project routes
│   │   │   │   │       ├── files/     # File management
│   │   │   │   │       ├── report/    # Report viewing/editing
│   │   │   │   │       └── progress/  # Generation progress
│   │   │   │   └── admin/             # Admin dashboard
│   │   │   ├── (public)/              # Public routes group
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── api/                   # Next.js API routes (proxy to Firebase)
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/                # UI Components
│   │   │   ├── ui/                    # shadcn/ui base components
│   │   │   ├── features/              # Feature-specific components
│   │   │   │   ├── file-upload/       # File dropzone, progress
│   │   │   │   ├── ai-interaction/    # Question callouts, responses
│   │   │   │   ├── report-viewer/     # Report display, editing
│   │   │   │   ├── progress-monitor/  # Real-time progress tracking
│   │   │   │   └── admin-dashboard/   # Admin analytics, cost tracking
│   │   │   ├── layout/                # Header, navigation, theme
│   │   │   └── providers/             # Context providers, wrappers
│   │   ├── lib/                       # Frontend utilities
│   │   │   ├── stores/                # Zustand state management
│   │   │   │   ├── file-management.ts
│   │   │   │   ├── report-generation.ts
│   │   │   │   ├── ai-interaction.ts
│   │   │   │   └── admin-analytics.ts
│   │   │   ├── services/              # API client services
│   │   │   │   ├── firebase-client.ts
│   │   │   │   ├── websocket-service.ts
│   │   │   │   ├── file-upload.ts
│   │   │   │   └── ai-service.ts
│   │   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── utils/                 # Utility functions
│   │   │   └── types/                 # TypeScript type definitions
│   │   ├── styles/                    # Global styles, Tailwind config
│   │   ├── public/                    # Static assets
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── admin/                         # Separate Admin Application (Future)
│       └── package.json
│
├── functions/                         # Firebase Cloud Functions
│   ├── src/
│   │   ├── api/                       # HTTP endpoint handlers
│   │   │   ├── projects/              # Project management endpoints
│   │   │   ├── files/                 # File upload/processing endpoints
│   │   │   ├── generation/            # AI generation endpoints
│   │   │   └── admin/                 # Admin analytics endpoints
│   │   ├── services/                  # Core business logic
│   │   │   ├── file-processing/       # PDF extraction pipeline
│   │   │   │   ├── document-classifier.ts
│   │   │   │   ├── extractors/
│   │   │   │   │   ├── nvr-extractor.py
│   │   │   │   │   ├── pmr-extractor.py
│   │   │   │   │   ├── bvd-extractor.py
│   │   │   │   │   └── generic-extractor.py
│   │   │   │   └── validation-service.ts
│   │   │   ├── ai-orchestration/      # Multi-tier AI system
│   │   │   │   ├── model-selector.ts
│   │   │   │   ├── providers/
│   │   │   │   │   ├── openai-provider.ts
│   │   │   │   │   ├── claude-provider.ts
│   │   │   │   │   ├── gemini-provider.ts
│   │   │   │   │   └── deepseek-provider.ts
│   │   │   │   ├── generation-engine.ts
│   │   │   │   ├── cost-tracker.ts
│   │   │   │   └── fallback-handler.ts
│   │   │   ├── real-time/             # WebSocket communication
│   │   │   │   ├── websocket-handler.ts
│   │   │   │   ├── progress-broadcaster.ts
│   │   │   │   └── question-dispatcher.ts
│   │   │   ├── data-management/       # Firestore operations
│   │   │   │   ├── project-service.ts
│   │   │   │   ├── extraction-service.ts
│   │   │   │   ├── generation-service.ts
│   │   │   │   └── analytics-service.ts
│   │   │   └── compliance/            # Australian data residency
│   │   │       ├── data-redaction.ts
│   │   │       ├── audit-logger.ts
│   │   │       └── region-validator.ts
│   │   ├── queue/                     # Cloud Tasks handlers
│   │   │   ├── file-processing-queue.ts
│   │   │   ├── generation-queue.ts
│   │   │   └── cleanup-queue.ts
│   │   ├── triggers/                  # Firestore/Storage triggers
│   │   │   ├── project-triggers.ts
│   │   │   ├── file-upload-triggers.ts
│   │   │   └── generation-triggers.ts
│   │   ├── utils/                     # Shared utilities
│   │   │   ├── logger.ts
│   │   │   ├── error-handler.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   └── index.ts                   # Function exports
│   ├── scripts/                       # PDF processing utilities
│   │   ├── extract_pdf_tables.js     # JavaScript table extraction
│   │   └── test_extraction.js        # JavaScript extraction tests
│   ├── lib/                          # Compiled JavaScript
│   ├── package.json
│   └── tsconfig.json
│
├── packages/                         # Shared packages
│   ├── shared-types/                 # TypeScript definitions
│   │   ├── src/
│   │   │   ├── api/                  # API request/response types
│   │   │   ├── database/             # Firestore document types
│   │   │   ├── ai/                   # AI model and generation types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── firebase-config/              # Firebase configuration
│   │   ├── src/
│   │   │   ├── client-config.ts      # Frontend Firebase config
│   │   │   ├── admin-config.ts       # Backend Firebase admin
│   │   │   └── regions.ts            # Australian region settings
│   │   └── package.json
│   │
│   └── ui-components/                # Shared UI components (Future)
│       ├── src/
│       └── package.json
│
├── docs/                             # Documentation
│   ├── architecture/                 # Architecture documents
│   │   ├── coding-standards.md       # AI agent development standards
│   │   ├── tech-stack.md            # Technology decisions
│   │   ├── source-tree.md           # This document
│   │   └── api-documentation.md     # API reference
│   ├── development/                  # Development guides
│   │   ├── setup-guide.md
│   │   ├── testing-guide.md
│   │   └── deployment-guide.md
│   ├── user-guides/                  # End-user documentation
│   └── compliance/                   # Australian compliance docs
│       ├── data-residency.md
│       └── security-requirements.md
│
├── infrastructure/                   # Infrastructure as Code
│   ├── terraform/                    # Terraform configurations
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── modules/
│   │   └── shared/
│   ├── firebase/                     # Firebase configuration
│   │   ├── firestore.rules
│   │   ├── storage.rules
│   │   ├── firestore.indexes.json
│   │   └── firebase.json
│   └── monitoring/                   # Monitoring and alerting
│       ├── cloud-monitoring.yaml
│       └── error-reporting.yaml
│
├── scripts/                          # Repository management
│   ├── setup.sh                     # Initial setup script
│   ├── deploy.sh                    # Deployment script
│   ├── test.sh                      # Test runner
│   └── cost-analysis.sh             # Cost reporting
│
├── .github/                          # GitHub Actions CI/CD
│   ├── workflows/
│   │   ├── deploy-functions.yml     # Firebase Functions deployment
│   │   ├── deploy-web.yml           # Vercel deployment
│   │   ├── test.yml                 # Automated testing
│   │   └── security-scan.yml        # Security scanning
│   └── dependabot.yml
│
├── .bmad-core/                       # BMad agent system
│   ├── agents/                       # Agent definitions
│   ├── tasks/                        # Workflow tasks
│   ├── templates/                    # Document templates
│   └── data/                        # Reference data
│
├── pnpm-workspace.yaml              # PNPM workspace configuration
├── package.json                     # Root package.json
├── tsconfig.json                    # Root TypeScript config
├── .gitignore
├── .env.example                     # Environment variables template
└── README.md
```

## Design Principles

### Monorepo Organization
- **apps/** - Separate applications (web frontend, future admin app)
- **packages/** - Shared code and configurations
- **functions/** - Firebase Cloud Functions with clear service separation

### Component Separation
- **Feature-based components** - Each major feature has its own component directory
- **Service layer separation** - AI, file processing, real-time communication as distinct services
- **Shared types package** - Single source of truth for TypeScript definitions

### Serverless Architecture Support
- **functions/src/services/** - Business logic organized by domain
- **functions/src/api/** - HTTP endpoint handlers
- **functions/src/queue/** - Cloud Tasks processing handlers

## Key Directories Explained

### `/apps/web/components/features/`
Each feature directory contains:
- Component implementation files
- Feature-specific hooks
- Local types and interfaces
- Feature tests

### `/functions/src/services/`
- **file-processing/** - PDF extraction and document classification
- **ai-orchestration/** - Multi-tier AI model management
- **real-time/** - WebSocket and progress broadcasting
- **data-management/** - Firestore operations and validation
- **compliance/** - Australian data residency and audit logging

### `/packages/shared-types/`
- **api/** - Request/response interfaces
- **database/** - Firestore document schemas
- **ai/** - AI model and generation types

## File Naming Conventions

### Frontend Components
- **Components:** `kebab-case.tsx` (e.g., `ai-interaction-callout.tsx`)
- **Hooks:** `use-feature-name.ts` (e.g., `use-report-generation.ts`)
- **Stores:** `featureStore.ts` (e.g., `reportGenerationStore.ts`)

### Backend Services
- **Services:** `kebab-case.ts` (e.g., `document-classifier.ts`)
- **Providers:** `provider-tier.ts` (e.g., `openai-regular-service.ts`)
- **Functions:** `camelCase` exports (e.g., `aiGenerateSection`)

### Configuration Files
- **Environment:** `.env.local`, `.env.production`
- **Config:** `*.config.ts` for TypeScript configs
- **JSON:** `*.json` for Firebase and package configs

## Import Patterns

### Absolute Imports (Frontend)
```typescript
// Correct import patterns
import { Button } from '@/components/ui/button'
import { useReportGeneration } from '@/lib/stores/report-generation'
import { AIQuestion } from '@/lib/types/ai-types'
```

### Relative Imports (Backend)
```typescript
// Services import from relative paths
import { DocumentClassifier } from '../file-processing/document-classifier'
import { OpenAIProvider } from './providers/openai-provider'
```

## Development Workflow

### Local Development
1. Root package.json manages workspace
2. PNPM handles all package installations
3. Firebase emulators for backend testing
4. Next.js dev server for frontend

### Testing Organization
- **Unit tests:** Co-located with source files
- **Integration tests:** `/tests/integration/`
- **E2E tests:** `/tests/e2e/`

### Build Process
- **Frontend:** Next.js builds to `.next/`
- **Backend:** TypeScript compiles to `functions/lib/`
- **Types:** Shared types package builds to `dist/`

## Australian Compliance Considerations

### Data Organization
- All user data handling in `/functions/src/compliance/`
- Region-specific configurations in `/packages/firebase-config/`
- Audit logging centralized in compliance services

### Deployment Structure
- Production environments use australia-southeast1
- Development can use local emulators
- Staging mirrors production region setup

This source tree structure supports:
- ✅ **Multi-tier AI orchestration** with clear service boundaries
- ✅ **Real-time communication** with dedicated WebSocket services
- ✅ **Australian compliance** with centralized data handling
- ✅ **AI agent development** with predictable file organization
- ✅ **Scalable monorepo** with efficient package management