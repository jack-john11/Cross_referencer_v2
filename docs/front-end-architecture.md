# EcoLogen Frontend Architecture

## Project Overview & Current State

Based on analysis of the EcoLogen project, this document defines the frontend architecture for an AI-powered ecological report generator with sophisticated user workflows and long-running processes.

**✅ Current Strengths:**
- Next.js 15.4.3 with App Router and TypeScript
- Shadcn UI component library with custom eco-tech theming
- Well-structured three-panel IDE layout
- Specialized components (FileDropzone, AIInteractionCallout, ProgressMonitor)
- Comprehensive UX specification completed

**🎯 Architecture Challenges to Address:**
- State management for long-running AI processes (5-20 minutes)
- File upload and processing workflows
- Real-time progress updates and AI interaction flows
- Component composition and data flow patterns
- Performance optimization for large file handling

## Component Architecture & Composition

### Architecture Layers

1. **Layout Components** - Header, three-panel layout system
2. **Feature Components** - FileDropzone, AIInteractionCallout, ProgressMonitor  
3. **UI Primitives** - Shadcn UI components with eco-tech theme
4. **State Management** - Zustand stores for global state
5. **Data Layer** - API clients and file processing utilities

### Key Architectural Decisions

- **Component Isolation**: Each specialized component manages its own internal state
- **Upward Data Flow**: Components communicate state changes through callback props
- **Global State Strategy**: Use Zustand for cross-component state (file uploads, generation progress)
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures

### Design Rationale

The three-panel layout creates natural boundaries for state management. The left panel (progress monitoring) needs to observe global generation state, the center panel (content) needs to display real-time updates, and the right panel (controls) needs to trigger state changes. This suggests a hub-and-spoke pattern with a central state store.

**Key Trade-offs Made:**
- Chose Zustand over Redux for simpler state management with complex async flows
- Prioritized component composition over complex prop drilling
- Emphasized TypeScript interfaces to prevent runtime errors during long processes
- Designed for progressive enhancement (basic upload → advanced AI features)

## State Management Architecture

### State Architecture Pattern: Domain-Driven State Stores

Separate Zustand stores organized by domain responsibility:

#### Core State Stores

**1. FileManagementStore**
- Manages all uploaded files (NVR, PMR, BVD, species data, shapefiles)
- Handles file validation, upload progress, and file metadata
- Provides file status tracking and error handling

**2. ReportGenerationStore** 
- Controls report generation lifecycle and progress tracking
- Manages section-level progress and overall generation status
- Handles AI model selection and generation parameters

**3. AIInteractionStore**
- Manages human-in-the-loop AI clarification flows
- Tracks pending questions, answers, and interaction history
- Handles real-time AI communication state

**4. UIStateStore**
- Controls panel visibility, accordion states, and UI preferences
- Manages responsive behavior and user interface persistence
- Handles theme switching and layout preferences

#### State Flow Pattern

```typescript
UI Action → Store Action → API Call → Store Update → Component Re-render
```

#### Key State Management Decisions

- **Domain Separation**: Each store owns a specific business domain to prevent state conflicts
- **Async State Handling**: Built-in support for loading/error/success states for all async operations
- **Persistence Strategy**: Critical state (files, generation progress) persisted to localStorage
- **Cross-Store Communication**: Stores can subscribe to each other for complex workflows

#### Design Rationale

The application has distinctly different state concerns that operate on different timescales. File uploads happen in seconds, AI generation takes 5-20 minutes, and UI interactions are immediate. Separating these into domain stores prevents state conflicts and makes debugging easier during long-running processes.

## Data Flow & API Integration Architecture

### Data Flow Architecture: Event-Driven with Persistent Connections

#### API Integration Strategy

**1. REST API Endpoints** (Standard CRUD operations)
- File upload endpoints with chunked upload support
- Report CRUD operations and metadata management
- User preferences and configuration management

**2. WebSocket/SSE Connection** (Real-time updates)
- Live progress updates during 5-20 minute generation processes
- AI clarification questions pushed to client in real-time
- Section completion notifications and error alerts

**3. Background Job Integration** (Firebase Functions/Cloud Tasks)
- Async report generation job management
- File processing pipeline integration
- AI model orchestration and timeout handling

#### Data Flow Patterns

**File Upload Flow:**
```typescript
FileDropzone → FileManagementStore → Chunked Upload API → 
Processing Queue → Progress Updates via WebSocket → UI Updates
```

**Report Generation Flow:**
```typescript
Generate Button → ReportGenerationStore → Generation API → 
Background Job → Progress WebSocket → Progress Components → 
AI Questions via WebSocket → AIInteractionStore → User Response
```

#### Critical Integration Decisions

- **Resilient Connection Management**: Auto-reconnect WebSocket with exponential backoff
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Error Recovery**: Graceful degradation when real-time connections fail
- **Progress Persistence**: Store generation state to survive browser refreshes

#### Design Rationale

The 5-20 minute generation processes require persistent real-time communication. Traditional polling would be inefficient and could miss critical AI questions. WebSocket connections provide immediate updates while REST handles standard operations.

## TypeScript Architecture & Type Safety

### Type Architecture Strategy: Domain-Driven Type System

#### Core Type Domains

**1. File Management Types**
```typescript
interface EcologicalFile {
  id: string
  type: 'nvr' | 'pmr' | 'bvd' | 'species-list' | 'shapefile'
  name: string
  size: number
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error'
  validationResult: ValidationResult
  metadata: FileMetadata
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  extractedData?: Record<string, unknown>
}
```

**2. Report Generation Types**
```typescript
interface ReportGeneration {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error' | 'cancelled'
  overallProgress: number
  sections: ReportSection[]
  estimatedTimeRemaining: number
  startTime: Date
  aiModel: AIModelConfig
}

interface ReportSection {
  id: string
  title: string
  status: SectionStatus
  progress: number
  content?: string
  dependencies: string[]
  aiQuestions: AIQuestion[]
}
```

**3. AI Interaction Types**
```typescript
interface AIQuestion {
  id: string
  type: 'clarification' | 'validation' | 'choice'
  message: string
  context: QuestionContext
  possibleAnswers?: string[]
  urgency: 'low' | 'medium' | 'high'
  timestamp: Date
  response?: AIResponse
}
```

#### Advanced TypeScript Patterns

**1. Discriminated Unions for State Management**
```typescript
type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```

**2. Generic Hooks for Consistent Patterns**
```typescript
function useAsyncOperation<T>(): [
  AsyncState<T>,
  (operation: () => Promise<T>) => void
]
```

#### Type Safety Strategy

- **Strict TypeScript Configuration**: Enable all strict mode flags for maximum safety
- **Runtime Type Validation**: Use Zod for API boundary validation
- **Exhaustive Switch Statements**: Ensure all enum cases are handled
- **Generic Component Patterns**: Reusable typed components for common patterns

#### Design Rationale

The ecological domain has complex, interconnected data structures (files, reports, AI interactions) that must maintain integrity throughout long-running processes. Strong typing prevents runtime errors during critical generation phases and makes the codebase more maintainable as complexity grows.

## Performance & Optimization Architecture

### Performance Architecture: Progressive Enhancement with Smart Resource Management

#### Core Performance Strategies

**1. Long-Running Process Optimization**
- **Background Processing**: All AI generation runs in service workers/background threads
- **Memory Management**: Aggressive cleanup of completed sections to prevent memory leaks
- **Connection Pooling**: Efficient WebSocket connection reuse across multiple generations
- **State Snapshots**: Periodic state saves to handle browser crashes during 20-minute processes

**2. File Processing Performance**
- **Chunked Upload Strategy**: Large shapefiles (50MB+) uploaded in 1MB chunks with progress tracking
- **Streaming Validation**: File validation happens during upload, not after completion
- **Client-side Preprocessing**: Initial file parsing on client before server processing
- **Lazy Loading**: Only load file metadata initially, content on demand

**3. UI Performance During Generation**
- **Virtual Progress Rendering**: Efficiently render hundreds of progress updates without DOM thrashing
- **Debounced State Updates**: Batch rapid progress updates to prevent UI freezing
- **Smart Re-rendering**: Only update components when their specific data changes
- **Background Tab Optimization**: Reduce update frequency when tab is not active

#### Bundle & Code Optimization

**Code Splitting Strategy:**
```typescript
// Feature-based splitting
const FileManagement = lazy(() => import('./features/FileManagement'))
const ReportGeneration = lazy(() => import('./features/ReportGeneration'))
const AIInteraction = lazy(() => import('./features/AIInteraction'))

// Component-level splitting for heavy components
const GISViewer = lazy(() => import('./components/GISViewer'))
const ReportEditor = lazy(() => import('./components/ReportEditor'))
```

**Bundle Optimization:**
- **Tree Shaking**: Remove unused Shadcn UI components and Lucide icons
- **Dynamic Imports**: Load AI model interfaces only when needed
- **Service Worker Caching**: Cache completed reports and file metadata
- **Progressive Web App**: Enable offline viewing of completed reports

#### Performance Monitoring

- **Real-time Metrics**: Monitor memory usage during long generations
- **Performance Budgets**: Set limits for bundle size and loading times
- **User Experience Metrics**: Track Core Web Vitals for ecological workflows
- **Error Rate Monitoring**: Monitor failures during critical long-running processes

#### Design Rationale

The application has unique performance challenges: 20-minute processes that must survive browser issues, large file uploads that can't block the UI, and real-time updates that must be smooth. This performance architecture ensures the app remains responsive throughout the entire ecological workflow.

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Priority: Critical Infrastructure**

1. **State Management Setup**
   - Implement core Zustand stores (FileManagement, ReportGeneration, AIInteraction, UIState)
   - Add TypeScript interfaces for all domain types
   - Set up store persistence with localStorage

2. **Component Architecture**
   - Enhance existing FileDropzone with chunked upload support
   - Improve AIInteractionCallout with real-time message handling
   - Optimize ProgressMonitor for high-frequency updates

3. **API Integration Foundation**
   - Establish REST API client with proper error handling
   - Set up WebSocket connection management
   - Implement retry strategies and connection recovery

### Phase 2: Core Features (Weeks 3-4)
**Priority: Essential Workflows**

1. **File Processing Pipeline**
   - Complete file validation and metadata extraction
   - Implement progress tracking for large file uploads
   - Add client-side file preprocessing

2. **Report Generation Integration**
   - Connect UI to background job system
   - Implement real-time progress updates
   - Add section-level generation controls

3. **AI Interaction System**
   - Real-time AI question delivery via WebSocket
   - Human-in-the-loop response handling
   - Question prioritization and queuing

### Phase 3: Performance & Polish (Weeks 5-6)
**Priority: Production Ready**

1. **Performance Optimization**
   - Implement code splitting and lazy loading
   - Add memory management for long-running processes
   - Optimize bundle size and loading performance

2. **Error Handling & Recovery**
   - Comprehensive error boundaries
   - State recovery after browser crashes
   - Graceful degradation strategies

3. **Testing & Documentation**
   - Unit tests for all store logic
   - Integration tests for file upload workflows
   - Performance testing for long-running processes

### Phase 4: Advanced Features (Weeks 7-8)
**Priority: Enhancement**

1. **Advanced UI Features**
   - Report section dependency management
   - Advanced progress visualization
   - Offline support for completed reports

2. **Developer Experience**
   - Development tooling and debugging
   - Comprehensive TypeScript coverage
   - Performance monitoring integration

### Success Metrics

**Technical Metrics:**
- **Bundle Size**: < 2MB initial load
- **Performance**: < 3s first meaningful paint
- **Memory Usage**: < 100MB during active generation
- **Error Rate**: < 1% for file uploads and generation processes

**User Experience Metrics:**
- **File Upload Success**: > 99% for files under 50MB
- **Generation Completion**: > 95% for 20-minute processes
- **Real-time Updates**: < 500ms latency for progress updates
- **Recovery Success**: > 90% state recovery after browser crashes

## Architecture Decision Records

### ADR-001: State Management with Zustand
**Decision**: Use Zustand over Redux for state management
**Rationale**: Simpler API, better TypeScript support, easier async handling
**Trade-offs**: Less ecosystem, simpler debugging tools

### ADR-002: WebSocket for Real-time Updates
**Decision**: Use WebSocket over polling for progress updates
**Rationale**: Efficient for long-running processes, immediate AI question delivery
**Trade-offs**: Connection management complexity, fallback strategies needed

### ADR-003: Domain-Driven Component Architecture
**Decision**: Organize components by ecological domain rather than technical layers
**Rationale**: Better code organization, clearer ownership, easier maintenance
**Trade-offs**: Some code duplication, requires strong conventions

---

## 🏗️ **Frontend Architecture Complete!**

This comprehensive frontend architecture provides the foundation for building a robust, scalable, and performant ecological report generator. The architecture addresses the unique challenges of long-running AI processes, complex file handling, and real-time user interactions while maintaining excellent developer experience and code quality.

**Key Architectural Strengths:**
- **Domain-driven design** that maps to ecological workflows
- **Performance-first approach** for resource-intensive operations  
- **Type-safe development** with comprehensive TypeScript coverage
- **Resilient real-time communication** for long-running processes
- **Progressive enhancement** strategy for complex features

**Ready for implementation!** 🌿