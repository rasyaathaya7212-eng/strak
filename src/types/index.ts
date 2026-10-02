/**
 * Core types for STRAK AGENT
 */

import { z } from 'zod';

// Configuration Schema
export const ConfigSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().url(),
  model: z.string()
});

export type Config = z.infer<typeof ConfigSchema>;

// Message Types
export type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

// Tool Types
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: z.ZodObject<any> | Record<string, any>;
  handler: (args: any) => Promise<string>;
  category?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  result: string;
  error?: string;
}

// Session Types
export interface Session {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// LLM Types
export interface LLMRequest {
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason?: string;
}
