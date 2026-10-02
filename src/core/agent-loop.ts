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
      console.error('[!] MCP initialization failed, continuing without MCP');
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
        content: 'You are STRAK AGENT, a powerful AI assistant with access to 200+ tools and MCP servers. Help users accomplish their tasks efficiently.'
      });
    }

    // Main loop - No hard limit, agent works until task is complete
    let iterations = 0;
    const warningThreshold = 15; // Show warning after 15 iterations
    let lastToolCalls: string[] = [];
    let repeatCount = 0;

    while (true) { // Infinite loop - agent must complete the task!
      iterations++;

      // Show progress if taking long
      if (iterations > warningThreshold && ui) {
        ui.info(`Working hard on this (iteration ${iterations})...`);
      }

      // Detect if agent is stuck in a loop (same tools repeatedly)
      const currentToolCallsStr = JSON.stringify(lastToolCalls);
      
      // 1. Prepare LLM request with conversation history and tool definitions
      const request: LLMRequest = {
        model: this.config.model,
        messages: this.sessionManager.getMessages(),
        tools: this.toolExecutor.getRegistry().getEssentialToolDefinitions(),
        temperature: 0.7,
        maxTokens: 4096
      };

      // Add guidance if iterations are high
      if (iterations > 20) {
        request.messages = [
          {
            role: 'system',
            content: 'You have been working on this task for a while. Please finish it now with a final response. Do not use more tools unless absolutely necessary.'
          },
          ...request.messages
        ];
      }

      // 2. Call LLM
      if (ui) {
        ui.startThinking(`Deciding next action (step ${iterations})`);
      }
      
      const response = await this.llmRouter.chat(request);

      // 3. Check if LLM wants to use tools
      if (!response.toolCalls || response.toolCalls.length === 0) {
        // No tools requested, task is complete
        if (ui) {
          ui.stopThinking();
          if (iterations > warningThreshold) {
            ui.success(`Task completed after ${iterations} steps!`);
          }
        }
        
        this.sessionManager.addMessage({
          role: 'assistant',
          content: response.content
        });
        return response.content;
      }

      // Track tool calls for loop detection
      const currentTools = response.toolCalls.map(tc => tc.name);
      if (JSON.stringify(currentTools) === currentToolCallsStr) {
        repeatCount++;
        if (repeatCount > 3) {
          // Same tools called 3+ times in a row - force conclusion
          if (ui) {
            ui.stopThinking();
            ui.info('Finalizing response...');
          }
          
          const finalRequest: LLMRequest = {
            model: this.config.model,
            messages: [
              ...this.sessionManager.getMessages(),
              {
                role: 'system',
                content: 'Please provide a final answer now based on the information you have gathered. Do NOT use any more tools.'
              }
            ],
            temperature: 0.7,
            maxTokens: 4096
          };
          
          const finalResponse = await this.llmRouter.chat(finalRequest);
          this.sessionManager.addMessage({
            role: 'assistant',
            content: finalResponse.content
          });
          return finalResponse.content;
        }
      } else {
        repeatCount = 0;
      }
      lastToolCalls = currentTools;

      // 4. AI speaks about what it will do next
      if (ui && response.toolCalls.length > 0) {
        ui.stopThinking();
        
        if (response.toolCalls.length === 1) {
          const tool = response.toolCalls[0];
          ui.aiSpeaks(`I'll use the ${tool.name} tool to help with your request.`);
        } else {
          const toolNames = response.toolCalls.map(t => t.name).join(', ');
          ui.aiSpeaks(`I'll use multiple tools: ${toolNames}`);
        }
      }

      // 5. Execute each requested tool
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
      // No break - continue until LLM returns without tool calls
    }
  }
}
