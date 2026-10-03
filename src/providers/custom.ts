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

      // Make API call with custom response transformer to handle incomplete JSON
      const response = await this.client.post('/chat/completions', body, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        transformResponse: [(data) => {
          // Custom JSON parsing with error recovery
          if (typeof data === 'string') {
            try {
              // Log data length for debugging
              console.log(`[JSON] Received ${data.length} characters`);
              
              // Check if JSON looks complete
              if (!data.trim().endsWith('}') && !data.trim().endsWith(']')) {
                console.warn('[JSON] Response may be incomplete');
                
                // Try to fix by closing braces
                const openBraces = (data.match(/\{/g) || []).length;
                const closeBraces = (data.match(/\}/g) || []).length;
                if (openBraces > closeBraces) {
                  console.log(`[JSON] Auto-fixing: adding ${openBraces - closeBraces} closing braces`);
                  data = data.trim() + '}'.repeat(openBraces - closeBraces);
                }
              }
              
              return JSON.parse(data);
            } catch (parseError: any) {
              console.error('[JSON Parse Error]', parseError.message);
              console.error('[JSON Length]', data.length);
              console.error('[JSON Start]', data.substring(0, 100));
              console.error('[JSON End]', data.substring(Math.max(0, data.length - 100)));
              throw new Error(`JSON parsing failed: ${parseError.message}`);
            }
          }
          return data;
        }]
      });

      // Parse response
      return this.parseResponse(response.data);
    } catch (error: any) {
      // Enhanced error handling
      if (error.message && error.message.includes('JSON')) {
        console.error('[LLM] JSON parsing failed - retrying with smaller maxTokens might help');
      }
      
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
        throw new Error(`LLM API Error: ${error.response.status} - ${errorMsg}`);
      } else if (error.request) {
        throw new Error(`LLM API Request Error: No response received from ${this.config.baseUrl}`);
      } else {
        throw new Error(`LLM API Error: ${error.message}`);
      }
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
      console.error('[Parse] Invalid data type:', typeof data);
      throw new Error('Invalid response format from API');
    }
    
    // Handle case where data might not have choices
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('[Parse] No choices in response');
      return {
        content: 'Error: No response from LLM',
        finishReason: 'error'
      };
    }

    const choice = data.choices[0];
    if (!choice || !choice.message) {
      console.error('[Parse] Invalid choice structure');
      throw new Error('Invalid choice in API response');
    }
    
    const message = choice.message;

    const response: LLMResponse = {
      content: message.content || '',
      finishReason: choice.finish_reason || 'stop'
    };

    // Parse tool calls if present - with enhanced error handling
    if (message.tool_calls && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      try {
        response.toolCalls = message.tool_calls.map((tc: any, index: number) => {
          try {
            let parsedArgs;
            
            if (typeof tc.function.arguments === 'string') {
              try {
                parsedArgs = JSON.parse(tc.function.arguments);
              } catch (argError) {
                console.error(`[Parse] Failed to parse arguments for tool call ${index}:`, tc.function.arguments);
                parsedArgs = {}; // Fallback to empty object
              }
            } else {
              parsedArgs = tc.function.arguments || {};
            }
            
            return {
              id: tc.id,
              name: tc.function.name,
              args: parsedArgs
            };
          } catch (tcError: any) {
            console.error(`[Parse] Error processing tool call ${index}:`, tcError.message);
            return null;
          }
        }).filter((tc: any) => tc !== null); // Remove failed tool calls
      } catch (toolError: any) {
        console.error('[Parse] Failed to parse tool calls:', toolError.message);
        // Don't fail completely, just skip tool calls
        response.toolCalls = undefined;
      }
    }

    return response;
  }
}
