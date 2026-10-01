/**
 * Agent Loop (Core Claude Code Logic)
 * Main loop for agent execution
 */

import { SessionManager } from './session';
import { LLMRouter } from './llm-router';
import { ToolExecutor } from '../tools/executor';
import { Config, Message, LLMRequest } from '../types';
import { MCPInitializer } from '../mcp/initializer';

export class AgentLoop {
  private sessionManager: SessionManager;
  private llmRouter: LLMRouter;
  private toolExecutor: ToolExecutor;
  private config: Config;
  private mcpInitializer: MCPInitializer;

  constructor(config: Config, sessionManager: SessionManager) {
    this.config = config;
    this.sessionManager = sessionManager;
    this.llmRouter = new LLMRouter(config);
    this.toolExecutor = new ToolExecutor();
    this.mcpInitializer = new MCPInitializer();
    
    // Initialize MCP servers
    this.initializeMCP();
  }

  /**
   * Set UI instance for better display
   */
  setUI(ui: any): void {
    this.toolExecutor.setUI(ui);
  }

  /**
   * Initialize MCP servers asynchronously
   */
  private async initializeMCP(): Promise<void> {
    try {
      await this.mcpInitializer.initialize();
    } catch (error) {
      console.error('⚠️  MCP initialization failed, continuing without MCP');
    }
  }

  /**
   * Main agent loop
   */
  async run(userInput: string, ui?: any): Promise<string> {
    // Set UI if provided
    if (ui) {
      this.setUI(ui);
      ui.startThinking('Processing your request');
    }
    
    // Add user message to session
    this.sessionManager.addMessage({
      role: 'user',
      content: userInput
    });

    // Add system message if first interaction
    const messages = this.sessionManager.getMessages();
    if (messages.length === 1) {
      this.sessionManager.addMessage({
        role: 'system',
        content: 'You are Strak, a powerful AI assistant with access to 200+ tools and MCP servers. Help users accomplish their tasks efficiently.'
      });
    }

    // Main loop
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (iterations < maxIterations) {
      iterations++;

      // 1. Prepare LLM request with conversation history and tool definitions
      const request: LLMRequest = {
        model: this.config.model,
        messages: this.sessionManager.getMessages(),
        tools: this.toolExecutor.getRegistry().getEssentialToolDefinitions(),
        temperature: 0.7,
        maxTokens: 4096
      };

      // 2. Call LLM
      const response = await this.llmRouter.chat(request);

      // 3. Check if LLM wants to use tools
      if (!response.toolCalls || response.toolCalls.length === 0) {
        // No tools requested, task is complete
        this.sessionManager.addMessage({
          role: 'assistant',
          content: response.content
        });
        return response.content;
      }

      // 4. Execute each requested tool
      const toolResults: Message[] = [];
      
      for (const toolCall of response.toolCalls) {
        try {
          // Execute tool
          const result = await this.toolExecutor.execute(toolCall.name, toolCall.args);
          
          // Store tool result
          toolResults.push({
            role: 'tool',
            toolCallId: toolCall.id,
            content: result
          });
        } catch (error: any) {
          toolResults.push({
            role: 'tool',
            toolCallId: toolCall.id,
            content: `Error: ${error.message}`
          });
        }
      }

      // 5. Add assistant message with tool calls
      this.sessionManager.addMessage({
        role: 'assistant',
        content: response.content || '',
        toolCalls: response.toolCalls
      });

      // 6. Add all tool results
      for (const toolResult of toolResults) {
        this.sessionManager.addMessage(toolResult);
      }

      // 7. Loop back to call LLM again with tool results
    }

    // Max iterations reached
    return 'Task execution took too many iterations. Please try breaking down your request into smaller tasks.';
  }
}
