# EcoLogen Backend Architecture

## System Overview & Backend Strategy

Based on the EcoLogen project requirements, frontend architecture, and critical PDF table extraction capabilities, this document defines a **serverless-first backend** with specialized document processing pipelines.

**Core Backend Challenges:**
- Long-running AI report generation (5-20 minutes)
- Large file processing (GIS shapefiles up to 50MB)
- **Specialized PDF table extraction** (NVR, PMR, BVD reports)
- Multi-AI model orchestration (OpenAI, Claude, Gemini, DeepSeek)
- Real-time progress updates and AI clarification workflows
- Australian data residency compliance

**Backend Architecture Strategy: Event-Driven Serverless with Specialized Processing Pipelines**

### Core Infrastructure Stack

**1. Serverless Compute (Firebase Functions/Google Cloud Functions)**
- Report generation orchestration
- **PDF table extraction processing**
- File processing pipelines
- AI model integration and routing
- WebSocket connection management

**2. Data Layer (Firebase/Firestore)**
- User data and authentication
- File metadata and processing status
- **Extracted table data and relationships**
- Report generation state and progress
- AI interaction history and responses

**3. File Storage (Google Cloud Storage)**
- Uploaded ecological documents (NVR, PMR, BVD)
- **Extracted table data (CSV/JSON)**
- Processed shapefiles and GIS data
- Generated report assets and exports
- Temporary processing artifacts

**4. Queue System (Google Cloud Tasks)**
- Long-running report generation jobs
- **PDF processing workflows**
- File processing workflows
- AI model request queuing and retry logic
- Background cleanup and maintenance

### Architectural Decisions

**Key Technology Choices:**
- **Firebase Functions**: Serverless execution for AI workflows and PDF processing
- **Cloud Tasks**: Reliable job queuing for long-running processes
- **Firestore**: Real-time database for progress updates and table metadata
- **Cloud Storage**: Scalable file storage with regional compliance
- **WebSocket via Socket.io**: Real-time communication layer
- **JavaScript Runtime**: Unified TypeScript/JavaScript stack for all processing

**Design Rationale:** The project needs specialized PDF table extraction using JavaScript libraries integrated with AI workflows, massive file uploads, and real-time user interaction. Serverless architecture provides automatic scaling while maintaining a unified language stack for better maintainability.

## PDF Table Extraction Architecture

### Document Processing Pipeline Architecture

**1. PDF Upload & Classification**
```typescript
PDF Upload → File Type Detection → Document Classification → 
Processing Queue → Specialized Extractor → Validation → Storage
```

**2. Specialized Extractors by Document Type:**
- **NVR Extractor**: Existing flora/fauna table extraction logic
- **PMR Extractor**: Protected matters report table processing  
- **BVD Extractor**: Biodiversity values document processing
- **Generic PDF Extractor**: Fallback for unknown document types

**3. Table Processing Strategy:**
```typescript
// JavaScript/TypeScript implementation using pdf2json
class DocumentProcessor {
    private extractor: PDFExtractor;
    
    constructor(document_type: string) {
        this.extractor = this._get_extractor(document_type);
    }
    
    async process_document(pdf_path: string, session_id: string): Promise<ExtractedData> {
        // pdf2json processing enhanced with:
        // - Progress tracking via WebSocket
        // - Error recovery and retry logic
        // - Metadata preservation
        // - Table structure detection
        // - Header relationship mapping
        return await this.extractor.extractTables(pdf_path, session_id);
    }
}
```

### Advanced Table Extraction Features

**Enhanced Table Structure Preservation:**
- **Merged Cell Detection**: Use pdf2json table parsing to detect and preserve merged cells
- **Header Hierarchy**: Maintain parent-child relationships in complex table headers
- **Table Metadata**: Store table position, confidence scores, and extraction context
- **Multi-page Table Handling**: Connect tables that span across PDF pages

**Quality Assurance & Validation:**
- **Extraction Confidence Scoring**: Rate extraction quality for each table
- **Schema Validation**: Verify extracted data matches expected government report formats
- **Human-in-the-Loop Validation**: Flag uncertain extractions for user review
- **Version Tracking**: Handle different NVR/PMR report formats over time

### Technical Implementation Strategy

**Cloud Functions Architecture:**
```typescript
// PDF Processing Function (JavaScript/TypeScript)
exports.processPDF = onCall(async (data, context) => {
  const { fileUrl, documentType, sessionId } = data
  
  // Download PDF from Cloud Storage
  // Execute pdf2json table extraction
  // Store results in Firestore with metadata  
  // Trigger downstream AI processing
  // Send progress updates via WebSocket
})
```

**JavaScript Library Integration:**
- **Native TypeScript Integration**: Use pdf2json directly in Cloud Functions Node.js runtime
- **Enhanced Progress Reporting**: Real-time WebSocket updates during extraction
- **Error Handling**: Robust retry logic for complex PDF formats
- **Memory Management**: Handle large PDFs without timeout issues

### Design Rationale

The pdf2json JavaScript approach provides robust table extraction capabilities for government report formats. This architecture leverages the unified TypeScript stack while adding enterprise features like progress tracking, error recovery, and quality assurance.

## AI Model Orchestration Architecture

### AI Orchestration Strategy: Multi-Provider Resilience with Intelligent Routing

#### AI Provider Abstraction Layer

```typescript
interface AIProvider {
  name: 'openai' | 'claude' | 'gemini' | 'deepseek'
  models: {
    mini: AIModel      // Fast, cheap for simple tasks
    regular: AIModel   // Balanced for standard tasks  
    deep: AIModel      // Deep reasoning for complex tasks
  }
  generateContent(prompt: string, options: GenerationOptions): Promise<AIResponse>
  supportsJSONOutput: boolean
}

interface AIModel {
  modelId: string
  maxTokens: number
  costPerToken: number
  avgResponseTime: number
  capabilities: ModelCapability[]
  thinkingStyle: 'fast' | 'balanced' | 'deep_reasoning'
}

type ModelCapability = 'json_output' | 'function_calling' | 'code_generation' | 
                      'reasoning' | 'analysis' | 'creative_writing'
```

#### Intelligent Model Selection

- **Task-Specific Routing**: Different models for different report sections
- **Fallback Chains**: Automatic failover when primary model is unavailable
- **Cost Optimization**: Balance quality vs. cost based on section importance
- **Performance Monitoring**: Track response times and success rates per model

#### Generation Workflow Orchestration

```typescript
class ReportGenerator {
  async generateSection(sectionType: string, context: ReportContext) {
    const strategy = this.getGenerationStrategy(sectionType)
    const primaryModel = strategy.primaryModel
    const fallbackModels = strategy.fallbacks
    
    try {
      return await this.tryGeneration(primaryModel, context)
    } catch (error) {
      return await this.tryFallbacks(fallbackModels, context)
    }
  }
}
```

### Multi-Tier Agentic AI Strategy

**Three-Tier Model Architecture per Provider:**

**Mini Models (Fast & Cheap):**
- **OpenAI**: GPT-4o-mini
- **Claude**: Claude 3.5 Haiku  
- **Gemini**: Gemini 1.5 Flash
- **DeepSeek**: DeepSeek-R1-Lite-Preview

**Regular Models (Balanced):**
- **OpenAI**: GPT-4o
- **Claude**: Claude 3.5 Sonnet
- **Gemini**: Gemini 1.5 Pro
- **DeepSeek**: DeepSeek-V3

**Deep Thinking Models (Complex Reasoning):**
- **OpenAI**: o1 (reasoning model)
- **Claude**: Claude 3 Opus (when available)
- **Gemini**: Gemini 2.0 Flash Thinking
- **DeepSeek**: DeepSeek-R1 (reasoning model)

### Intelligent Task-Model Mapping

**Mini Model Tasks:**
- **File classification**: Determine document type (NVR/PMR/BVD)
- **Simple validations**: Check extracted data format compliance
- **Status updates**: Generate progress messages and notifications
- **Template tasks**: Format citations, headers, standard text
- **Quick responses**: Handle simple AI clarification questions

**Regular Model Tasks:**
- **Content generation**: Main report section writing
- **Data analysis**: Interpret extracted table data and findings
- **Cross-referencing**: Link information between different sections
- **Quality checks**: Review generated content for consistency
- **Standard AI questions**: Most human-in-the-loop interactions

**Deep Thinking Model Tasks:**
- **Complex ecological analysis**: Interpret complex species interactions and habitat relationships
- **Regulatory compliance**: Ensure content meets Australian environmental regulations
- **Methodology design**: Create scientifically sound assessment methodologies
- **Critical decisions**: Handle high-stakes AI questions with regulatory implications
- **Quality assurance**: Final review of complete reports before export

### Agentic Workflow Orchestration

```typescript
class AgenticReportGenerator {
  async processSection(section: ReportSection, context: EcologicalContext) {
    // Step 1: Mini model classifies complexity
    const complexity = await this.classifyComplexity(section, 'mini')
    
    // Step 2: Route to appropriate model tier
    const modelTier = this.selectModelTier(complexity, section.importance)
    
    // Step 3: Generate with escalation capability
    let result = await this.generateWithTier(modelTier, section, context)
    
    // Step 4: Quality check and potential escalation
    if (result.needsDeepThinking) {
      result = await this.generateWithTier('deep', section, context)
    }
    
    return result
  }
  
  selectModelTier(complexity: ComplexityLevel, importance: SectionImportance): ModelTier {
    if (complexity === 'high' || importance === 'critical') return 'deep'
    if (complexity === 'medium' || importance === 'important') return 'regular'
    return 'mini'
  }
}

**Quality Assurance Pipeline:**
- **JSON Schema Validation**: Ensure all models return properly structured data
- **Content Coherence Checking**: Cross-reference between sections for consistency
- **Ecological Accuracy Validation**: Domain-specific validation rules
- **Human Review Flagging**: Identify content that needs expert review

### Human-in-the-Loop AI Architecture

**Clarification Request System:**
```typescript
interface AIQuestion {
  id: string
  modelSource: string
  sectionContext: string
  questionType: 'data_clarification' | 'methodology_choice' | 'interpretation'
  priority: 'high' | 'medium' | 'low'
  possibleAnswers?: string[]
  contextData: ExtractedTableData
}
```

**Real-time AI Interaction Flow:**
1. **AI encounters ambiguity** during generation
2. **Question formulated** with context and options
3. **Sent to frontend** via WebSocket
4. **User provides clarification** through AIInteractionCallout
5. **Response fed back** to AI model for continued generation
6. **Context preserved** for future similar questions

### Advanced AI Features

**Context-Aware Generation:**
- **File Content Integration**: AI has access to all extracted table data
- **Cross-Section Referencing**: Later sections reference earlier findings
- **GIS Data Interpretation**: AI can interpret shapefile metadata and location context
- **Regulatory Compliance**: Built-in knowledge of Australian ecological regulations

**Generation Optimization:**
- **Incremental Generation**: Generate sections progressively, not all at once
- **Parallel Processing**: Multiple models can work on different sections simultaneously  
- **Caching Strategy**: Cache common patterns and responses to reduce API costs
- **Token Management**: Optimize prompts to stay within model limits while maintaining quality

### Design Rationale

The multi-tier agentic approach optimizes both cost and quality by matching task complexity to model capability. Mini models handle 70% of routine tasks at low cost, regular models handle standard generation, and deep thinking models tackle complex ecological reasoning. This creates an intelligent, scalable system that maintains high quality while controlling costs.

**Key Benefits of Multi-Tier Architecture:**
- **Cost Optimization**: 5-10x cost reduction by using mini models for simple tasks
- **Speed Optimization**: Fast responses for status updates and simple validations
- **Quality Assurance**: Deep reasoning models for critical ecological decisions
- **Scalability**: Can handle high volumes of routine tasks efficiently
- **Reliability**: Multiple fallback options across providers and model tiers

## Data Architecture & Australian Compliance

### Data Architecture Strategy: Regional Compliance with Ecological Domain Modeling

#### Australian Data Sovereignty

- **Primary Region**: `australia-southeast1` (Sydney) for all client data
- **Backup Region**: `australia-southeast2` (Melbourne) for disaster recovery
- **Data Classification**: Ecological data treated as sensitive business information
- **Cross-Border Restrictions**: No client data leaves Australian data centers

#### Ecological Data Model

```typescript
// Project-level organization
interface EcologicalProject {
  id: string
  name: string
  location: GeoLocation
  client: ClientInfo
  reportSections: ReportSection[]
  extractedData: ExtractedTableData[]
  generationHistory: GenerationRun[]
  aiInteractions: AIQuestion[]
}

// Extracted table structures with multi-tier processing
interface ExtractedTableData {
  sourceDocument: DocumentInfo
  tableType: 'threatened_flora' | 'threatened_fauna' | 'species_list'
  extractionMethod: 'nvrExtractor' | 'pmrExtractor' | 'bvdExtractor'
  processingTier: 'mini' | 'regular' | 'deep'
  confidence: number
  rawData: TableRow[]
  processedData: StructuredEcologicalData
  validationStatus: ValidationResult
  aiModelUsed: string
}
```

#### Real-time Data Synchronization

**Firestore Real-time Strategy:**
- **Document Structure**: Projects → Reports → Sections → Progress Updates
- **Subscription Patterns**: Frontend subscribes to specific project/report progress
- **Multi-tier Updates**: Track which model tier processed each piece of data
- **Conflict Resolution**: Last-write-wins for progress, merge strategies for content

**Performance Optimization:**
- **Denormalization Strategy**: Optimize for read-heavy ecological queries
- **Caching Layers**: Cache frequently accessed species and location data
- **Index Strategy**: Optimize for geographic and species-based queries
- **Model Tier Optimization**: Cache mini model results, real-time regular/deep model updates

## Implementation Roadmap

### Phase 1: Foundation & PDF Processing (Weeks 1-3)
**Priority: Core Infrastructure**

1. **PDF Table Extraction Pipeline**
   - Implement pdf2json table extraction in Cloud Functions
   - Add progress tracking and WebSocket integration
   - Implement document type classification with mini models
   - Set up Australian data residency compliance

2. **Multi-Tier AI Foundation**
   - Implement provider abstraction layer with 3-tier support
   - Set up model routing and escalation logic
   - Add cost tracking and optimization
   - Integrate basic human-in-the-loop workflows

3. **Data Architecture Setup**
   - Configure Firestore with Australian regional settings
   - Implement core ecological data models
   - Set up real-time synchronization patterns
   - Add audit logging and compliance tracking

### Phase 2: AI Orchestration & Generation (Weeks 4-6)
**Priority: Core AI Workflows**

1. **Agentic Report Generation**
   - Implement section-by-section generation with appropriate model tiers
   - Add cross-section referencing and context management
   - Set up quality assurance pipelines
   - Integrate extracted table data with AI context

2. **Advanced AI Features**
   - Implement model tier escalation based on complexity
   - Add parallel processing for independent sections
   - Set up caching strategies for common patterns
   - Integrate GIS data interpretation capabilities

3. **Real-time Communication**
   - Complete WebSocket implementation for progress updates
   - Add AI clarification question workflows
   - Implement user response integration
   - Set up mobile progress monitoring

### Phase 3: Production Features (Weeks 7-9)
**Priority: Production Ready**

1. **Performance & Reliability**
   - Optimize multi-tier model selection algorithms
   - Implement comprehensive error handling and retry logic
   - Add circuit breaker patterns for model failures
   - Set up automated cost monitoring and alerts

2. **Security & Compliance**
   - Complete Australian data residency implementation
   - Add field-level encryption for sensitive location data
   - Implement role-based access control
   - Set up compliance reporting and audit trails

3. **Advanced Features**
   - Add sophisticated ecological validation rules
   - Implement report versioning and comparison
   - Set up automated quality assurance workflows
   - Add export optimization for large reports

### Phase 4: Optimization & Scale (Weeks 10-12)
**Priority: Enterprise Ready**

1. **AI Optimization**
   - Fine-tune model tier selection based on performance data
   - Implement advanced caching and prompt optimization
   - Add learning algorithms for improving model selection
   - Set up A/B testing for AI model performance

2. **Advanced Analytics**
   - Implement comprehensive usage analytics
   - Add ecological data insights and trends
   - Set up predictive models for generation time estimation
   - Add cost optimization recommendations

## Success Metrics

**Technical Metrics:**
- **Multi-tier Efficiency**: 70%+ tasks handled by mini models
- **Cost Optimization**: 60%+ reduction vs single-tier approach
- **Generation Accuracy**: 95%+ ecological accuracy validation
- **Australian Compliance**: 100% data residency compliance

**Performance Metrics:**
- **PDF Processing**: < 30s for 50MB documents
- **AI Response Time**: < 2s for mini, < 30s for regular, < 2min for deep
- **Real-time Updates**: < 500ms latency for progress updates
- **Report Generation**: 90%+ completion rate for 20-minute processes

---

## 🏗️ **Backend Architecture Complete!**

This comprehensive backend architecture provides a robust, scalable, and compliant foundation for EcoLogen's AI-powered ecological report generation. The multi-tier agentic AI system optimizes for both cost and quality while maintaining Australian data sovereignty and handling the complex requirements of ecological consulting.

**Key Architectural Strengths:**
- **Multi-tier AI optimization** balancing cost, speed, and quality
- **Specialized PDF extraction** leveraging proven domain expertise
- **Australian compliance** with regional data residency
- **Real-time communication** for long-running processes
- **Ecological domain modeling** preserving complex data relationships

**Ready for implementation alongside the frontend architecture!** 🌿