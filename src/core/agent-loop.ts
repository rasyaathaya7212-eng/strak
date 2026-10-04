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
            content: `You are STRAK AGENT in SMART STRUCTURE MODE. Create a BRIEF MIND MAP plan.

FORMAT YOUR PLAN AS A MIND MAP (KEEP IT SHORT!):

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

CRITICAL RULES:
1. Keep plan VERY SHORT - maximum 5 nodes total
2. Each node: title, description, status (all required)
3. Focus on HIGH-LEVEL steps only
4. NO detailed explanations or code in the plan
5. Use simple, clear language

NOW CREATE BRIEF MIND MAP for: ${userInput}`
          }
        ],
        temperature: 0.5,
        maxTokens: 1000, // Short plan only!
        tools: undefined
      };
      
      try {
        if (ui) {
          ui.info('🧠 Smart Structure: Creating mind map plan...');
        }
        
        const planResponse = await this.llmRouter.chat(planningRequest);
        
        if (!planResponse || !planResponse.content) {
          console.warn('[Planning] Empty response from planning request');
          if (ui) {
            ui.info('[Warning] Planning failed, continuing without plan...');
          }
        } else {
          // Parse mind map nodes from response
          const nodes = this.parseMindMapNodes(planResponse.content, userInput);
          
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
            console.log(chalk.cyan('║') + chalk.yellow.bold(' 🧠 Mind Map Created') + ' '.repeat(47) + chalk.cyan('║'));
            console.log(chalk.cyan('╠' + '═'.repeat(68) + '╣'));
            console.log(chalk.cyan('║') + chalk.white(' View at: ') + chalk.green.underline(serverUrl) + ' '.repeat(38) + chalk.cyan('║'));
            console.log(chalk.cyan('║') + chalk.gray(' Now executing the plan...') + ' '.repeat(43) + chalk.cyan('║'));
            console.log(chalk.cyan('╚' + '═'.repeat(68) + '╝'));
            console.log('');
          }
        }
      } catch (planError: any) {
        if (ui) {
          ui.info(`[Warning] Planning failed: ${planError.message}. Continuing without plan...`);
        }
        console.error('[Planning Error]', planError.message);
      }
    }

    // Add system message if first interaction
    const messages = this.sessionManager.getMessages();
    if (messages.length === 1 || (messages.length === 2 && smartStructureEnabled)) {
      // If Smart Structure enabled and we just added user message, add clear instruction
      const systemContent = smartStructureEnabled 
        ? `You are STRAK AGENT. Execute the plan that was created.

═══════════════════════════════════════════════
TOOL FORMAT - THIS IS THE ONLY WAY TO USE TOOLS:
═══════════════════════════════════════════════

[TOOL: tool_name]
parameter_name: parameter_value
[/TOOL]

THAT'S IT! Just write [TOOL: name], then parameters, then [/TOOL]

═══════════════════════════════════════════════
EXAMPLES:
═══════════════════════════════════════════════

Example 1 - Create a file:
[TOOL: write_file]
path: game.html
content: <!DOCTYPE html>
<html>
<body>Hello World</body>
</html>
[/TOOL]

Example 2 - Read a file:
[TOOL: read_file]
path: config.json
[/TOOL]

Example 3 - Search the web:
[TOOL: web_search]
query: latest news about AI
[/TOOL]

Example 4 - Run command:
[TOOL: terminal]
command: ls -la
[/TOOL]

═══════════════════════════════════════════════
FOR LARGE FILES - SPLIT THEM:
═══════════════════════════════════════════════

Don't create huge files. Split into multiple small files:

[TOOL: write_file]
path: index.html
content: <!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="style.css">
</head>
<body>
<script src="script.js"></script>
</body>
</html>
[/TOOL]

[TOOL: write_file]
path: style.css
content: body { margin: 0; }
[/TOOL]

[TOOL: write_file]
path: script.js
content: console.log('Hello');
[/TOOL]

NOW START EXECUTING!`
        : `You are STRAK AGENT with 200+ tools available.

═══════════════════════════════════════════════
TOOL FORMAT - THIS IS THE ONLY WAY TO USE TOOLS:
═══════════════════════════════════════════════

[TOOL: tool_name]
parameter_name: parameter_value
[/TOOL]

THAT'S IT! Just write [TOOL: name], then parameters, then [/TOOL]

═══════════════════════════════════════════════
EXAMPLES OF CORRECT FORMAT:
═══════════════════════════════════════════════

1. CREATE FILE:
[TOOL: write_file]
path: myfile.html
content: <!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello</h1></body>
</html>
[/TOOL]

2. READ FILE:
[TOOL: read_file]
path: myfile.html
[/TOOL]

3. SEARCH WEB:
[TOOL: web_search]
query: what is the weather today
[/TOOL]

4. GET URL CONTENT:
[TOOL: web_fetch]
url: https://example.com
[/TOOL]

5. RUN COMMAND:
[TOOL: terminal]
command: pwd
[/TOOL]

6. LIST FILES:
[TOOL: ls]
path: .
[/TOOL]

═══════════════════════════════════════════════
MULTILINE CONTENT (like HTML/code):
═══════════════════════════════════════════════

Just keep writing after "content:", don't repeat "content:" again:

[TOOL: write_file]
path: game.html
content: <!DOCTYPE html>
<html>
<head>
<title>Game</title>
<style>
body { background: black; }
canvas { display: block; }
</style>
</head>
<body>
<canvas id="game"></canvas>
<script>
const canvas = document.getElementById('game');
// more code here...
</script>
</body>
</html>
[/TOOL]

═══════════════════════════════════════════════
IMPORTANT - SPLIT LARGE FILES:
═══════════════════════════════════════════════

Don't make files bigger than 400 lines!
Split HTML/CSS/JS into separate files:

[TOOL: write_file]
path: index.html
content: <!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>My Website</h1>
<script src="script.js"></script>
</body>
</html>
[/TOOL]

[TOOL: write_file]
path: style.css
content: body {
  margin: 0;
  font-family: Arial;
}
h1 { color: blue; }
[/TOOL]

[TOOL: write_file]
path: script.js
content: document.querySelector('h1').addEventListener('click', () => {
  alert('Hello!');
});
[/TOOL]

═══════════════════════════════════════════════
READY! Start working now.
═══════════════════════════════════════════════`;

      this.sessionManager.addMessage({
        role: 'system',
        content: systemContent
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
        // CRITICAL: Detect WRONG FORMAT (but exclude content inside [TOOL] tags)
        // Remove all [TOOL]...[/TOOL] blocks first, then check for forbidden formats
        const contentWithoutTools = response.content.replace(/\[TOOL:[\s\S]*?\[\/TOOL\]/g, '');
        
        const hasWrongFormat = contentWithoutTools.includes('<｜｜DSML｜｜') || 
                               contentWithoutTools.includes('function_calls>') ||
                               contentWithoutTools.includes('invoke name="') ||
                               contentWithoutTools.includes('<function_calls>');
        
        if (hasWrongFormat) {
          console.error('[TextTools] ❌ DETECTED WRONG FORMAT! AI using forbidden format OUTSIDE tool content.');
          console.error('[TextTools] Wrong format found in:', contentWithoutTools.substring(0, 300));
          
          if (ui) {
            ui.info('[Warning] AI using wrong format. Forcing correction...');
          }
          
          // Force retry with ULTRA-STRICT prompt
          const strictRequest: LLMRequest = {
            model: this.config.model,
            messages: [
              ...this.sessionManager.getMessages(),
              {
                role: 'system',
                content: `❌ ERROR! You used the WRONG format!

YOU MUST USE THIS EXACT FORMAT (nothing else!):

[TOOL: tool_name]
param: value
[/TOOL]

EXAMPLE - Read file:
[TOOL: read_file]
path: hast.html
[/TOOL]

EXAMPLE - Write file:
[TOOL: write_file]
path: test.txt
content: Hello World
[/TOOL]

DO NOT USE:
✗ <｜｜DSML｜｜>
✗ <invoke>
✗ <function_calls>
✗ <function_calls>
✗ {function: {name: "tool"}}

ONLY USE:
✓ [TOOL: name]
param: value
[/TOOL]

NOW TRY AGAIN WITH CORRECT FORMAT!`
              }
            ],
            temperature: 0.3, // Lower temperature for more consistent formatting
            maxTokens: 8000,
            tools: undefined
          };
          
          const retryResponse = await this.llmRouter.chat(strictRequest);
          
          // Check retry response
          if (retryResponse.content) {
            const contentWithoutToolsRetry = retryResponse.content.replace(/\[TOOL:[\s\S]*?\[\/TOOL\]/g, '');
            const stillWrong = contentWithoutToolsRetry.includes('<｜｜DSML｜｜') || 
                              contentWithoutToolsRetry.includes('function_calls>') ||
                              contentWithoutToolsRetry.includes('invoke name="') ||
                              contentWithoutToolsRetry.includes('<function_calls>');
            
            if (stillWrong) {
              // AI still using wrong format after correction - show error to user
              if (ui) {
                ui.stopThinking();
                ui.error('⚠️  AI repeatedly using wrong format - model may not support text-based tools');
              }
              
              const errorMsg = `I apologize, but I'm having difficulty using the correct tool format.

This may be a compatibility issue with the model. Please try:
1. Using a different model (e.g., Claude, GPT-4)
2. Simplifying your request
3. Reporting this to: ambatukam.bleww@gmail.com

Model: ${this.config.model}
Format error: Model keeps using forbidden XML/DSML format instead of [TOOL:] format`;
              
              this.sessionManager.addMessage({
                role: 'assistant',
                content: errorMsg
              });
              
              return errorMsg;
            } else {
              // Retry succeeded, use new response
              response.content = retryResponse.content;
            }
          }
        }
        
        parsedToolCalls = this.parseTextBasedToolCalls(response.content);
        
        if (parsedToolCalls.length > 0) {
          console.log(`[TextTools] Parsed ${parsedToolCalls.length} tool invocations from text`);
          
          // Convert to standard tool call format
          response.toolCalls = parsedToolCalls;
          
          // Remove [TOOL] tags from content for display
          response.content = response.content.replace(/\[TOOL:[\s\S]*?\[\/TOOL\]/g, '').trim();
        } else {
          // Check if there's incomplete [TOOL] tag (response was truncated)
          const hasIncompleteTool = response.content.includes('[TOOL:') && !response.content.includes('[/TOOL]');
          
          if (hasIncompleteTool) {
            // Response was truncated - ask AI to try with simpler/chunked approach
            console.warn('[TextTools] Detected incomplete tool call - response was truncated');
            console.warn(`[TextTools] Response length: ${response.content.length} chars`);
            
            if (ui) {
              ui.info('[Warning] Response truncated. Requesting chunked approach...');
            }
            
            const retryRequest: LLMRequest = {
              model: this.config.model,
              messages: [
                ...this.sessionManager.getMessages(),
                {
                  role: 'system',
                  content: `⚠️ YOUR PREVIOUS RESPONSE WAS TOO LONG AND GOT TRUNCATED!

SOLUTION: Break it into MULTIPLE SMALLER FILES:

EXAMPLE - Instead of one huge game.html (5000 lines):
✓ Create game.html (200 lines - basic HTML structure)
✓ Create game.js (300 lines - game logic)
✓ Create style.css (100 lines - styles)

DO THIS NOW:
1. Split large content into multiple files (max 400 lines per file)
2. Use separate [TOOL: write_file] for EACH file
3. Keep each tool call SHORT
4. Link files together (e.g., <script src="game.js"></script>)

FORMAT:
[TOOL: write_file]
path: file1.html
content: Short content here (max 400 lines)
[/TOOL]

[TOOL: write_file]
path: file2.js
content: Short content here (max 400 lines)
[/TOOL]

START NOW - create multiple small files instead of one big file!`
                }
              ],
              temperature: 0.7,
              maxTokens: 16000, // Higher limit for multiple smaller files
              tools: undefined
            };
            
            const retryResponse = await this.llmRouter.chat(retryRequest);
            
            // Try parsing again
            if (retryResponse.content) {
              const retryToolCalls = this.parseTextBasedToolCalls(retryResponse.content);
              if (retryToolCalls.length > 0) {
                console.log(`[TextTools] Retry successful: ${retryToolCalls.length} tools parsed`);
                response.toolCalls = retryToolCalls;
                response.content = retryResponse.content.replace(/\[TOOL:[\s\S]*?\[\/TOOL\]/g, '').trim();
              } else {
                // Still no tools - might need more guidance
                if (ui) {
                  ui.info('[Warning] Retry failed to produce tools. One more attempt...');
                }
                
                // Final attempt with even more explicit instruction
                const finalRequest: LLMRequest = {
                  model: this.config.model,
                  messages: [
                    ...this.sessionManager.getMessages(),
                    {
                      role: 'system',
                      content: `CRITICAL: You need to create files using this EXACT format:

[TOOL: write_file]
path: main.html
content: <!DOCTYPE html>
<html>
<head><title>Simple</title></head>
<body>
<h1>Hello</h1>
<script src="script.js"></script>
</body>
</html>
[/TOOL]

[TOOL: write_file]
path: script.js
content: console.log('Hello');
// Add your JavaScript here
[/TOOL]

CREATE MULTIPLE SMALL FILES NOW!`
                    }
                  ],
                  temperature: 0.5,
                  maxTokens: 16000,
                  tools: undefined
                };
                
                const finalResponse = await this.llmRouter.chat(finalRequest);
                if (finalResponse.content) {
                  const finalToolCalls = this.parseTextBasedToolCalls(finalResponse.content);
                  if (finalToolCalls.length > 0) {
                    console.log(`[TextTools] Final retry successful: ${finalToolCalls.length} tools`);
                    response.toolCalls = finalToolCalls;
                    response.content = finalResponse.content.replace(/\[TOOL:[\s\S]*?\[\/TOOL\]/g, '').trim();
                  } else {
                    // Give up and return explanation
                    response.content = finalResponse.content || 'I apologize, I had trouble creating the files. Could you try with a simpler request?';
                  }
                }
              }
            }
          }
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
              ui.info('[Warning] Received empty response, trying again with simpler prompt...');
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

      // Track tool calls for ERROR loop detection (not for successful calls)
      // AI can call tools unlimited times if they succeed
      // Only stop if same tools ERROR 2+ times in a row
      const currentTools = response.toolCalls.map(tc => tc.name);

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

      // ERROR LOOP DETECTION: Check if same tools failed repeatedly
      const hasErrors = toolResults.some(r => r.content.startsWith('Error:'));
      
      if (hasErrors) {
        // Check if same tools as previous iteration
        if (JSON.stringify(currentTools) === currentToolCallsStr) {
          repeatCount++;
          console.warn(`[Error Loop] Same tools failed ${repeatCount} times: ${currentTools.join(', ')}`);
          
          if (repeatCount >= 2) {
            // Same tools ERRORED 2+ times in a row - STOP and report bug
            if (ui) {
              ui.stopThinking();
              ui.error('⚠️  Tool errors repeating - possible bug detected');
            }
            
            const errorDetails = toolResults
              .filter(r => r.content.startsWith('Error:'))
              .map(r => r.content)
              .join('\n');
            
            const errorMessage = `I apologize, but I encountered repeated errors while trying to execute tools.

**Issue Details:**
- Tools that failed: ${currentTools.join(', ')}
- Failed ${repeatCount + 1} times in a row
- Error messages:
${errorDetails}

This appears to be a bug in the system. Please report this to:
📧 **ambatukam.bleww@gmail.com**

Include in your report:
- Your query: "${userInput}"
- Failed tools: ${currentTools.join(', ')}
- Error details: ${errorDetails.substring(0, 200)}...
- Timestamp: ${new Date().toISOString()}

Thank you for your patience!`;
            
            this.sessionManager.addMessage({
              role: 'assistant',
              content: errorMessage
            });
            
            return errorMessage;
          }
        } else {
          // Different tools, reset counter
          repeatCount = 0;
        }
        lastToolCalls = currentTools;
      } else {
        // All tools succeeded - reset counter
        repeatCount = 0;
        lastToolCalls = currentTools;
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
