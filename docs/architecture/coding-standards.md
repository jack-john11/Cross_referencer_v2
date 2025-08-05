# Coding Standards - MANDATORY AI Agent Guidelines

These standards directly control AI developer behavior and are **CRITICAL** for maintaining code quality and preventing common AI development mistakes. These rules are minimal and focused on project-specific requirements only.

## Core Standards

- **Languages & Runtimes:** TypeScript 5.3.3+ for all frontend/backend processing (unified language stack)
- **Style & Linting:** ESLint + Prettier with aggressive formatting, no-console rules in production code
- **Test Organization:** `*.test.ts` files co-located with source, `__tests__/` for complex test suites

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| **AI Service Files** | `{provider}-{tier}-service.ts` | `openai-regular-service.ts` |
| **Firestore Collections** | lowercase with underscores | `extraction_results`, `ai_questions` |
| **Component Files** | kebab-case with feature prefix | `ai-interaction-callout.tsx` |
| **Zustand Stores** | descriptive domain + Store suffix | `reportGenerationStore.ts` |
| **Cloud Functions** | camelCase with domain prefix | `aiGenerateSection`, `fileProcessPDF` |

## Critical Rules

⚠️ **These rules prevent AI development mistakes that could break the system:**

- **Never use console.log in production code** - Always use the structured logger with correlation IDs
- **All AI API calls must use the provider abstraction layer** - Never call OpenAI/Claude APIs directly
- **Database writes must include correlationId field** - Required for debugging and Australian audit compliance
- **All async operations must have timeout handling** - Use AbortController or Promise.race with timeouts
- **File uploads must validate file type and size** - Use Zod schemas, never trust client-side validation
- **WebSocket messages must include timestamp and correlationId** - Required for real-time debugging
- **AI model responses must be validated before storage** - Use response validation schemas, never store raw API responses
- **Error messages must not expose internal system details** - Use .toUserMessage() methods for user-facing errors
- **All Firestore queries must specify region** - Enforce australia-southeast1 for compliance
- **Cost tracking is mandatory for all AI operations** - Every model call must log tokens and cost

## Language-Specific Guidelines

### TypeScript Specifics

- **Strict mode enforcement** - `noImplicitAny: true`, `strictNullChecks: true`, no `any` types allowed
- **Import organization** - External libraries first, then internal modules, then relative imports
- **Type definitions** - All AI model responses must have explicit interfaces in shared-types package
- **Error handling** - Use custom error classes with correlation IDs, never throw strings
- **Async patterns** - Always use async/await, never mix with .then() chains

### React/Next.js Specifics

- **Component organization** - All components must export types for props, use forwardRef for DOM components
- **State management** - Use Zustand stores for global state, useState for component-local state only
- **WebSocket integration** - Components must handle connection states (connecting, connected, disconnected, error)
- **Real-time data** - Use Firestore real-time listeners through Zustand stores, not direct useEffect subscriptions
- **Route protection** - All authenticated routes must use middleware, not component-level auth checks

### Firebase Functions Specifics

- **Region specification** - All functions must explicitly set region to australia-southeast1
- **Error propagation** - Use structured error responses with correlation IDs, never throw raw errors to client
- **Timeout management** - Set explicit timeouts for all functions (max 540s for AI generation, 60s for others)
- **Memory allocation** - AI functions use 2GB memory, file processing 1GB, API endpoints 512MB
- **Cold start optimization** - Initialize providers outside function handlers, use global variables for reuse

## Project-Specific Patterns

```typescript
// MANDATORY: AI Provider Usage Pattern
// ✅ CORRECT - Use abstraction layer
const result = await aiOrchestrator.generateSection(section, {
  modelTier: 'regular',
  correlationId: req.correlationId,
  timeout: 30000
})

// ❌ WRONG - Direct API calls
const result = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...]
})

// MANDATORY: Database Write Pattern
// ✅ CORRECT - Include audit fields
await projectRef.update({
  status: 'completed',
  updatedAt: admin.firestore.Timestamp.now(),
  correlationId: req.correlationId,
  auditTrail: {
    action: 'generation_complete',
    userId: req.auth.uid,
    timestamp: admin.firestore.Timestamp.now()
  }
})

// ❌ WRONG - Missing correlation/audit data
await projectRef.update({ status: 'completed' })

// MANDATORY: Error Handling Pattern
// ✅ CORRECT - Structured errors with user messages
if (!extractedData.isValid) {
  throw new EcologicalValidationError(
    'species_data',
    extractedData.raw,
    'valid species scientific name',
    req.correlationId
  )
}

// ❌ WRONG - Generic errors
if (!extractedData.isValid) {
  throw new Error('Invalid data')
}
```

## Why These Standards Are Critical

1. **AI agents often ignore logging requirements** - The structured logger rule prevents debugging nightmares
2. **AI loves to call APIs directly** - The abstraction layer rule maintains cost control and fallback capability
3. **AI forgets correlation IDs** - Required for debugging distributed AI workflows across multiple providers
4. **AI doesn't understand compliance** - The region specification rules ensure Australian data residency
5. **AI skips error handling** - The timeout and validation rules prevent hanging operations and security issues

## Standards Validation

- ESLint rules will enforce syntax requirements automatically
- Code reviews will focus on correlation ID usage and error handling patterns
- Automated tests will validate AI provider abstraction usage
- These standards are specifically optimized for AI agent development to prevent common mistakes

## What's NOT Included (Deliberately)

- General TypeScript best practices (AI already knows these)
- Basic React patterns (assumed knowledge)
- Generic clean code principles (would bloat context)
- Obvious security practices (focus on project-specific risks)