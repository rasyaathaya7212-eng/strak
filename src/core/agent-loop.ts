/**
 * Agent Loop (Core Claude Code Logic)
 * Main loop for agent execution
 */

import { SessionManager } from './session';
import { LLMRouter } from './llm-router';
import { ToolExecutor } from '../tools/executor';
import { Config, Message, LLMRequest } from '../types';
import { MCPInitializer } from '../mcp/initializer';
import chalk from 'chalk';

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
    
    // Show detailed tool info
    console.log('');
    console.log(chalk.cyan('─'.repeat(70)));
    console.log(chalk.yellow.bold('STRAK AGENT wants to execute tools:'));
    console.log(chalk.cyan('─'.repeat(70)));
    
    toolCalls.forEach((tool, idx) => {
      console.log(chalk.white(`  ${idx + 1}. ${chalk.cyan.bold(tool.name)}`));
      
      // Show arguments compactly
      const args = Object.entries(tool.args);
      if (args.length > 0) {
        args.forEach(([key, value]) => {
          const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
          const display = valueStr.length > 50 ? valueStr.substring(0, 50) + '...' : valueStr;
          console.log(chalk.gray(`     ${key}: `) + chalk.white(display));
        });
      }
    });
    
    console.log(chalk.cyan('─'.repeat(70)));
    console.log('');
    console.log(chalk.yellow('Do you want to proceed?'));
    
    const choices = [
      { name: chalk.green('1. Yes, allow STRAK to execute these tools'), value: 'yes' },
      { name: chalk.green('2. Yes, and always allow tools from this session'), value: 'always' },
      { name: chalk.red('3. No, cease immediately'), value: 'no' }
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
    
    console.log('');
    
    if (approval === 'always') {
      this.config.autoApproveTools = true;
      console.log(chalk.green('  [AUTO-APPROVE ENABLED] All tools will be executed without asking\n'));
      return true;
    }
    
    if (approval === 'no') {
      console.log(chalk.red('  [CANCELLED] Tool execution cancelled by user\n'));
      return false;
    }
    
    console.log(chalk.green('  [APPROVED] Executing tools...\n'));
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
        content: `You are STRAK AGENT, a powerful AI assistant with access to 200+ tools and MCP servers.

IMPORTANT RULES:
1. Be EFFICIENT - only use tools when absolutely necessary
2. If you get good results from initial tools, STOP and provide the answer
3. Don't keep searching or fetching if you already have sufficient information
4. Quality over quantity - 1-2 good sources are better than 10 mediocre ones
5. If a tool fails, try ONE alternative approach, then move on
6. Prioritize using the minimum number of tools to answer the question

COMMUNICATION STYLE:
When you plan to use tools, ALWAYS explain your reasoning first:
- WHY you need these specific tools
- WHAT information you're looking for
- HOW this will help answer the user's question

Example GOOD response:
"To find the current XAU/USD price, I need to search multiple reliable sources because gold prices change frequently. I'll search financial websites and then fetch detailed data from the most authoritative source."

Example BAD response:
"I'll use web_search and web_fetch tools."

Help users accomplish their tasks efficiently while explaining your thought process.`
      });
    }

    // SMART STRUCTURE MODE: Create plan first before executing tools
    if (ui && ui.isSmartStructureEnabled()) {
      const { structureThinking } = require('../features/structure-thinking');
      
      if (!structureThinking.getCurrentPlan()) {
        // Planning phase - AI must create detailed plan WITHOUT executing tools
        if (ui) {
          ui.stopThinking();
          ui.info('🧠 SMART STRUCTURE MODE: Creating execution plan...');
        }
        
        const planningRequest: LLMRequest = {
          model: this.config.model,
          messages: [
            ...this.sessionManager.getMessages(),
            {
              role: 'system',
              content: `SMART STRUCTURE MODE - PLANNING PHASE

You MUST create a SHORT execution plan (max 5 steps) BEFORE using any tools.

FORMAT (keep it concise):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 MAIN GOAL: [1 sentence description]

🔹 STEP 1: [Step name]
   → Action: [tool name]
   → Expected: [brief result]

🔹 STEP 2: [Step name]
   → Action: [tool name]
   → Expected: [brief result]

(max 5 steps)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT:
- Keep each step to 1-2 lines ONLY
- Do NOT write long explanations
- Do NOT execute any tools yet
- Maximum 5 steps total
- Be concise and direct`
            }
          ],
          temperature: 0.7,
          maxTokens: 1500  // Limit tokens for planning
        };
        
        try {
          const planResponse = await this.llmRouter.chat(planningRequest);
          
          // Display the plan
          if (ui) {
            ui.stopThinking();
            ui.aiReasoning(planResponse.content);
          }
          
          // Parse plan and create structure
          const plan = structureThinking.createPlan(userInput);
          
          // Parse steps from AI response
          const stepMatches = planResponse.content.match(/🔹 STEP \d+: (.+?)(?=🔹 STEP|━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━|$)/gs);
          if (stepMatches) {
            stepMatches.forEach((stepText, idx) => {
              const titleMatch = stepText.match(/🔹 STEP \d+: (.+?)[\n\r]/);
              const actionMatch = stepText.match(/→ Action: (.+?)[\n\r]/);
              const expectedMatch = stepText.match(/→ Expected: (.+?)[\n\r]/);
              
              if (titleMatch) {
                const title = titleMatch[1].trim();
                const action = actionMatch ? actionMatch[1].trim() : '';
                const expected = expectedMatch ? expectedMatch[1].trim() : '';
                
                structureThinking.addNode('root', {
                  type: 'subtask',
                  title: title,
                  description: `${action}\nExpected: ${expected}`,
                  status: 'planned'
                });
              }
            });
          }
          
          // Display localhost URL
          console.log('');
          console.log(chalk.green('╔' + '═'.repeat(68) + '╗'));
          console.log(chalk.green('║') + chalk.white.bold(' 🧠 Smart Structure Visualization') + ' '.repeat(34) + chalk.green('║'));
          console.log(chalk.green('╠' + '═'.repeat(68) + '╣'));
          console.log(chalk.green('║') + chalk.white(' Open in browser: ') + chalk.cyan.bold(`http://localhost:${structureThinking['port']}`) + ' '.repeat(68 - 18 - `http://localhost:${structureThinking['port']}`.length) + chalk.green('║'));
          console.log(chalk.green('║') + ' '.repeat(68) + chalk.green('║'));
          console.log(chalk.green('║') + chalk.gray(' The plan will update in real-time as AI executes tools') + ' '.repeat(13) + chalk.green('║'));
          console.log(chalk.green('╚' + '═'.repeat(68) + '╝'));
          console.log('');
          
          // Add plan to session
          this.sessionManager.addMessage({
            role: 'assistant',
            content: planResponse.content
          });
        } catch (error: any) {
          // If planning fails, disable smart structure and continue normally
          if (ui) {
            ui.stopThinking();
            ui.error(`Planning failed: ${error.message}`);
            ui.info('Continuing without Smart Structure mode...');
          }
          
          const { structureThinking } = require('../features/structure-thinking');
          structureThinking.disable();
        }
        
        // Continue to execution phase...
      }
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
      } else if (iterations > 2) {
        // After 2 iterations, encourage AI to stop if it has enough info
        request.messages = [
          {
            role: 'system',
            content: 'If you already have sufficient information to answer the user\'s question, provide your response now. Only use additional tools if the current information is incomplete or insufficient.'
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
        
        // Display AI's reasoning if provided in response.content
        if (response.content && response.content.trim()) {
          ui.aiReasoning(response.content);
        }
        
        // Show what tools will be executed
        if (response.toolCalls.length === 1) {
          const tool = response.toolCalls[0];
          ui.aiSpeaks(`Planning to use: ${tool.name}`);
        } else {
          const toolNames = response.toolCalls.map(t => t.name).join(', ');
          ui.aiSpeaks(`Planning to use ${response.toolCalls.length} tools: ${toolNames}`);
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
      const toolPromises = response.toolCalls.map(async (toolCall, idx) => {
        try {
          // Update plan status if smart structure enabled
          if (ui && ui.isSmartStructureEnabled()) {
            const { structureThinking } = require('../features/structure-thinking');
            const plan = structureThinking.getCurrentPlan();
            if (plan && plan.history[idx]) {
              structureThinking.updateNodeStatus(plan.history[idx].id, 'in-progress');
            }
          }
          
          const result = await this.toolExecutor.execute(toolCall.name, toolCall.args);
          
          // Mark as completed
          if (ui && ui.isSmartStructureEnabled()) {
            const { structureThinking } = require('../features/structure-thinking');
            const plan = structureThinking.getCurrentPlan();
            if (plan && plan.history[idx]) {
              structureThinking.updateNodeStatus(plan.history[idx].id, 'completed');
            }
          }
          
          return {
            role: 'tool' as const,
            toolCallId: toolCall.id,
            content: result
          };
        } catch (error: any) {
          // Mark as failed
          if (ui && ui.isSmartStructureEnabled()) {
            const { structureThinking } = require('../features/structure-thinking');
            const plan = structureThinking.getCurrentPlan();
            if (plan && plan.history[idx]) {
              structureThinking.updateNodeStatus(plan.history[idx].id, 'failed');
            }
          }
          
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
