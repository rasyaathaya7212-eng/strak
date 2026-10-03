/**
 * Custom LLM Provider
 * Supports any OpenAI-compatible API via baseUrl configuration
 */

import axios, { AxiosInstance } from 'axios';
import { Config, LLMRequest, LLMResponse, ToolCall } from '../types';

export class CustomProvider {
  private client: AxiosInstance;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes timeout
    });
  }

  /**
   * Call LLM API
   */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Prepare request body
        const body: any = {
          model: request.model || this.config.model,
          messages: this.formatMessages(request.messages),
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4096
        };

        // Add tools if provided
        if (request.tools && request.tools.length > 0) {
          body.tools = request.tools;
          body.tool_choice = 'auto';
        }

        if (attempt > 1) {
          console.log(`[LLM Retry] Attempt ${attempt}/${maxRetries}...`);
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Make API call with explicit response type
        const response = await this.client.post('/chat/completions', body, {
          validateStatus: (status) => status < 500, // Don't throw on 4xx
          maxContentLength: 50 * 1024 * 1024, // 50MB max
          timeout: 120000 // 2 minutes
        });

        // Check if response is valid
        if (response.status !== 200) {
          throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
        }

        // Check if response data exists
        if (!response.data) {
          throw new Error('Empty response from API');
        }

        // Parse response
        return this.parseResponse(response.data);

      } catch (error: any) {
        lastError = error;

        // Log detailed error
        if (error.response) {
          console.error(`[LLM Error] HTTP ${error.response.status}:`, error.response.data);
        } else if (error.code === 'ECONNABORTED') {
          console.error('[LLM Error] Request timeout');
        } else if (error.message.includes('JSON')) {
          console.error('[LLM Error] JSON parsing failed - response truncated or malformed');
        } else {
          console.error('[LLM Error]', error.message);
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // For JSON errors or network issues, retry
        const shouldRetry = 
          error.message.includes('JSON') ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT';

        if (!shouldRetry) {
          // For other errors (like 4xx), don't retry
          break;
        }
      }
    }

    // All retries failed, throw the last error
    if (lastError.response) {
      const errorData = lastError.response.data;
      const errorMsg = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
      throw new Error(`LLM API Error: ${lastError.response.status} - ${errorMsg}`);
    } else if (lastError.request) {
      throw new Error(`LLM API Request Error: No response received from ${this.config.baseUrl}`);
    } else {
      throw new Error(`LLM API Error: ${lastError.message}`);
    }
  }

  /**
   * Format messages for API
   */
  private formatMessages(messages: any[]): any[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: msg.toolCallId,
          content: msg.content
        };
      }
      
      return {
        role: msg.role,
        content: msg.content,
        ...(msg.toolCalls && { tool_calls: msg.toolCalls })
      };
    });
  }

  /**
   * Parse LLM response
   */
  private parseResponse(data: any): LLMResponse {
    // Validate data structure
    if (!data || typeof data !== 'object') {
      console.error('[Parse Error] Invalid response data:', data);
      throw new Error('Invalid response format from API');
    }

    // Handle case where data might not have choices
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('[Parse Error] No choices in response:', JSON.stringify(data).substring(0, 200));
      return {
        content: 'Error: No valid response from LLM',
        finishReason: 'error'
      };
    }

    const choice = data.choices[0];
    if (!choice || !choice.message) {
      console.error('[Parse Error] Invalid choice structure:', choice);
      throw new Error('Invalid choice structure in API response');
    }

    const message = choice.message;

    const response: LLMResponse = {
      content: message.content || '',
      finishReason: choice.finish_reason || 'stop'
    };

    // Parse tool calls if present
    if (message.tool_calls && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      try {
        response.toolCalls = message.tool_calls.map((tc: any) => {
          let parsedArgs;
          
          // Parse arguments carefully
          if (typeof tc.function.arguments === 'string') {
            try {
              parsedArgs = JSON.parse(tc.function.arguments);
            } catch (parseError) {
              console.error('[Parse Error] Failed to parse tool arguments:', tc.function.arguments);
              parsedArgs = {}; // Empty object as fallback
            }
          } else {
            parsedArgs = tc.function.arguments || {};
          }

          return {
            id: tc.id,
            name: tc.function.name,
            args: parsedArgs
          };
        });
      } catch (toolError) {
        console.error('[Parse Error] Failed to parse tool calls:', toolError);
        // Don't fail completely, just skip tool calls
        response.toolCalls = undefined;
      }
    }

    return response;
  }
}
