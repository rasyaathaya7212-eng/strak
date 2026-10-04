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
   * Parse DSML format (DeepSeek's internal format) and convert to standard format
   * Format: <｜｜DSML｜｜ invoke name="tool_name">
   *         <｜｜DSML｜｜ parameter name="param1">value1</｜｜DSML｜｜ parameter>
   *         <｜｜DSML｜｜ parameter name="param2">value2</｜｜DSML｜｜ parameter>
   */
  private parseDSMLToolCalls(content: string): any[] {
    const toolCalls: any[] = [];
    
    // Pattern for DSML invoke blocks (each invoke can have multiple parameters)
    const invokePattern = /<｜｜DSML｜｜\s*invoke\s+name="(\w+)">([\s\S]*?)<\/｜｜DSML｜｜\s*invoke>/g;
    let invokeMatch;
    let callIndex = 0;
    
    while ((invokeMatch = invokePattern.exec(content)) !== null) {
      const toolName = invokeMatch[1];
      const paramsBlock = invokeMatch[2];
      
      // Extract parameters from the block
      const args: any = {};
      
      // Pattern for individual parameters
      const paramPattern = /<｜｜DSML｜｜\s*parameter\s+name="(\w+)"[\s\S]*?>([\s\S]*?)<\/｜｜DSML｜｜\s*parameter>/g;
      let paramMatch;
      
      while ((paramMatch = paramPattern.exec(paramsBlock)) !== null) {
        const paramName = paramMatch[1];
        let paramValue = paramMatch[2].trim();
        
        // Try to parse as JSON if it looks like JSON
        if ((paramValue.startsWith('{') && paramValue.endsWith('}')) || 
            (paramValue.startsWith('[') && paramValue.endsWith(']'))) {
          try {
            paramValue = JSON.parse(paramValue);
          } catch (e) {
            // Keep as string if JSON parsing fails
          }
        }
        
        args[paramName] = paramValue;
      }
      
      toolCalls.push({
        id: `dsml_call_${callIndex++}`,
        name: toolName,
        args: args
      });
      
      console.log(`[DSML Parser] Converted ${toolName}:`, JSON.stringify(args).substring(0, 150));
    }
    
    return toolCalls;
  }

  /**
   * Parse text-based tool invocations from AI response
   * Format: [TOOL: tool_name]\nparam: value\n[/TOOL]
   */
  private parseTextBasedToolCalls(content: string): any[] {
    // First try to parse DSML format (DeepSeek's native format)
    const dsmlCalls = this.parseDSMLToolCalls(content);
    if (dsmlCalls.length > 0) {
      console.log(`[Parser] Found ${dsmlCalls.length} DSML format tool calls (converted automatically)`);
      return dsmlCalls;
    }
    
    // Then try standard [TOOL:] format
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

    // Smart Structure Planning Phase - AGENT 1 (Planning Only)
    if (smartStructureEnabled) {
      const { structureThinking } = require('../features/structure-thinking');
      const fs = require('fs-extra');
      const path = require('path');
      
      // Reset plan for new query
      structureThinking.resetPlan();
      
      if (ui) {
        ui.info('🧠 Smart Structure Mode: Creating execution plan...');
      }
      
      // Create planning request - SIMPLE and SHORT to avoid timeout
      const planningRequest: LLMRequest = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are STRAK Planning Agent. Create a SIMPLE step-by-step plan.

FORMAT (plain text, numbered steps):

1. [Step name] - Brief description
2. [Step name] - Brief description
3. [Step name] - Brief description

RULES:
- Maximum 5 steps
- Each step: one clear action
- Keep it SIMPLE and SHORT
- No code, no tools, just high-level plan

Example:
1. Create HTML structure - Basic HTML5 template with canvas
2. Add CSS styling - Game board, colors, responsive design
3. Implement game logic - Snake movement, collision, scoring
4. Add controls - Keyboard input handling
5. Test and polish - Final adjustments

NOW CREATE PLAN for: ${userInput}`
          }
        ],
        temperature: 0.5,
        maxTokens: 500, // Very short - just planning!
        tools: undefined
      };
      
      try {
        const planResponse = await this.llmRouter.chat(planningRequest);
        
        if (!planResponse || !planResponse.content) {
          if (ui) {
            ui.info('[Warning] Planning failed. Continuing without plan...');
          }
        } else {
          // Save plan to file
          const planFile = path.join(process.cwd(), '.strak-plan.txt');
          const planContent = `=== STRAK EXECUTION PLAN ===
Created: ${new Date().toISOString()}
Query: ${userInput}

${planResponse.content}

=== END OF PLAN ===`;
          
          await fs.writeFile(planFile, planContent, 'utf-8');
          
          if (ui) {
            ui.stopThinking();
            ui.success('✅ Plan created and saved to .strak-plan.txt');
            ui.aiReasoning(planResponse.content);
          }
          
          // Ask user what to do next
          const inquirer = require('inquirer');
          const { action } = await inquirer.prompt([
            {
              type: 'list',
              name: 'action',
              message: 'What would you like to do with this plan?',
              choices: [
                { name: '1. Execute the plan now (launch new agent)', value: 'execute' },
                { name: '2. Just save the plan and exit', value: 'save' },
                { name: '3. Cancel', value: 'cancel' }
              ]
            }
          ]);
          
          if (action === 'save') {
            return `Plan saved to .strak-plan.txt. You can execute it later by running STRAK with Smart Structure mode again.`;
          }
          
          if (action === 'cancel') {
            return 'Planning cancelled.';
          }
          
          // If execute, launch Agent 2
          if (action === 'execute') {
            if (ui) {
              ui.info('\n🚀 Launching execution agent...\n');
            }
            
            // Read the plan
            const savedPlan = await fs.readFile(planFile, 'utf-8');
            
            // Create new session for Agent 2 with plan context
            this.sessionManager = new SessionManager(); // Fresh session
            this.sessionManager.addMessage({
              role: 'system',
              content: `You are STRAK Execution Agent. You have received a plan to execute.

PLAN:
${savedPlan}

YOUR JOB:
- Execute the plan step by step
- Use tools to complete each step  
- Write COMPLETE, WORKING code (not skeleton)
- Follow the plan but be flexible if needed

START EXECUTING NOW!`
            });
            
            this.sessionManager.addMessage({
              role: 'user',
              content: `Execute the plan for: ${userInput}`
            });
            
            // Continue to main loop (Agent 2 execution)
          }
        }
      } catch (planError: any) {
        if (ui) {
          ui.info(`[Warning] Planning error: ${planError.message}. Continuing without plan...`);
        }
        console.error('[Planning Error]', planError.message);
      }
    }

    // Add system message if first interaction
    const messages = this.sessionManager.getMessages();
    if (messages.length === 1 || (messages.length === 2 && smartStructureEnabled)) {
      // If Smart Structure enabled and we just added user message, add clear instruction
      const systemContent = smartStructureEnabled 
        ? `You are STRAK AGENT with 200+ TOOLS across 15 categories.

🚨🚨🚨 CRITICAL - WRITE COMPLETE CODE ONLY! 🚨🚨🚨

When creating HTML/JavaScript/game files:
✅ Write COMPLETE, WORKING code with ALL logic
❌ NEVER write skeleton/structure only
❌ NEVER write "// add logic here" comments
❌ NEVER leave empty functions

BAD (skeleton only):
<script>
function gameLoop() {
  // TODO: add game logic
}
</script>

GOOD (complete code):
<script>
let score = 0, snake = [{x:10,y:10}], food = {x:15,y:15};
let dx=1, dy=0;
document.onkeydown = e => {
  if(e.key=='ArrowUp') {dx=0;dy=-1;}
  if(e.key=='ArrowDown') {dx=0;dy=1;}
};
function gameLoop() {
  let head = {x:snake[0].x+dx, y:snake[0].y+dy};
  snake.unshift(head);
  if(head.x==food.x && head.y==food.y) {
    score++;
    food = {x:Math.random()*20|0, y:Math.random()*20|0};
  } else snake.pop();
  ctx.clearRect(0,0,400,400);
  snake.forEach(s=>ctx.fillRect(s.x*20,s.y*20,18,18));
  ctx.fillRect(food.x*20,food.y*20,18,18);
}
setInterval(gameLoop, 100);
</script>

🚨🚨🚨 END WARNING 🚨🚨🚨

═══════════════════════════════════════════════
HOW TO DISCOVER & USE TOOLS (2-STEP PROCESS):
═══════════════════════════════════════════════

STEP 1: Explore category to see available tools
STEP 2: Use the specific tool you need

═══════════════════════════════════════════════
STEP 1 - EXPLORE TOOLS BY CATEGORY:
═══════════════════════════════════════════════

Use this tool to see what's available in a category:

[TOOL: list_category_tools]
category: 01-filesystem
[/TOOL]

This will show you ALL tools in that category with their parameters!

AVAILABLE CATEGORIES:
- 01-filesystem (file operations)
- 02-terminal (shell commands)
- 03-web-search (web & HTTP)
- 04-text (text processing)
- 05-agent (agent control)
- 06-memory (memory & context)
- 07-git (version control)
- 08-media (images, video, PDF)
- 09-automation (scheduling, batch)
- 10-communication (email, messaging)
- 11-data (JSON, CSV, encryption)
- 12-integration (APIs, webhooks)
- 13-skills (plugins, canvas)
- 14-device (clipboard, screen)
- 15-mcp (MCP servers)

═══════════════════════════════════════════════
STEP 2 - USE SPECIFIC TOOL:
═══════════════════════════════════════════════

After exploring, use any tool with this format:

[TOOL: tool_name]
parameter: value
[/TOOL]

EXAMPLE WORKFLOW:

User asks: "Delete file old.txt"

Step 1 - You think: "Delete is filesystem operation, let me check category 01"
[TOOL: list_category_tools]
category: 01-filesystem
[/TOOL]

Step 2 - You see delete_file in the list with its parameters, then use it:
[TOOL: delete_file]
path: old.txt
[/TOOL]

═══════════════════════════════════════════════
CRITICAL - WRITE COMPLETE CODE:
═══════════════════════════════════════════════

When creating HTML/code:
✓ Write COMPLETE, FUNCTIONAL code
✗ NO "// add code here" comments

START EXECUTING THE PLAN!`
        : `You are STRAK AGENT with 200+ TOOLS across 15 categories.

🚨🚨🚨 CRITICAL - WRITE COMPLETE CODE ONLY! 🚨🚨🚨

When user asks for HTML/JavaScript/game files:
✅ Write COMPLETE, WORKING code with ALL logic
❌ NEVER write skeleton/structure only
❌ NEVER write "// add logic here" comments  
❌ NEVER leave empty functions

BAD (skeleton):
<script>
function gameLoop() {
  // TODO: add game logic
}
</script>

GOOD (complete):
<script>
let score=0, snake=[{x:10,y:10}], food={x:15,y:15};
let dx=1, dy=0;
document.onkeydown=e=>{
  if(e.key=='ArrowUp'){dx=0;dy=-1;}
  if(e.key=='ArrowDown'){dx=0;dy=1;}
};
function gameLoop(){
  let head={x:snake[0].x+dx,y:snake[0].y+dy};
  snake.unshift(head);
  if(head.x==food.x&&head.y==food.y){
    score++;
    food={x:Math.random()*20|0,y:Math.random()*20|0};
  }else snake.pop();
  ctx.clearRect(0,0,400,400);
  snake.forEach(s=>ctx.fillRect(s.x*20,s.y*20,18,18));
  ctx.fillRect(food.x*20,food.y*20,18,18);
}
setInterval(gameLoop,100);
</script>

🚨🚨🚨 END WARNING 🚨🚨🚨

═══════════════════════════════════════════════
HOW TO DISCOVER & USE TOOLS (2-STEP PROCESS):
═══════════════════════════════════════════════

Most tools are available but you need to discover them first!

STEP 1: Explore category → See available tools with parameters
STEP 2: Use the specific tool you need

═══════════════════════════════════════════════
STEP 1 - EXPLORE TOOLS BY CATEGORY:
═══════════════════════════════════════════════

Use this special tool to discover what's available:

[TOOL: list_category_tools]
category: 01-filesystem
[/TOOL]

This shows ALL tools in that category with full parameter details!

AVAILABLE CATEGORIES:
- 01-filesystem → file operations (read, write, delete, copy, move, etc.)
- 02-terminal → shell commands (bash, exec, process management)
- 03-web-search → web & HTTP (search, fetch, download, scrape)
- 04-text → text processing (grep, sed, regex, diff)
- 05-agent → agent control (spawn, delegate, tasks)
- 06-memory → memory & context (save, recall, search)
- 07-git → version control (commit, push, pull, branch)
- 08-media → images, video, PDF (resize, convert, OCR)
- 09-automation → scheduling (cron, timers, batch)
- 10-communication → messaging (email, Slack, Discord)
- 11-data → data processing (JSON, CSV, encryption)
- 12-integration → APIs (OAuth, webhooks, integrations)
- 13-skills → plugins (canvas, macros, custom tools)
- 14-device → system (clipboard, screen, keyboard)
- 15-mcp → MCP server tools

═══════════════════════════════════════════════
STEP 2 - USE SPECIFIC TOOL:
═══════════════════════════════════════════════

After exploring category, use the tool:

[TOOL: tool_name]
parameter: value
[/TOOL]

═══════════════════════════════════════════════
EXAMPLE WORKFLOW:
═══════════════════════════════════════════════

User: "Delete old.txt file"

Your process:
1. Think: "Delete = filesystem operation = category 01"
2. Explore category:
   [TOOL: list_category_tools]
   category: 01-filesystem
   [/TOOL]
   
3. See list includes: delete_file (path: string)
4. Use it:
   [TOOL: delete_file]
   path: old.txt
   [/TOOL]

═══════════════════════════════════════════════
User: "Send email to john@example.com"

Your process:
1. Think: "Email = communication = category 10"
2. Explore:
   [TOOL: list_category_tools]
   category: 10-communication
   [/TOOL]
   
3. See: email_send (to, subject, body)
4. Use it:
   [TOOL: email_send]
   to: john@example.com
   subject: Hello
   body: Test message
   [/TOOL]

═══════════════════════════════════════════════
COMMONLY USED TOOLS (no need to explore):
═══════════════════════════════════════════════

These are already available:

[TOOL: write_file]
path: file.txt
content: Complete code here
[/TOOL]

[TOOL: read_file]
path: file.txt
[/TOOL]

[TOOL: ls]
path: ./directory
[/TOOL]

[TOOL: terminal]
command: ls -la
[/TOOL]

[TOOL: web_search]
query: search terms
[/TOOL]

[TOOL: web_fetch]
url: https://example.com
[/TOOL]

[TOOL: memory_save]
key: mykey
value: myvalue
[/TOOL]

[TOOL: memory_recall]
key: mykey
[/TOOL]

═══════════════════════════════════════════════
CRITICAL - WRITE COMPLETE CODE:
═══════════════════════════════════════════════

When creating HTML/code files:
✓ Write COMPLETE, FUNCTIONAL code (ready to use!)
✗ NEVER write "// add code here" placeholders

READY! Explore categories then use tools!`;

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
    
    // CRITICAL: COMPLETELY DISABLE function calling for DeepSeek
    // DeepSeek model does NOT support OpenAI function calling format
    // Must use pure text-based tool invocation with [TOOL:] format
    const useTextBasedTools = true;
    const NEVER_SEND_TOOLS_TO_API = true; // Force text-based only

    while (true) { // Infinite loop - agent must complete the task!
      iterations++;

      // Show progress if taking long
      if (iterations > warningThreshold && ui) {
        ui.info(`Working hard on this (iteration ${iterations})...`);
      }

      // Detect if agent is stuck in a loop (same tools repeatedly)
      const currentToolCallsStr = JSON.stringify(lastToolCalls);
      
      // 1. Prepare LLM request with conversation history
      // NEVER send tools to API - DeepSeek doesn't support function calling
      const request: LLMRequest = {
        model: this.config.model,
        messages: this.sessionManager.getMessages(),
        tools: undefined, // ALWAYS undefined - force text-based tools only
        temperature: 0.7,
        maxTokens: 16000 // Increased to allow complete code generation
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

      // 3. Parse text-based tool invocations (supports both [TOOL:] and DSML formats)
      let parsedToolCalls: any[] = [];
      
      if (useTextBasedTools && response.content) {
        // Parse both formats: [TOOL:] and <｜｜DSML｜｜>
        // DSML format is automatically converted to standard format
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
