/**
 * Report Generation Store - Manages AI-powered report generation with multi-tier model orchestration
 * Handles real-time progress, human-in-the-loop interactions, and generation history
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  EcologicalProject,
  ReportGenerationRequest,
  AIGenerationProgress,
  GenerationRun,
  AIQuestion,
  UserResponse,
  ReportSection,
  ModelTier,
  AIProvider,
  ModelUsageStats,
  WebSocketMessage
} from '../types/shared'

interface ReportGenerationState {
  // Active generation state
  activeProject: EcologicalProject | null
  currentGeneration: GenerationRun | null
  generationProgress: AIGenerationProgress | null
  
  // AI interactions
  pendingQuestions: AIQuestion[]
  completedQuestions: AIQuestion[]
  
  // Generation history
  generationHistory: GenerationRun[]
  
  // Real-time communication
  wsConnection: WebSocket | null
  isConnected: boolean
  
  // Actions
  setActiveProject: (project: EcologicalProject) => void
  startGeneration: (request: ReportGenerationRequest) => Promise<string>
  cancelGeneration: (generationId: string) => Promise<void>
  regenerateSection: (sectionId: string, tier?: ModelTier) => Promise<void>
  
  // AI Question handling
  respondToQuestion: (questionId: string, response: UserResponse) => Promise<void>
  dismissQuestion: (questionId: string) => void
  escalateQuestion: (questionId: string, toTier: ModelTier) => Promise<void>
  
  // Real-time updates
  updateProgress: (progress: AIGenerationProgress) => void
  addAIQuestion: (question: AIQuestion) => void
  updateSectionContent: (sectionId: string, content: string) => void
  
  // WebSocket management
  connectWebSocket: (projectId: string) => void
  disconnectWebSocket: () => void
  handleWebSocketMessage: (message: WebSocketMessage) => void
  
  // Utility
  getQuestionsByUrgency: (urgency: 'low' | 'medium' | 'high') => AIQuestion[]
  getGenerationStats: () => ModelUsageStats | null
  canRegenerateSection: (sectionId: string) => boolean
}

export const useReportGenerationStore = create<ReportGenerationState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    activeProject: null,
    currentGeneration: null,
    generationProgress: null,
    pendingQuestions: [],
    completedQuestions: [],
    generationHistory: [],
    wsConnection: null,
    isConnected: false,
    
    // Project management
    setActiveProject: (project: EcologicalProject) => {
      set({ activeProject: project })
      
      // Connect to real-time updates for this project
      if (project.id) {
        get().connectWebSocket(project.id)
      }
    },
    
    // Generation management
    startGeneration: async (request: ReportGenerationRequest) => {
      const { activeProject } = get()
      if (!activeProject) {
        throw new Error('No active project selected')
      }
      
      try {
        // Create generation run
        const generationRun: GenerationRun = {
          id: `gen_${Date.now()}`,
          projectId: request.projectId,
          sectionsGenerated: request.sectionsToGenerate,
          generationMode: request.generationMode,
          startedAt: new Date(),
          status: 'running',
          modelUsageStats: {
            miniTokens: 0,
            regularTokens: 0,
            deepTokens: 0,
            totalCost: 0,
            averageResponseTime: 0,
            escalationRate: 0
          }
        }
        
        set(state => ({
          currentGeneration: generationRun,
          generationHistory: [...state.generationHistory, generationRun]
        }))
        
        // Trigger backend generation
        const response = await triggerReportGeneration(request)
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to start generation')
        }
        
        return generationRun.id
        
      } catch (error) {
        // Update generation status to failed
        set(state => ({
          currentGeneration: state.currentGeneration ? {
            ...state.currentGeneration,
            status: 'failed',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          } : null
        }))
        throw error
      }
    },
    
    cancelGeneration: async (generationId: string) => {
      try {
        const response = await cancelReportGeneration(generationId)
        
        if (response.success) {
          set(state => ({
            currentGeneration: state.currentGeneration?.id === generationId ? {
              ...state.currentGeneration,
              status: 'cancelled',
              completedAt: new Date()
            } : state.currentGeneration,
            generationProgress: null
          }))
        }
      } catch (error) {
        console.error('Failed to cancel generation:', error)
      }
    },
    
    regenerateSection: async (sectionId: string, tier?: ModelTier) => {
      const { activeProject } = get()
      if (!activeProject) return
      
      try {
        const response = await regenerateReportSection(activeProject.id, sectionId, tier)
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to regenerate section')
        }
      } catch (error) {
        console.error('Failed to regenerate section:', error)
        throw error
      }
    },
    
    // AI Question handling
    respondToQuestion: async (questionId: string, response: UserResponse) => {
      try {
        const apiResponse = await submitQuestionResponse(questionId, response)
        
        if (apiResponse.success) {
          set(state => {
            const question = state.pendingQuestions.find(q => q.id === questionId)
            if (!question) return state
            
            const updatedQuestion = {
              ...question,
              responses: [...question.responses, response],
              resolvedAt: new Date()
            }
            
            return {
              pendingQuestions: state.pendingQuestions.filter(q => q.id !== questionId),
              completedQuestions: [...state.completedQuestions, updatedQuestion]
            }
          })
        }
      } catch (error) {
        console.error('Failed to submit response:', error)
        throw error
      }
    },
    
    dismissQuestion: (questionId: string) => {
      set(state => ({
        pendingQuestions: state.pendingQuestions.filter(q => q.id !== questionId)
      }))
    },
    
    escalateQuestion: async (questionId: string, toTier: ModelTier) => {
      try {
        const response = await escalateQuestionTier(questionId, toTier)
        
        if (response.success) {
          set(state => {
            const questions = state.pendingQuestions.map(q => 
              q.id === questionId ? { ...q, modelTierRequired: toTier } : q
            )
            return { pendingQuestions: questions }
          })
        }
      } catch (error) {
        console.error('Failed to escalate question:', error)
      }
    },
    
    // Real-time updates
    updateProgress: (progress: AIGenerationProgress) => {
      set({ generationProgress: progress })
      
      // Update current generation if it exists
      set(state => ({
        currentGeneration: state.currentGeneration?.id === progress.generationId ? {
          ...state.currentGeneration,
          // Update completion status if needed
          ...(progress.status === 'complete' && {
            status: 'completed' as const,
            completedAt: new Date()
          }),
          ...(progress.status === 'error' && {
            status: 'failed' as const,
            completedAt: new Date(),
            errorMessage: progress.errorMessage
          })
        } : state.currentGeneration
      }))
    },
    
    addAIQuestion: (question: AIQuestion) => {
      set(state => ({
        pendingQuestions: [...state.pendingQuestions, question]
      }))
    },
    
    updateSectionContent: (sectionId: string, content: string) => {
      set(state => ({
        activeProject: state.activeProject ? {
          ...state.activeProject,
          reportSections: state.activeProject.reportSections.map(section =>
            section.id === sectionId ? {
              ...section,
              content,
              generatedAt: new Date()
            } : section
          )
        } : null
      }))
    },
    
    // WebSocket management
    connectWebSocket: (projectId: string) => {
      const { wsConnection, isConnected } = get()
      
      // Close existing connection
      if (wsConnection && isConnected) {
        wsConnection.close()
      }
      
      try {
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/generation-progress`)
        
        ws.onopen = () => {
          set({ wsConnection: ws, isConnected: true })
          
          // Subscribe to project updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            projectId
          }))
        }
        
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            get().handleWebSocketMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }
        
        ws.onclose = () => {
          set({ wsConnection: null, isConnected: false })
          
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (get().activeProject?.id) {
              get().connectWebSocket(get().activeProject!.id)
            }
          }, 3000)
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          set({ isConnected: false })
        }
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
      }
    },
    
    disconnectWebSocket: () => {
      const { wsConnection } = get()
      
      if (wsConnection) {
        wsConnection.close()
        set({ wsConnection: null, isConnected: false })
      }
    },
    
    handleWebSocketMessage: (message: WebSocketMessage) => {
      switch (message.type) {
        case 'progress_update':
          get().updateProgress(message.data as AIGenerationProgress)
          break
          
        case 'ai_question':
          get().addAIQuestion(message.data as AIQuestion)
          break
          
        case 'generation_complete':
          const completedRun = message.data as GenerationRun
          set(state => ({
            currentGeneration: null,
            generationProgress: null,
            generationHistory: state.generationHistory.map(run =>
              run.id === completedRun.id ? completedRun : run
            )
          }))
          break
          
        case 'error':
          console.error('Generation error received:', message.data)
          break
      }
    },
    
    // Utility functions
    getQuestionsByUrgency: (urgency: 'low' | 'medium' | 'high') => {
      return get().pendingQuestions.filter(q => q.urgency === urgency)
    },
    
    getGenerationStats: () => {
      const { currentGeneration } = get()
      return currentGeneration?.modelUsageStats || null
    },
    
    canRegenerateSection: (sectionId: string) => {
      const { currentGeneration, activeProject } = get()
      
      if (currentGeneration?.status === 'running') {
        return false // Can't regenerate during active generation
      }
      
      const section = activeProject?.reportSections.find(s => s.id === sectionId)
      return section?.content !== undefined // Can only regenerate sections with existing content
    }
  }))
)

// ============================================================================
// API INTEGRATION FUNCTIONS (to be implemented)
// ============================================================================

async function triggerReportGeneration(request: ReportGenerationRequest) {
  // TODO: Implement Cloud Function call for report generation
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Generation API pending', recoverable: false },
    timestamp: new Date()
  }
}

async function cancelReportGeneration(generationId: string) {
  // TODO: Implement generation cancellation
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Cancellation API pending', recoverable: false },
    timestamp: new Date()
  }
}

async function regenerateReportSection(projectId: string, sectionId: string, tier?: ModelTier) {
  // TODO: Implement section regeneration
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Section regeneration API pending', recoverable: false },
    timestamp: new Date()
  }
}

async function submitQuestionResponse(questionId: string, response: UserResponse) {
  // TODO: Implement question response submission
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Question response API pending', recoverable: false },
    timestamp: new Date()
  }
}

async function escalateQuestionTier(questionId: string, toTier: ModelTier) {
  // TODO: Implement question tier escalation
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Question escalation API pending', recoverable: false },
    timestamp: new Date()
  }
}

// ============================================================================
// STORE SELECTORS
// ============================================================================

export const useActiveProject = () => 
  useReportGenerationStore(state => state.activeProject)

export const useGenerationProgress = () => 
  useReportGenerationStore(state => state.generationProgress)

export const usePendingQuestions = () => 
  useReportGenerationStore(state => state.pendingQuestions)

export const useHighPriorityQuestions = () => 
  useReportGenerationStore(state => state.getQuestionsByUrgency('high'))

export const useGenerationActions = () => 
  useReportGenerationStore(state => ({
    startGeneration: state.startGeneration,
    cancelGeneration: state.cancelGeneration,
    regenerateSection: state.regenerateSection,
    respondToQuestion: state.respondToQuestion
  }))

export const useWebSocketStatus = () => 
  useReportGenerationStore(state => ({
    isConnected: state.isConnected,
    connect: state.connectWebSocket,
    disconnect: state.disconnectWebSocket
  }))