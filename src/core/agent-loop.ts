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
   * Parse mind map nodes from text format
   */
  private parseMindMapNodes(content: string, userInput: string): any[] {
    const nodes: any[] = [];
    
    // Pattern: [NODE: type]\n...properties...\n[/NODE]
    const nodePattern = /\[NODE:\s*(\w+)\]([\s\S]*?)\[\/NODE\]/g;
    let match;
    
    while ((match = nodePattern.exec(content)) !== null) {
      const nodeType = match[1]; // root, child, etc.
      const propsBlock = match[2].trim();
      
      const node: any = {
        type: nodeType,
        title: '',
        description: '',
        status: 'planned',
        parent: 'root'
      };
      
      // Parse properties
      const propLines = propsBlock.split('\n');
      for (const line of propLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        const propMatch = trimmed.match(/^(\w+):\s*(.+)$/);
        if (propMatch) {
          const key = propMatch[1];
          let value = propMatch[2].trim();
          
          // Remove quotes
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          node[key] = value;
        }
      }
      
      nodes.push(node);
      console.log(`[MindMap] Node: ${node.title} (parent: ${node.parent})`);
    }
    
    return nodes;
  }

  /**
   * Parse text-based tool invocations from AI response
   * Format: [TOOL: tool_name]\nparam: value\n[/TOOL]
   */
  private parseTextBasedToolCalls(content: string): any[] {
    const toolCalls: any[] = [];
    
    // Pattern: [TOOL: tool_name]...params...[/TOOL]
    const toolPattern = /\[TOOL:\s*(\w+)\]([\s\S]*?)\[\/TOOL\]/g;
    let match;
    let callIndex = 0;
    
    while ((match = toolPattern.exec(content)) !== null) {
      const toolName = match[1];
      const paramsBlock = match[2].trim();
      
      // Parse parameters from the block
      const params: any = {};
      const paramLines = paramsBlock.split('\n');
      
      let currentKey: string | null = null;
      let currentValue: string[] = [];
      
      for (const line of paramLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
        
        // Parse "key: value" format
        const paramMatch = trimmed.match(/^(\w+):\s*(.*)$/);
        if (paramMatch) {
          // Save previous key-value if exists
          if (currentKey) {
            params[currentKey] = currentValue.join('\n').trim();
          }
          
          // Start new key-value
          currentKey = paramMatch[1];
          let value = paramMatch[2].trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          currentValue = [value];
        } else if (currentKey) {
          // Continuation of previous value (multiline)
          currentValue.push(trimmed);
        }
      }
      
      // Save last key-value
      if (currentKey) {
        params[currentKey] = currentValue.join('\n').trim();
      }
      
      toolCalls.push({
        id: `text_call_${callIndex++}`,
        name: toolName,
        args: params
      });
      
      console.log(`[TextTools] Parsed ${toolName}:`, JSON.stringify(params).substring(0, 150));
    }
    
    return toolCalls;
  }

  /**
   * Extract tool parameters from AI reasoning text (fallback when model doesn't provide args)
   */
  private extractToolParameters(toolName: string, reasoningText: string, userInput: string): any {
    const params: any = {};
    
    // Common patterns for different tools
    if (toolName === 'web_search') {
      // Extract search query from reasoning or user input
      // Pattern 1: Look for quoted text
      const quotedMatch = reasoningText.match(/"([^"]+)"/);
      if (quotedMatch) {
        params.query = quotedMatch[1];
      } else {
        // Pattern 2: Extract main topic from user input
        // Remove common command words
        const cleanInput = userInput
          .replace(/^(cari|search|find|lihat|check|cek)/i, '')
          .replace(/^(tentang|about|untuk|for)/i, '')
          .trim();
        
        if (cleanInput.length > 0 && cleanInput.length < 100) {
          params.query = cleanInput;
        } else {
          // Pattern 3: Use user input as-is (last resort)
          params.query = userInput.substring(0, 100);
        }
      }
    } else if (toolName === 'web_fetch') {
      // Extract URL
      const urlMatch = reasoningText.match(/https?:\/\/[^\s]+/) || userInput.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        params.url = urlMatch[0];
      }
    } else if (toolName === 'write_file' || toolName === 'write') {
      // Extract path from reasoning
      const pathMatch = reasoningText.match(/(?:file|path|to|di)\s+[`"]?([a-zA-Z0-9_\-./]+\.[a-z]+)[`"]?/i);
      if (pathMatch) {
        params.path = pathMatch[1];
      } else {
        // Try to extract from user input
        const inputPathMatch = userInput.match(/(?:di|to|file|path)\s+([a-zA-Z0-9_\-./]+\.[a-z]+)/i);
        if (inputPathMatch) {
          params.path = inputPathMatch[1];
        }
      }
      
      // Content is harder to extract - use placeholder
      if (params.path) {
        params.content = ''; // Will be filled by AI in next iteration
      }
    } else if (toolName === 'read_file' || toolName === 'read') {
      // Extract path
      const pathMatch = reasoningText.match(/(?:file|path|baca|read)\s+[`"]?([a-zA-Z0-9_\-./]+\.[a-z]+)[`"]?/i);
      if (pathMatch) {
        params.path = pathMatch[1];
      } else {
        const inputPathMatch = userInput.match(/[a-zA-Z0-9_\-./]+\.[a-z]+/);
        if (inputPathMatch) {
          params.path = inputPathMatch[0];
        }
      }
    } else if (toolName === 'terminal' || toolName === 'bash') {
      // Extract command
      const commandMatch = reasoningText.match(/`([^`]+)`/) || reasoningText.match(/command:?\s*(.+?)(?:\n|$)/i);
      if (commandMatch) {
        params.command = commandMatch[1].trim();
      } else {
        // Try common commands based on context
        if (userInput.match(/list|ls|lihat/i)) {
          params.command = 'ls -la';
        } else if (userInput.match(/check|cek|test/i)) {
          params.command = 'pwd';
        }
      }
    } else if (toolName === 'ls') {
      // Extract directory path
      const pathMatch = reasoningText.match(/(?:directory|folder|direktori)\s+[`"]?([a-zA-Z0-9_\-./]+)[`"]?/i);
      if (pathMatch) {
        params.path = pathMatch[1];
      } else {
        params.path = '.'; // Default to current directory
      }
    } else if (toolName === 'memory_save') {
      // Extract key and value
      const keyMatch = reasoningText.match(/(?:key|kunci):\s*[`"]?([a-zA-Z0-9_\-]+)[`"]?/i);
      const valueMatch = reasoningText.match(/(?:value|nilai):\s*[`"]?([^`"\n]+)[`"]?/i);
      
      if (keyMatch) params.key = keyMatch[1];
      if (valueMatch) params.value = valueMatch[1];
    } else if (toolName === 'memory_recall') {
      // Extract key (optional)
      const keyMatch = reasoningText.match(/(?:key|kunci):\s*[`"]?([a-zA-Z0-9_\-]+)[`"]?/i);
      if (keyMatch) params.key = keyMatch[1];
    }
    
    return params;
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
  async run(userInput: string, ui?: any, smartStructureEnabled: boolean = false): Promise<string> {
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

    // Smart Structure Planning Phase
    if (smartStructureEnabled) {
      const { structureThinking } = require('../features/structure-thinking');
      
      // Reset plan for new query
      structureThinking.resetPlan();
      
      // Create planning request with TEXT-BASED format
      const planningRequest: LLMRequest = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are STRAK AGENT in SMART STRUCTURE MODE. Create a MIND MAP plan.

FORMAT YOUR PLAN AS A MIND MAP:

[NODE: root]
title: Main Goal
description: Brief description of the main task
status: planned
[/NODE]

[NODE: child]
parent: root
title: Step 1 - Research
description: Search for information about X
tool: web_search
status: planned
[/NODE]

[NODE: child]
parent: root
title: Step 2 - Create Files
description: Write code files
tool: write_file
status: planned
[/NODE]

RULES:
1. Start with ONE root node (the main goal)
2. Add child nodes for each major step
3. Each node must have: title, description, status
4. Keep it SHORT and FOCUSED (max 8 nodes total)
5. Use clear, actionable titles

NOW CREATE MIND MAP for: ${userInput}`
          }
        ],
        temperature: 0.7,
        maxTokens: 2000,
        tools: undefined // No function calling for planning
      };
      
      try {
        if (ui) {
          ui.info('🧠 Smart Structure: Creating mind map plan...');
        }
        
        const planResponse = await this.llmRouter.chat(planningRequest);
        
        // Parse mind map nodes from response
        const nodes = this.parseMindMapNodes(planResponse.content || '', userInput);
        
        // Create plan structure
        const plan = structureThinking.createPlan(userInput);
        
        // Add nodes to plan
        if (nodes.length > 0) {
          console.log(`[MindMap] Created ${nodes.length} nodes`);
          
          // Add nodes to structure thinking
          for (const node of nodes) {
            if (node.parent) {
              try {
                structureThinking.addNode(node.parent, {
                  type: 'action',
                  title: node.title,
                  description: node.description,
                  status: 'planned',
                  metadata: { tool: node.tool }
                });
              } catch (e) {
                // Parent not found, add to root
                structureThinking.addNode('root', {
                  type: 'action',
                  title: node.title,
                  description: node.description,
                  status: 'planned',
                  metadata: { tool: node.tool }
                });
              }
            }
          }
        }
        
        // Display the plan
        if (ui && planResponse.content) {
          ui.aiReasoning(planResponse.content);
          
          // Show Smart Structure visualization info
          const serverUrl = 'http://localhost:3737';
          console.log(chalk.cyan('╔' + '═'.repeat(68) + '╗'));
          console.log(chalk.cyan('║') + chalk.yellow.bold(' 🧠 Mind Map Visualization') + ' '.repeat(42) + chalk.cyan('║'));
          console.log(chalk.cyan('╠' + '═'.repeat(68) + '╣'));
          console.log(chalk.cyan('║') + chalk.white(' Open in browser: ') + chalk.green.underline(serverUrl) + ' '.repeat(32) + chalk.cyan('║'));
          console.log(chalk.cyan('║') + ' '.repeat(68) + chalk.cyan('║'));
          console.log(chalk.cyan('║') + chalk.gray(' Watch the mind map update in real-time!') + ' '.repeat(28) + chalk.cyan('║'));
          console.log(chalk.cyan('╚' + '═'.repeat(68) + '╝'));
          console.log('');
        }
        
        // Add plan to conversation context
        this.sessionManager.addMessage({
          role: 'assistant',
          content: `[MIND MAP CREATED - ${nodes.length} nodes]\n${planResponse.content}\n\n[NOW EXECUTING PLAN]`
        });
      } catch (planError: any) {
        if (ui) {
          ui.warning(`Planning failed: ${planError.message}. Continuing without plan...`);
        }
        console.error('[Planning Error]', planError.stack || planError);
      }
    }

    // Add system message if first interaction
    const messages = this.sessionManager.getMessages();
    if (messages.length === 1) {
      this.sessionManager.addMessage({
        role: 'system',
        content: `You are STRAK AGENT, a powerful AI assistant with access to 200+ tools.

IMPORTANT: To use tools, write them in this TEXT FORMAT (NOT function calls):

[TOOL: tool_name]
parameter1: value1
parameter2: value2
[/TOOL]

EXAMPLES:

Search the web:
[TOOL: web_search]
query: latest Bitcoin price
[/TOOL]

Create a file with multiline content:
[TOOL: write_file]
path: poem.txt
content: Line 1 of poem
Line 2 of poem
Line 3 of poem
[/TOOL]

Read a file:
[TOOL: read_file]
path: config.json
[/TOOL]

Run terminal command:
[TOOL: terminal]
command: ls -la
[/TOOL]

MULTILINE CONTENT:
For parameters with multiple lines (like 'content'), just continue on next lines without adding another "content:" prefix.

Example CORRECT:
[TOOL: write_file]
path: test.txt
content: First line
Second line
Third line
[/TOOL]

Example WRONG:
[TOOL: write_file]
path: test.txt
content: First line
content: Second line  ❌ Don't repeat parameter name
[/TOOL]

RULES:
1. Always use [TOOL: name] format to invoke tools
2. Put each parameter on a new line with "param: value" format
3. For multiline values, just continue on next lines
4. Close with [/TOOL]
5. You can use multiple tools in one response
6. Explain your reasoning BEFORE the tool invocations

AVAILABLE TOOLS CATEGORIES:
- Filesystem: read_file, write_file, read, write, ls, etc.
- Terminal: terminal, bash
- Web: web_search, web_fetch
- Memory: memory_save, memory_recall
- Canvas: canvas_present, canvas_snapshot, canvas_eval
- And 188 more tools across 15 categories

When you need a tool from a category, use list_category_tools or get_tool_info to discover available tools.

Be efficient and only use necessary tools. Explain your thought process.`
      });
    }

    // Main loop - No hard limit, agent works until task is complete
    let iterations = 0;
    const warningThreshold = 15; // Show warning after 15 iterations
    let lastToolCalls: string[] = [];
    let repeatCount = 0;
    
    // Disable function calling for DeepSeek - use text-based tool invocation instead
    const useTextBasedTools = true;

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
        tools: useTextBasedTools ? undefined : this.toolExecutor.getRegistry().getEssentialToolDefinitions(), // Disable function calling
        temperature: 0.7,
        maxTokens: 8000 // Increased from 4096 to prevent truncation
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
            content: 'If you already have sufficient information to answer the user\'s question, provide your response now WITHOUT using [TOOL] tags. Only use additional tools if the current information is incomplete or insufficient.'
          },
          ...request.messages
        ];
      } else if (iterations === 1 && !smartStructureEnabled) {
        // First iteration without planning - encourage thinking before tools
        request.messages = [
          {
            role: 'system',
            content: 'Explain your reasoning briefly before using tools. After tools execute, provide your final answer without using more tools unless necessary.'
          },
          ...request.messages
        ];
      }

      // 2. Call LLM
      if (ui) {
        ui.startThinking(`Deciding next action (step ${iterations})`);
      }
      
      const response = await this.llmRouter.chat(request);

      // 3. Parse text-based tool invocations if function calling disabled
      let parsedToolCalls: any[] = [];
      
      if (useTextBasedTools && response.content) {
        parsedToolCalls = this.parseTextBasedToolCalls(response.content);
        
        if (parsedToolCalls.length > 0) {
          console.log(`[TextTools] Parsed ${parsedToolCalls.length} tool invocations from text`);
          
          // Convert to standard tool call format
          response.toolCalls = parsedToolCalls;
          
          // Remove [TOOL] tags from content for display
          response.content = response.content.replace(/\[TOOL:[\s\S]*?\[\/TOOL\]/g, '').trim();
        }
      }

      // 3. Check if LLM wants to use tools
      if (!response.toolCalls || response.toolCalls.length === 0) {
        // No tools requested, check if we have content
        if (!response.content || response.content.trim() === '') {
          // Empty response - something went wrong
          console.error('[Agent] Received empty response from LLM at iteration', iterations);
          console.error('[Agent] Response object:', JSON.stringify({
            content: response.content,
            finishReason: response.finishReason,
            toolCalls: response.toolCalls
          }));
          
          if (iterations === 1) {
            // First iteration with empty response - LLM might not understand format
            if (ui) {
              ui.stopThinking();
              ui.warning('Received empty response, trying again with simpler prompt...');
            }
            
            // Try again with ultra-simple prompt
            const retryRequest: LLMRequest = {
              model: this.config.model,
              messages: [
                {
                  role: 'system',
                  content: 'You are a helpful AI assistant. Respond naturally to the user in their language.'
                },
                {
                  role: 'user',
                  content: userInput
                }
              ],
              temperature: 0.7,
              maxTokens: 4096,
              tools: undefined // No tools for retry
            };
            
            const retryResponse = await this.llmRouter.chat(retryRequest);
            
            if (ui) {
              ui.stopThinking();
            }
            
            const content = retryResponse.content || 'I apologize, but I was unable to process your request. Please try rephrasing your question.';
            
            this.sessionManager.addMessage({
              role: 'assistant',
              content: content
            });
            
            return content;
          } else if (iterations > 1) {
            // We've done some work, ask for summary
            if (ui) {
              ui.info('Requesting final summary from AI...');
            }
            
            const finalRequest: LLMRequest = {
              model: this.config.model,
              messages: [
                ...this.sessionManager.getMessages(),
                {
                  role: 'system',
                  content: 'Please provide a brief summary or answer based on the work completed so far. Respond naturally without using [TOOL] tags.'
                }
              ],
              temperature: 0.7,
              maxTokens: 4096,
              tools: undefined
            };
            
            const finalResponse = await this.llmRouter.chat(finalRequest);
            
            if (ui) {
              ui.stopThinking();
            }
            
            const content = finalResponse.content || 'Task completed.';
            
            this.sessionManager.addMessage({
              role: 'assistant',
              content: content
            });
            
            return content;
          }
        }
        
        // Task is complete with content
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

      // 3.5. FALLBACK: Handle empty arguments by extracting from reasoning text
      const hasEmptyArgs = response.toolCalls.some(tc => !tc.args || Object.keys(tc.args).length === 0);
      if (hasEmptyArgs && response.content) {
        if (ui) {
          ui.info('[Fallback] Detecting missing tool parameters from AI reasoning...');
        }
        
        // Try to extract parameters from reasoning text
        for (const toolCall of response.toolCalls) {
          if (!toolCall.args || Object.keys(toolCall.args).length === 0) {
            toolCall.args = this.extractToolParameters(toolCall.name, response.content, userInput);
            
            if (Object.keys(toolCall.args).length > 0) {
              console.log(`[Fallback] ✓ Extracted parameters for ${toolCall.name}:`, JSON.stringify(toolCall.args));
            } else {
              console.warn(`[Fallback] ⚠️  Could not extract parameters for ${toolCall.name}`);
              
              // Last resort: ask AI to provide parameters via text
              if (ui) {
                ui.info(`[Fallback] Tool ${toolCall.name} needs parameters but none could be extracted.`);
              }
            }
          }
        }
      }

      // Track tool calls for loop detection
      const currentTools = response.toolCalls.map(tc => tc.name);
      if (JSON.stringify(currentTools) === currentToolCallsStr) {
        repeatCount++;
        console.warn(`[Loop Detection] Repeated same tools ${repeatCount} times: ${currentTools.join(', ')}`);
        
        if (repeatCount >= 2) {
          // Same tools called 2+ times in a row - STOP and report issue
          if (ui) {
            ui.stopThinking();
            ui.error('Agent stuck in loop - stopping execution');
          }
          
          const errorMessage = `I apologize, but I encountered a technical issue and got stuck in a loop while processing your request.

**Issue Details:**
- Repeated tools: ${currentTools.join(', ')}
- Iterations: ${repeatCount + 1} times

This appears to be a bug in the system. Please report this issue to:
📧 **ambatukam.bleww@gmail.com**

Include in your report:
- Your query: "${userInput}"
- Tools that looped: ${currentTools.join(', ')}
- Timestamp: ${new Date().toISOString()}

Thank you for your patience!`;
          
          this.sessionManager.addMessage({
            role: 'assistant',
            content: errorMessage
          });
          
          return errorMessage;
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
      
      // Track tool execution for Smart Structure
      const { structureThinking } = require('../features/structure-thinking');
      const isSmartStructureActive = structureThinking.isEnabled() && structureThinking.getCurrentPlan();
      
      // Execute all tools in parallel using Promise.all
      const toolPromises = response.toolCalls.map(async (toolCall) => {
        try {
          // Update status to in-progress if Smart Structure is active
          if (isSmartStructureActive) {
            // Find node by tool name and update status
            const plan = structureThinking.getCurrentPlan();
            if (plan && plan.history) {
              const node = plan.history.find((n: any) => n.title.includes(toolCall.name));
              if (node) {
                structureThinking.updateNodeStatus(node.id, 'in-progress');
              }
            }
          }
          
          const result = await this.toolExecutor.execute(toolCall.name, toolCall.args);
          
          // Update status to completed if Smart Structure is active
          if (isSmartStructureActive) {
            const plan = structureThinking.getCurrentPlan();
            if (plan && plan.history) {
              const node = plan.history.find((n: any) => n.title.includes(toolCall.name));
              if (node) {
                structureThinking.updateNodeStatus(node.id, 'completed');
              }
            }
          }
          
          return {
            role: 'tool' as const,
            toolCallId: toolCall.id,
            content: result
          };
        } catch (error: any) {
          // Update status to failed if Smart Structure is active
          if (isSmartStructureActive) {
            const plan = structureThinking.getCurrentPlan();
            if (plan && plan.history) {
              const node = plan.history.find((n: any) => n.title.includes(toolCall.name));
              if (node) {
                structureThinking.updateNodeStatus(node.id, 'failed');
              }
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
