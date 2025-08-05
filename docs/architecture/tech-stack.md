# Technology Stack - DEFINITIVE Technology Selections

This is the **SINGLE SOURCE OF TRUTH** for all technology choices. All other docs and AI agents must reference these exact selections.

## Cloud Infrastructure

- **Provider:** Google Cloud Platform (GCP)
- **Key Services:** Firebase Functions, Cloud Storage, Firestore, Cloud Tasks, Socket.io
- **Deployment Regions:** australia-southeast1 (primary), australia-southeast2 (DR)

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Language** | TypeScript | 5.3.3 | Primary development language | Strong typing, excellent tooling, existing codebase |
| **Runtime** | Node.js | 20.11.0 | JavaScript runtime | LTS version, Firebase Functions compatibility, unified language stack |
| **Frontend Framework** | Next.js | 14.2+ | React-based web framework | SSR/SSG capabilities, Vercel optimization, existing implementation |
| **Backend Framework** | Firebase Functions | Latest | Serverless compute platform | GCP integration, Australian data residency, existing architecture |
| **Database** | Cloud Firestore | Latest | NoSQL real-time database | Real-time updates, Australian hosting, existing data models |
| **File Storage** | Cloud Storage | Latest | Object storage service | Large file handling, Australian compliance, existing implementation |
| **State Management** | Zustand | 4.5+ | Frontend state management | Lightweight, TypeScript support, existing stores |
| **UI Components** | shadcn/ui | Latest | Component library | Tailwind-based, accessibility, existing components |
| **CSS Framework** | Tailwind CSS | 3.4+ | Utility-first CSS | Rapid development, existing styles, design system |
| **Task Queue** | Cloud Tasks | Latest | Job orchestration | Long-running AI workflows, reliability, existing implementation |
| **Real-time** | Socket.io | 4.7+ | WebSocket communication | Progress updates, existing WebSocket handler |
| **PDF Processing** | pdf2json | 3.2+ | Table extraction library | JavaScript PDF to JSON with table extraction, unified language stack |
| **AI Providers** | Multiple | Latest APIs | Multi-tier model access | Cost optimization, redundancy, existing integrations |
| **Hosting** | Vercel | Latest | Frontend deployment | Next.js optimization, edge functions, existing deployment |
| **Package Manager** | pnpm | 8.15+ | Fast package management | Existing lock files, workspace support |
| **Validation** | Zod | 3.22+ | Schema validation | TypeScript integration, existing usage |

## AI Model Stack (Multi-Provider)

| Provider | Mini Model | Regular Model | Deep Model | Purpose |
|----------|------------|---------------|------------|---------|
| **OpenAI** | GPT-4o-mini | GPT-4o | o1 | Primary provider, reasoning models |
| **Claude** | Claude 3.5 Haiku | Claude 3.5 Sonnet | Claude 3 Opus | High-quality text generation |
| **Gemini** | Gemini 1.5 Flash | Gemini 1.5 Pro | Gemini 2.0 Flash Thinking | Google integration, cost optimization |
| **DeepSeek** | DeepSeek-R1-Lite | DeepSeek-V3 | DeepSeek-R1 | Cost-effective, reasoning capabilities |

## Development Tools

| Category | Tool | Version | Purpose |
|----------|------|---------|---------|
| **Linting** | ESLint | 8.57+ | Code quality enforcement |
| **Formatting** | Prettier | 3.2+ | Code formatting |
| **Testing** | Jest | 29+ | Unit testing framework |
| **E2E Testing** | Playwright | 1.40+ | End-to-end testing |
| **Type Checking** | TypeScript | 5.3.3 | Static type checking |
| **Build Tool** | Next.js | 14.2+ | Build and bundling |
| **CI/CD** | GitHub Actions | Latest | Continuous integration |
| **Monitoring** | Firebase Analytics | Latest | Application monitoring |

## Australian Compliance Configuration

All services must be configured for Australian data residency:

- **Firebase Project Region:** australia-southeast1
- **Cloud Functions Region:** australia-southeast1  
- **Firestore Region:** australia-southeast1
- **Cloud Storage Region:** australia-southeast1
- **Backup Region:** australia-southeast2 (disaster recovery)

## CRITICAL IMPORTANCE

These choices directly control:
- All AI agent development decisions
- Infrastructure deployment configurations  
- Component library and styling standards
- Security and compliance implementations
- Cost optimization strategies

## Trade-offs Made

- **Multi-provider AI approach** adds complexity but provides redundancy and cost optimization
- **Serverless-first** sacrifices some performance predictability for cost efficiency and scaling
- **TypeScript throughout** adds build complexity but improves maintainability
- **Australian region constraints** limit global performance but ensure regulatory compliance

## Version Management

- **Pin specific versions** for production dependencies
- **Allow patch updates** for security fixes
- **Review minor updates** monthly in development
- **Test major updates** thoroughly before adoption

## AI Provider Configuration

### Authentication
- All API keys stored in Google Secret Manager
- Regional key storage in australia-southeast1
- Automatic key rotation policies

### Rate Limiting
- Provider-specific rate limit monitoring
- Intelligent routing to avoid limits
- Circuit breaker patterns for failures

### Cost Monitoring
- Real-time cost tracking per provider
- Daily and monthly budget alerts
- Per-section cost analysis for optimization

## Dependencies Security

- **Dependabot** enabled for automated security updates
- **Weekly security scans** in CI pipeline
- **Approved dependency list** for new additions
- **License compliance** verification for all packages

This technology stack is optimized for:
- ✅ Multi-tier AI cost optimization
- ✅ Australian data residency compliance
- ✅ Real-time user experience
- ✅ AI agent development efficiency
- ✅ Production scalability and reliability