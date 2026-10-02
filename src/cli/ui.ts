/**
 * UI Component for CLI
 * Handles display of logo, header, and formatting
 */

import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';

export class UI {
  private config: any;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  private spinnerInterval: NodeJS.Timeout | null = null;
  private detailedResults: Map<string, string> = new Map(); // Store full results
  private resultCounter = 0;
  private detailsVisible = false; // Track if details panel is open
  private lastOutputLine = 0; // Track last line position
  private keyListener: any = null; // Store listener reference

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Enable Ctrl+O listener (called after user input to avoid blocking)
   */
  enableKeyListener(): void {
    if (this.keyListener || !process.stdin.isTTY) {
      return;
    }

    const readline = require('readline');
    readline.emitKeypressEvents(process.stdin);

    this.keyListener = (str: any, key: any) => {
      if (key && key.ctrl && key.name === 'o') {
        // Toggle details panel without blocking
        process.nextTick(() => {
          if (this.detailsVisible) {
            this.hideDetailedResults();
          } else {
            this.showDetailedResults();
          }
        });
      }
    };

    process.stdin.on('keypress', this.keyListener);
  }

  /**
   * Disable key listener (cleanup)
   */
  disableKeyListener(): void {
    if (this.keyListener) {
      process.stdin.removeListener('keypress', this.keyListener);
      this.keyListener = null;
    }
  }

  /**
   * Show all detailed results (public method for CLI command)
   */
  showDetails(): void {
    console.log('\n');
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.white.bold(' Tool Output Details'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');

    if (this.detailedResults.size === 0) {
      console.log(chalk.gray('  No results available yet.'));
    } else {
      let resultNum = 1;
      for (const [id, result] of this.detailedResults) {
        console.log(chalk.cyan(`  ${resultNum}. `) + chalk.white.bold(id));
        console.log(chalk.gray('  ' + '─'.repeat(68)));
        
        // Display result with proper formatting
        const lines = result.split('\n');
        lines.forEach(line => {
          console.log('  ' + chalk.white(line));
        });
        
        if (resultNum < this.detailedResults.size) {
          console.log('');
        }
        resultNum++;
      }
    }
    
    console.log('');
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.gray('  Type "details" to see this again'));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log('');
  }

  /**
   * Show all detailed results
   */
  private showDetailedResults(): void {
    this.showDetails();
    this.detailsVisible = true;
  }

  /**
   * Hide detailed results panel
   */
  private hideDetailedResults(): void {
    this.detailsVisible = false;
    
    // Just print closing message, don't clear screen
    console.log(chalk.green('  [INFO] Details panel closed.\n'));
  }

  /**
   * Display cyberpunk header with logo and animations
   */
  displayHeader(): void {
    const version = 'v1.0.0';
    const model = this.config.model || 'not-configured';
    const currentDir = process.cwd();

    // Clear screen for clean display
    console.clear();

    // ASCII Logo
    const logo = chalk.cyan(`
    ███████╗████████╗██████╗  █████╗ ██╗  ██╗
    ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║ ██╔╝
    ███████╗   ██║   ██████╔╝███████║█████╔╝ 
    ╚════██║   ██║   ██╔══██╗██╔══██║██╔═██╗ 
    ███████║   ██║   ██║  ██║██║  ██║██║  ██╗
    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
    
    ${chalk.white.bold('         █████╗  ██████╗ ███████╗███╗   ██╗████████╗')}
    ${chalk.white.bold('        ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝')}
    ${chalk.white.bold('        ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ')}
    ${chalk.white.bold('        ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ')}
    ${chalk.white.bold('        ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ')}
    ${chalk.white.bold('        ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ')}
    `);

    console.log(logo);
    
    // Info bar
    const infoBar = chalk.gray('─'.repeat(60));
    console.log(infoBar);
    
    const modelInfo = chalk.white('Model: ') + chalk.cyan(model);
    const versionInfo = chalk.white('Version: ') + chalk.yellow(version);
    const statusInfo = chalk.white('Status: ') + chalk.green('● Online');
    
    console.log(`  ${modelInfo} ${chalk.gray('│')} ${versionInfo} ${chalk.gray('│')} ${statusInfo}`);
    console.log(`  ${chalk.white('Directory: ')}${chalk.gray(currentDir)}`);
    console.log(infoBar);
    console.log('');
    console.log(chalk.gray('  Tip: Type ') + chalk.cyan.bold('details') + chalk.gray(' to view full tool outputs'));
    console.log('');
  }

  /**
   * Display thinking/processing status
   */
  startThinking(message: string = 'Thinking'): void {
    this.stopThinking(); // Stop any existing spinner
    
    let dots = 0;
    process.stdout.write(chalk.magenta(`\n  ${this.spinnerFrames[0]} ${message}`));
    
    this.spinnerInterval = setInterval(() => {
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
      dots = (dots + 1) % 4;
      const dotsStr = '.'.repeat(dots) + ' '.repeat(3 - dots);
      
      // Clear line and rewrite
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        chalk.magenta(`  ${this.spinnerFrames[this.spinnerIndex]} ${message}${dotsStr}`)
      );
    }, 80);
  }

  /**
   * AI speaks about next action
   */
  aiSpeaks(message: string): void {
    this.stopThinking();
    console.log('');
    console.log(chalk.gray('  │  ') + chalk.blue('→ ') + chalk.gray(message));
  }

  /**
   * AI planning message
   */
  aiPlanning(steps: string[]): void {
    this.stopThinking();
    console.log('');
    console.log(chalk.blue('  [Plan] ') + chalk.white.bold('Plan:'));
    steps.forEach((step, idx) => {
      console.log(chalk.gray(`     ${idx + 1}. `) + chalk.white(step));
    });
    console.log('');
  }

  /**
   * Stop thinking spinner
   */
  stopThinking(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }
  }

  /**
   * Display tool execution with beautiful formatting
   */
  toolExecutionStart(toolName: string, args?: any): void {
    this.stopThinking();
    
    console.log('');
    console.log(chalk.gray('  ┌─ ') + chalk.cyan.bold(toolName));
    
    // Show args if provided (compact format)
    if (args && Object.keys(args).length > 0) {
      for (const [key, value] of Object.entries(args)) {
        const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
        const displayValue = valueStr.length > 60 ? valueStr.substring(0, 60) + '...' : valueStr;
        console.log(chalk.gray('  │  ') + chalk.gray(key + ': ') + chalk.white(displayValue));
      }
    }
    
    console.log(chalk.gray('  │'));
    
    // Show spinner while executing
    let spinIndex = 0;
    process.stdout.write(chalk.gray('  │  ') + chalk.yellow(`${this.spinnerFrames[spinIndex]} Running...`));
    
    this.spinnerInterval = setInterval(() => {
      spinIndex = (spinIndex + 1) % this.spinnerFrames.length;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(chalk.gray('  │  ') + chalk.yellow(`${this.spinnerFrames[spinIndex]} Running...`));
    }, 80);
  }

  /**
   * Display tool execution result
   */
  toolExecutionEnd(toolName: string, success: boolean, result?: string, duration?: number): void {
    this.stopThinking();
    
    const statusText = success ? chalk.green('Done') : chalk.red('Failed');
    const durationText = duration ? chalk.gray(` (${duration}ms)`) : '';
    
    console.log('');
    console.log(chalk.gray('  │  ') + statusText + durationText);
    
    // Store full result for Ctrl+O
    if (result) {
      this.resultCounter++;
      const resultId = `${toolName}-${this.resultCounter}`;
      this.detailedResults.set(resultId, result);
      
      // Show only first line as preview
      const lines = result.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        const preview = lines[0].length > 70 ? lines[0].substring(0, 70) + '...' : lines[0];
        console.log(chalk.gray('  │  ') + chalk.white(preview));
        
        if (lines.length > 1 || lines[0].length > 70) {
          console.log(chalk.gray('  │  ') + chalk.dim('[Type "details" for full output]'));
        }
      }
    }
    
    console.log(chalk.gray('  └─'));
    console.log('');
  }

  /**
   * Get icon for tool type
   */
  private getToolIcon(toolName: string): string {
    if (toolName.includes('web') || toolName.includes('search') || toolName.includes('fetch')) {
      return '[WEB]';
    } else if (toolName.includes('file') || toolName.includes('read') || toolName.includes('write')) {
      return '[FILE]';
    } else if (toolName.includes('terminal') || toolName.includes('bash') || toolName.includes('exec')) {
      return '[TERM]';
    } else if (toolName.includes('memory')) {
      return '[MEM]';
    } else if (toolName.includes('git')) {
      return '[GIT]';
    } else if (toolName.includes('image') || toolName.includes('media')) {
      return '[MEDIA]';
    } else if (toolName.includes('mcp')) {
      return '[MCP]';
    }
    return '[TOOL]';
  }

  /**
   * Display success message
   */
  success(message: string): void {
    console.log(chalk.green(`  [OK] ${message}`));
  }

  /**
   * Display error message
   */
  error(message: string): void {
    console.log(chalk.red(`\n  [ERROR] Error: ${message}\n`));
  }

  /**
   * Display info message
   */
  info(message: string): void {
    console.log(chalk.cyan(`  [INFO] ${message}`));
  }

  /**
   * Display assistant response with beautiful box
   */
  assistantMessage(content: string): void {
    this.stopThinking();
    
    console.log('');
    console.log(chalk.gray('  ┌─ ') + chalk.blue.bold('Assistant'));
    console.log(chalk.gray('  │'));
    
    // Simple line-by-line display
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(chalk.gray('  │  ') + chalk.white(line));
      } else {
        console.log(chalk.gray('  │'));
      }
    });
    
    console.log(chalk.gray('  └─'));
    console.log('');
  }

  /**
   * Wrap text to specified width
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim() === '') {
        lines.push('');
        return;
      }
      
      const words = paragraph.split(' ');
      let currentLine = '';
      
      words.forEach(word => {
        if ((currentLine + word).length <= maxWidth) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      
      if (currentLine) lines.push(currentLine);
    });
    
    return lines;
  }

  /**
   * Display warning about incomplete configuration
   */
  configWarning(): void {
    const configPath = require('../utils/config').getConfigFilePath();
    console.log(chalk.red('\n  ╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.red('  ║') + chalk.yellow('  [!] CONFIGURATION INCOMPLETE  [!]                        ') + chalk.red('║'));
    console.log(chalk.red('  ╠════════════════════════════════════════════════════════════╣'));
    console.log(chalk.red('  ║') + chalk.white('  Please fill in the following fields in config.json:      ') + chalk.red('║'));
    console.log(chalk.red('  ║') + chalk.cyan('    • apiKey   ') + chalk.gray('- Your API key                           ') + chalk.red('║'));
    console.log(chalk.red('  ║') + chalk.cyan('    • baseUrl  ') + chalk.gray('- API endpoint URL                       ') + chalk.red('║'));
    console.log(chalk.red('  ║') + chalk.cyan('    • model    ') + chalk.gray('- Model name                             ') + chalk.red('║'));
    console.log(chalk.red('  ╠════════════════════════════════════════════════════════════╣'));
    console.log(chalk.red('  ║') + chalk.white('  Config file location:                                     ') + chalk.red('║'));
    console.log(chalk.red('  ║') + chalk.green(`  ${configPath}`) + ' '.repeat(58 - configPath.length) + chalk.red('║'));
    console.log(chalk.red('  ╚════════════════════════════════════════════════════════════╝\n'));
  }

  /**
   * Clear current line (for dynamic updates)
   */
  clearLine(): void {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }
}
