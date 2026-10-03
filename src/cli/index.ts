/**
 * CLI Entry Point
 * Handles user input and output
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { UI } from './ui';
import { Gateway } from '../gateway/router';
import { loadConfig, validateConfig } from '../utils/config';

export class CLI {
  private ui: UI;
  private gateway: Gateway;
  private config: any;
  private smartStructureEnabled: boolean = false; // Smart Structure toggle

  constructor() {
    this.config = loadConfig();
    this.ui = new UI(this.config);
    this.gateway = new Gateway(this.config);
    
    // Setup keyboard listeners
    this.setupKeyboardListeners();
  }

  /**
   * Setup keyboard listeners for shortcuts
   */
  private setupKeyboardListeners(): void {
    if (!process.stdin.isTTY) return;

    const readline = require('readline');
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str: any, key: any) => {
      if (key && key.ctrl && key.name === 's') {
        // Toggle Smart Structure mode
        this.smartStructureEnabled = !this.smartStructureEnabled;
        
        if (this.smartStructureEnabled) {
          console.log(chalk.green('\n  ⚡ SMART STRUCTURE ACTIVE - AI will plan before executing\n'));
          
          // Start visualization server
          const { structureThinking } = require('../features/structure-thinking');
          structureThinking.enable();
          structureThinking.startServer().then((url: string) => {
            console.log(chalk.cyan(`  [SMART STRUCTURE] Visualization server started at: ${url}`));
            console.log(chalk.gray('  Open this URL in your browser to see AI planning visualization\n'));
          });
        } else {
          console.log(chalk.yellow('\n  ⚡ SMART STRUCTURE DISABLED - Normal mode\n'));
          
          const { structureThinking } = require('../features/structure-thinking');
          structureThinking.disable();
          structureThinking.stopServer();
        }
      }
    });
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
    
    // Show Smart Structure hint
    console.log(chalk.gray('  💡 Press ') + chalk.cyan.bold('Ctrl+S') + chalk.gray(' to toggle Smart Structure mode (AI planning visualization)'));
    console.log('');

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
            const finalInput = `Gunakan tool "${toolSuggestion}" untuk: ` + await this.getFollowUpInput();
            const response = await this.gateway.handleInput(finalInput, this.ui);
            this.ui.assistantMessage(response);
          }
          continue;
        }

        // Process input through gateway
        const response = await this.gateway.handleInput(input, this.ui, this.smartStructureEnabled);
        
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
      console.log(chalk.yellow('  [!] Tidak ada tool yang cocok'));
      return null;
    }

    // Show tool selection
    const { selectedTool } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedTool',
        message: chalk.cyan('Pilih tool (ini hanya saran, AI akan tetap memutuskan):'),
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
        message: chalk.cyan('Apa yang ingin Anda lakukan?'),
        prefix: chalk.magenta('┃')
      }
    ]);
    return followUp;
  }
}
