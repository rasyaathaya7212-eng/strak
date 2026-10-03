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

      // Add tools if provided (but some APIs don't support tools)
      if (request.tools && request.tools.length > 0) {
        body.tools = request.tools;
        body.tool_choice = 'auto';
      }

      // Make API call
      const response = await this.client.post('/chat/completions', body);

      // Parse response
      return this.parseResponse(response.data);
    } catch (error: any) {
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
    // Handle case where data might not have choices
    if (!data.choices || data.choices.length === 0) {
      return {
        content: 'No response from LLM',
        finishReason: 'error'
      };
    }

    const choice = data.choices[0];
    const message = choice.message;

    const response: LLMResponse = {
      content: message.content || '',
      finishReason: choice.finish_reason || 'stop'
    };

    // Parse tool calls if present
    if (message.tool_calls && message.tool_calls.length > 0) {
      response.toolCalls = message.tool_calls.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        args: typeof tc.function.arguments === 'string' 
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments
      }));
    }

    return response;
  }
}
