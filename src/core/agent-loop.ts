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
   * Request user approval for tool execution
   */
  private async requestToolApproval(toolCalls: any[], ui: any): Promise<boolean> {
    const inquirer = require('inquirer');
    const chalk = require('chalk');
    
    console.log('');
    console.log(chalk.yellow('Do you want to proceed?'));
    
    const choices = [
      { name: chalk.green('1. Yes, allow tools to execute'), value: 'yes' },
      { name: chalk.green('2. Yes, and always allow from this session'), value: 'always' },
      { name: chalk.red('3. No, cancel immediately'), value: 'no' }
    ];
    
    const { approval } = await inquirer.prompt([
      {
        type: 'list',
        name: 'approval',
        message: '',
        choices: choices,
        prefix: chalk.cyan(')')
      }
    ]);
    
    if (approval === 'always') {
      // Store in config or session that user wants auto-approve
      this.config.autoApproveTools = true;
      console.log(chalk.green('\n  [OK] Auto-approval enabled for this session\n'));
      return true;
    }
    
    if (approval === 'no') {
      console.log(chalk.red('\n  [CANCELLED] Tool execution cancelled\n'));
      return false;
    }
    
    console.log(chalk.green('\n  [OK] Proceeding with tool execution\n'));
    return true;
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

      // 4. Request approval for tool execution
      if (ui && response.toolCalls.length > 0) {
        ui.stopThinking();
        
        // Show what tools will be executed
        if (response.toolCalls.length === 1) {
          const tool = response.toolCalls[0];
          ui.aiSpeaks(`I want to use the ${tool.name} tool`);
        } else {
          const toolNames = response.toolCalls.map(t => t.name).join(', ');
          ui.aiSpeaks(`I want to use ${response.toolCalls.length} tools: ${toolNames}`);
        }

        // Ask for permission (skip if auto-approved)
        if (!this.config.autoApproveTools) {
          const approved = await this.requestToolApproval(response.toolCalls, ui);
          
          if (!approved) {
            // User denied - ask AI to respond without tools
            if (ui) {
              ui.info('Tool execution denied by user. Asking AI to respond without tools...');
            }
            
            const noToolRequest: LLMRequest = {
              model: this.config.model,
              messages: [
                ...this.sessionManager.getMessages(),
                {
                  role: 'system',
                  content: 'The user did not approve tool usage. Please provide a response based only on your existing knowledge without using any tools.'
                }
              ],
              temperature: 0.7,
              maxTokens: 4096
            };
            
            const noToolResponse = await this.llmRouter.chat(noToolRequest);
            this.sessionManager.addMessage({
              role: 'assistant',
              content: noToolResponse.content
            });
            return noToolResponse.content;
          }
        } else {
          ui.info('[Auto-approved] Executing tools...');
        }
      }

      // 5. Execute tools in parallel for better performance
      const toolResults: Message[] = [];
      
      if (ui) {
        ui.info(`Executing ${response.toolCalls.length} tool(s) in parallel...`);
      }
      
      // Execute all tools in parallel using Promise.all
      const toolPromises = response.toolCalls.map(async (toolCall) => {
        try {
          const result = await this.toolExecutor.execute(toolCall.name, toolCall.args);
          return {
            role: 'tool' as const,
            toolCallId: toolCall.id,
            content: result
          };
        } catch (error: any) {
          return {
            role: 'tool' as const,
            toolCallId: toolCall.id,
            content: `Error: ${error.message}`
          };
        }
      });
      
      // Wait for all tools to complete
      const results = await Promise.all(toolPromises);
      toolResults.push(...results);

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
