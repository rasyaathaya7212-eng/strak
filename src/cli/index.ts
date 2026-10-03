/**
 * CLI Entry Point
 * Handles user input and output
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { UI } from './ui';
import { Gateway } from '../gateway/router';
import { loadConfig, validateConfig } from '../utils/config';
import { structureThinking } from '../features/structure-thinking';
import { ToolTips } from './tool-tips';

export class CLI {
  private ui: UI;
  private gateway: Gateway;
  private config: any;
  private toolTips: ToolTips;

  constructor() {
    this.config = loadConfig();
    this.ui = new UI(this.config);
    this.gateway = new Gateway(this.config);
    this.toolTips = new ToolTips();
  }

  /**
   * Start the CLI interface
   */
  async start(): Promise<void> {
    // Validate configuration
    if (!validateConfig(this.config)) {
      this.ui.configWarning();
      process.exit(1);
    }

    // Display header
    this.ui.displayHeader();
    
    // Start rotating tool tips
    this.toolTips.start();

    // Main interaction loop
    await this.interactionLoop();
  }

  /**
   * Main interaction loop
   */
  private async interactionLoop(): Promise<void> {
    while (true) {
      try {
        const { input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: chalk.cyan('▶'),
            prefix: chalk.magenta('┃')
          }
        ]);

        if (!input.trim()) continue;

        // Handle smart structure toggle (if enabled via Ctrl+S)
        if (this.ui.isSmartStructureEnabled() && !structureThinking.isEnabled()) {
          // First time enabling - start server
          structureThinking.enable();
          const url = await structureThinking.startServer();
          console.log(chalk.green(`\n[SMART STRUCTURE] Visualization server started at: ${chalk.cyan.bold(url)}`));
          console.log(chalk.gray('Open this URL in your browser to see AI planning visualization\n'));
        }

        // Handle details command
        if (input.toLowerCase() === 'details' || input.toLowerCase() === '.details') {
          this.ui.showDetails();
          continue;
        }

        // Handle exit commands
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
          console.log(chalk.cyan('\n┌─────────────────────────────────────────┐'));
          console.log(chalk.cyan('│') + chalk.yellow('  Shutting down STRAK...              ') + chalk.cyan('│'));
          console.log(chalk.cyan('│') + chalk.green('  [OK] Session terminated             ') + chalk.cyan('│'));
          console.log(chalk.cyan('│') + chalk.white('  Thank you for using STRAK!          ') + chalk.cyan('│'));
          console.log(chalk.cyan('└─────────────────────────────────────────┘\n'));
          process.exit(0);
        }

        // Handle tool suggestion with `/`
        if (input.startsWith('/')) {
          const toolSuggestion = await this.handleToolSuggestion(input.slice(1));
          if (toolSuggestion) {
            // Add suggested tool to user's input context
            const finalInput = `Use tool "${toolSuggestion}" to: ` + await this.getFollowUpInput();
            const response = await this.gateway.handleInput(finalInput, this.ui);
            this.ui.assistantMessage(response);
          }
          continue;
        }

        // Process input through gateway
        const response = await this.gateway.handleInput(input, this.ui);
        
        // Display response
        this.ui.assistantMessage(response);
      } catch (error: any) {
        this.ui.error(`Error: ${error.message}`);
      }
    }
  }

  /**
   * Handle tool suggestion when user types `/`
   */
  private async handleToolSuggestion(query: string): Promise<string | null> {
    const tools = this.gateway.getAvailableTools();
    
    // Filter tools based on query
    const filteredTools = query 
      ? tools.filter(t => t.toLowerCase().includes(query.toLowerCase()))
      : tools;

    if (filteredTools.length === 0) {
      console.log(chalk.yellow('  [!] No matching tools found'));
      return null;
    }

    // Show tool selection
    const { selectedTool } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedTool',
        message: chalk.cyan('Select tool (suggestion only, AI decides):'),
        choices: filteredTools.map(tool => ({
          name: chalk.green(tool),
          value: tool
        })),
        pageSize: 15
      }
    ]);

    console.log(chalk.magenta(`  [OK] Tool suggestion: ${selectedTool}`));
    return selectedTool;
  }

  /**
   * Get follow-up input after tool selection
   */
  private async getFollowUpInput(): Promise<string> {
    const { followUp } = await inquirer.prompt([
      {
        type: 'input',
        name: 'followUp',
        message: chalk.cyan('What would you like to do?'),
        prefix: chalk.magenta('┃')
      }
    ]);
    return followUp;
  }
}
