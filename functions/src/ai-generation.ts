/**
 * Multi-Tier AI Generation Service
 * Orchestrates different AI models based on task complexity
 */

import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { v4 as uuidv4 } from 'uuid';

// AI Provider configurations
interface AIProvider {
  name: string;
  miniModel: string;
  regularModel: string;
  deepModel: string;
  apiKey: string;
  baseUrl?: string;
}

interface GenerateReportSectionRequest {
  sectionName: string;
  sectionData: {
    subsections: string[];
    description: string;
    aiComplexity: 'low' | 'medium' | 'high';
    dependsOn: string[];
  };
  contextData: {
    uploadedFiles: Record<string, any>;
    previousSections: Record<string, string>;
    projectMetadata: Record<string, any>;
  };
  userId: string;
  projectId: string;
  generationId?: string;
  humanInTheLoop?: boolean;
}

interface GenerateReportSectionResponse {
  generationId: string;
  status: 'processing' | 'completed' | 'failed' | 'requires_human_input';
  content?: string;
  humanQuestion?: {
    question: string;
    options?: string[];
    type: 'text' | 'choice' | 'confirmation';
  };
  error?: string;
  aiModel: string;
  tokensUsed?: number;
}

class AIModelOrchestrator {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI
    this.providers.set('openai', {
      name: 'OpenAI',
      miniModel: 'gpt-4o-mini',
      regularModel: 'gpt-4o',
      deepModel: 'o1-preview',
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Claude (Anthropic)
    this.providers.set('claude', {
      name: 'Claude',
      miniModel: 'claude-3-haiku-20240307',
      regularModel: 'claude-3-5-sonnet-20241022',
      deepModel: 'claude-3-5-sonnet-20241022', // No deeper model yet
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseUrl: 'https://api.anthropic.com',
    });

    // Google Gemini
    this.providers.set('gemini', {
      name: 'Gemini',
      miniModel: 'gemini-1.5-flash',
      regularModel: 'gemini-1.5-pro',
      deepModel: 'gemini-1.5-pro-002', // Latest pro version
      apiKey: process.env.GOOGLE_API_KEY || '',
    });

    // DeepSeek
    this.providers.set('deepseek', {
      name: 'DeepSeek',
      miniModel: 'deepseek-chat',
      regularModel: 'deepseek-coder',
      deepModel: 'deepseek-reasoner', // Their reasoning model
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: 'https://api.deepseek.com',
    });
  }

  selectProvider(complexity: string, taskType: string = 'general'): { provider: AIProvider; model: string } {
    // Provider selection logic based on task complexity and type
    let providerKey: string;
    
    switch (complexity) {
      case 'high':
        // For high complexity, prefer OpenAI o1 or Claude for reasoning
        providerKey = taskType === 'coding' ? 'deepseek' : 'openai';
        break;
      case 'medium':
        // For medium complexity, use regular models - Claude is excellent for text
        providerKey = 'claude';
        break;
      case 'low':
        // For low complexity, use mini models - Gemini Flash is very fast
        providerKey = 'gemini';
        break;
      default:
        providerKey = 'claude';
    }

    const provider = this.providers.get(providerKey)!;
    let model: string;

    switch (complexity) {
      case 'high':
        model = provider.deepModel;
        break;
      case 'medium':
        model = provider.regularModel;
        break;
      case 'low':
        model = provider.miniModel;
        break;
      default:
        model = provider.regularModel;
    }

    return { provider, model };
  }

  async generateContent(
    provider: AIProvider,
    model: string,
    prompt: string,
    systemPrompt?: string,
    jsonMode: boolean = true
  ): Promise<{ content: string; tokensUsed: number }> {
    
    switch (provider.name) {
      case 'OpenAI':
        return this.callOpenAI(provider, model, prompt, systemPrompt, jsonMode);
      case 'Claude':
        return this.callClaude(provider, model, prompt, systemPrompt, jsonMode);
      case 'Gemini':
        return this.callGemini(provider, model, prompt, systemPrompt, jsonMode);
      case 'DeepSeek':
        return this.callDeepSeek(provider, model, prompt, systemPrompt, jsonMode);
      default:
        throw new Error(`Unknown AI provider: ${provider.name}`);
    }
  }

  private async callOpenAI(
    provider: AIProvider,
    model: string,
    prompt: string,
    systemPrompt?: string,
    jsonMode: boolean = true
  ): Promise<{ content: string; tokensUsed: number }> {
    // OpenAI API implementation
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody: any = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    };

    if (jsonMode && !model.startsWith('o1')) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private async callClaude(
    provider: AIProvider,
    model: string,
    prompt: string,
    systemPrompt?: string,
    jsonMode: boolean = true
  ): Promise<{ content: string; tokensUsed: number }> {
    // Claude API implementation
    const requestBody: any = {
      model,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    if (jsonMode) {
      requestBody.messages[0].content += '\n\nPlease respond in valid JSON format.';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
    };
  }

  private async callGemini(
    provider: AIProvider,
    model: string,
    prompt: string,
    systemPrompt?: string,
    jsonMode: boolean = true
  ): Promise<{ content: string; tokensUsed: number }> {
    // Gemini API implementation
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    
    if (jsonMode) {
      fullPrompt + '\n\nPlease respond in valid JSON format.';
    }

    const requestBody = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
    };
  }

  private async callDeepSeek(
    provider: AIProvider,
    model: string,
    prompt: string,
    systemPrompt?: string,
    jsonMode: boolean = true
  ): Promise<{ content: string; tokensUsed: number }> {
    // DeepSeek API implementation (OpenAI-compatible)
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody: any = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    };

    if (jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }
}

export const generateReportSection = onCall({
  region: 'australia-southeast1',
  memory: '1GiB',
  timeoutSeconds: 300,
  cors: true,
}, async (request: any) => {
    const {
      sectionName,
      sectionData,
      contextData,
      userId,
      projectId,
      generationId = uuidv4(),
      humanInTheLoop = false,
    } = request.data;

    const app = getApp();
    const db = getFirestore(app);
    const orchestrator = new AIModelOrchestrator();

    try {
      // Update generation status
      await db.collection('generations').doc(generationId).set({
        id: generationId,
        userId,
        projectId,
        sectionName,
        status: 'processing',
        startedAt: new Date(),
        updatedAt: new Date(),
      });

      // Select appropriate AI provider and model
      const { provider, model } = orchestrator.selectProvider(
        sectionData.aiComplexity,
        'ecological_report'
      );

      // Build context-aware prompt
      const prompt = buildSectionPrompt(sectionName, sectionData, contextData);
      const systemPrompt = buildSystemPrompt(sectionData.aiComplexity);

      // Check if human input is required (for demonstration)
      if (humanInTheLoop && sectionData.aiComplexity === 'high' && Math.random() < 0.3) {
        await db.collection('generations').doc(generationId).update({
          status: 'requires_human_input',
          humanQuestion: {
            question: `I need clarification for the ${sectionName} section. Should I focus more on conservation implications or development impacts?`,
            options: ['Conservation implications', 'Development impacts', 'Both equally'],
            type: 'choice',
          },
          updatedAt: new Date(),
        });

        return {
          generationId,
          status: 'requires_human_input' as const,
          humanQuestion: {
            question: `I need clarification for the ${sectionName} section. Should I focus more on conservation implications or development impacts?`,
            options: ['Conservation implications', 'Development impacts', 'Both equally'],
            type: 'choice' as const,
          },
          aiModel: `${provider.name} ${model}`,
        };
      }

      // Generate content
      const { content, tokensUsed } = await orchestrator.generateContent(
        provider,
        model,
        prompt,
        systemPrompt,
        true
      );

      // Parse JSON response
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }

      // Store results
      await db.collection('generations').doc(generationId).update({
        status: 'completed',
        content: parsedContent,
        aiProvider: provider.name,
        aiModel: model,
        tokensUsed,
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        generationId,
        status: 'completed' as const,
        content: parsedContent.content || content,
        aiModel: `${provider.name} ${model}`,
        tokensUsed,
      };

    } catch (error) {
      console.error('Report section generation error:', error);

      await db.collection('generations').doc(generationId).update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      });

      return {
        generationId,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        aiModel: 'unknown',
      };
    }
  }
);

function buildSectionPrompt(
  sectionName: string,
  sectionData: any,
  contextData: any
): string {
  return `
You are an expert ecological consultant generating a section of an ecological assessment report.

SECTION TO GENERATE: ${sectionName}
DESCRIPTION: ${sectionData.description}
SUBSECTIONS: ${sectionData.subsections.join(', ')}

CONTEXT DATA:
- Uploaded files: ${Object.keys(contextData.uploadedFiles).join(', ')}
- Previous sections completed: ${Object.keys(contextData.previousSections).join(', ')}
- Project metadata: ${JSON.stringify(contextData.projectMetadata, null, 2)}

REQUIREMENTS:
1. Generate content that is scientifically accurate and appropriate for regulatory submission
2. Follow Australian ecological assessment standards
3. Include specific references to the provided data sources
4. Structure the content with appropriate subsections
5. Use professional, technical language appropriate for ecologists and regulators
6. Ensure compliance with relevant environmental legislation

Please generate the ${sectionName} section content in the following JSON format:
{
  "content": "Main section content here",
  "subsections": {
    ${sectionData.subsections.map((sub: string) => `"${sub}": "Content for ${sub}"`).join(',\n    ')}
  },
  "references": ["List of references used"],
  "confidence": "High/Medium/Low",
  "recommendations": ["Any specific recommendations for this section"]
}
`;
}

function buildSystemPrompt(complexity: string): string {
  const basePrompt = `You are an expert ecological consultant with extensive experience in Australian environmental assessments. You specialize in generating high-quality, regulatory-compliant ecological reports.`;

  switch (complexity) {
    case 'high':
      return `${basePrompt} This is a complex analysis requiring deep reasoning, synthesis of multiple data sources, and sophisticated ecological understanding. Take your time to thoroughly analyze all available information and provide comprehensive, well-reasoned content.`;
    
    case 'medium':
      return `${basePrompt} This requires standard ecological analysis with attention to detail and professional presentation. Ensure accuracy and completeness while maintaining efficiency.`;
    
    case 'low':
      return `${basePrompt} This is a straightforward section requiring clear, concise content based on standard ecological assessment practices. Focus on accuracy and clarity.`;
    
    default:
      return basePrompt;
  }
}