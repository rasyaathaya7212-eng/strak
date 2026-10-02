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

  constructor(config: any) {
    this.config = config;
    this.setupKeyboardListener();
  }

  /**
   * Setup keyboard listener for Ctrl+O
   */
  private setupKeyboardListener(): void {
    if (process.stdin.isTTY) {
      const readline = require('readline');
      readline.emitKeypressEvents(process.stdin);
      
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }

      process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'o') {
          this.showDetailedResults();
        }
        
        // Allow Ctrl+C to exit
        if (key.ctrl && key.name === 'c') {
          process.exit();
        }
      });
    }
  }

  /**
   * Show all detailed results
   */
  private showDetailedResults(): void {
    console.log('\n');
    console.log(chalk.cyan('  ╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('  ║') + chalk.white.bold('  DETAILED RESULTS (Ctrl+O)') + ' '.repeat(32) + chalk.cyan('║'));
    console.log(chalk.cyan('  ╚═══════════════════════════════════════════════════════════╝'));
    console.log('');

    if (this.detailedResults.size === 0) {
      console.log(chalk.gray('  No detailed results available yet.'));
    } else {
      for (const [id, result] of this.detailedResults) {
        console.log(chalk.yellow(`  [${id}]`));
        console.log(chalk.white('  ' + result.split('\n').join('\n  ')));
        console.log(chalk.gray('  ' + '─'.repeat(60)));
        console.log('');
      }
    }
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
    console.log(chalk.gray('  💡 Tip: Press ') + chalk.cyan.bold('Ctrl+O') + chalk.gray(' to view detailed tool results'));
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
    console.log(chalk.blue('  💭 ') + chalk.white.bold('AI: ') + chalk.gray(message));
    console.log('');
  }

  /**
   * AI planning message
   */
  aiPlanning(steps: string[]): void {
    this.stopThinking();
    console.log('');
    console.log(chalk.blue('  📋 ') + chalk.white.bold('Plan:'));
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
    
    const icon = this.getToolIcon(toolName);
    const toolLabel = chalk.cyan.bold(toolName);
    
    console.log('');
    console.log(chalk.gray('  ┌─────────────────────────────────────────────'));
    console.log(chalk.gray('  │ ') + icon + chalk.white(' Executing Tool'));
    console.log(chalk.gray('  │ ') + chalk.gray('Tool: ') + toolLabel);
    
    // Show args if provided and not too long
    if (args && Object.keys(args).length > 0) {
      const argsStr = JSON.stringify(args, null, 2);
      if (argsStr.length < 200) {
        const argsLines = argsStr.split('\n');
        argsLines.forEach((line, idx) => {
          if (idx === 0) {
            console.log(chalk.gray('  │ ') + chalk.gray('Args: ') + chalk.yellow(line));
          } else {
            console.log(chalk.gray('  │       ') + chalk.yellow(line));
          }
        });
      } else {
        console.log(chalk.gray('  │ ') + chalk.gray('Args: ') + chalk.yellow('[complex arguments]'));
      }
    }
    
    console.log(chalk.gray('  │'));
    
    // Show spinner while executing
    let spinIndex = 0;
    process.stdout.write(chalk.gray('  │ ') + chalk.yellow(`${this.spinnerFrames[spinIndex]} Processing...`));
    
    this.spinnerInterval = setInterval(() => {
      spinIndex = (spinIndex + 1) % this.spinnerFrames.length;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(chalk.gray('  │ ') + chalk.yellow(`${this.spinnerFrames[spinIndex]} Processing...`));
    }, 80);
  }

  /**
   * Display tool execution result
   */
  toolExecutionEnd(toolName: string, success: boolean, result?: string, duration?: number): void {
    this.stopThinking();
    
    const icon = success ? chalk.green('✓') : chalk.red('✗');
    const status = success ? chalk.green('Success') : chalk.red('Failed');
    const durationStr = duration ? chalk.gray(` (${duration}ms)`) : '';
    
    console.log('');
    console.log(chalk.gray('  │ ') + icon + ' ' + status + durationStr);
    
    // Store full result for Ctrl+O
    if (result) {
      this.resultCounter++;
      const resultId = `Result-${this.resultCounter}`;
      this.detailedResults.set(resultId, result);
      
      // Show only preview (first 100 chars or 2 lines)
      const lines = result.split('\n');
      const preview = lines.length > 2 ? lines.slice(0, 2).join('\n') : result;
      const previewText = preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
      
      console.log(chalk.gray('  │ ') + chalk.gray('Preview:'));
      previewText.split('\n').forEach(line => {
        console.log(chalk.gray('  │   ') + chalk.white(line));
      });
      
      if (result.length > 100 || lines.length > 2) {
        console.log(chalk.gray('  │   ') + chalk.cyan(`[Press Ctrl+O to see full details - ${resultId}]`));
      }
    }
    
    console.log(chalk.gray('  └─────────────────────────────────────────────'));
    console.log('');
  }

  /**
   * Get icon for tool type
   */
  private getToolIcon(toolName: string): string {
    if (toolName.includes('web') || toolName.includes('search') || toolName.includes('fetch')) {
      return '🌐';
    } else if (toolName.includes('file') || toolName.includes('read') || toolName.includes('write')) {
      return '📁';
    } else if (toolName.includes('terminal') || toolName.includes('bash') || toolName.includes('exec')) {
      return '💻';
    } else if (toolName.includes('memory')) {
      return '🧠';
    } else if (toolName.includes('git')) {
      return '🔀';
    } else if (toolName.includes('image') || toolName.includes('media')) {
      return '🎨';
    } else if (toolName.includes('mcp')) {
      return '🔌';
    }
    return '🔧';
  }

  /**
   * Display success message
   */
  success(message: string): void {
    console.log(chalk.green(`  ✓ ${message}`));
  }

  /**
   * Display error message
   */
  error(message: string): void {
    console.log(chalk.red(`\n  ✗ Error: ${message}\n`));
  }

  /**
   * Display info message
   */
  info(message: string): void {
    console.log(chalk.cyan(`  ℹ ${message}`));
  }

  /**
   * Display assistant response with beautiful box
   */
  assistantMessage(content: string): void {
    this.stopThinking();
    
    console.log('');
    console.log(chalk.blue('  ╭─────────────────────────────────────────────────────────╮'));
    console.log(chalk.blue('  │ ') + chalk.white.bold('Assistant Response') + ' '.repeat(37) + chalk.blue('│'));
    console.log(chalk.blue('  ├─────────────────────────────────────────────────────────┤'));
    
    // Wrap text to fit in box (max 55 chars per line)
    const maxWidth = 55;
    const lines = this.wrapText(content, maxWidth);
    
    lines.forEach(line => {
      const padding = ' '.repeat(Math.max(0, maxWidth - line.length));
      console.log(chalk.blue('  │ ') + chalk.white(line) + padding + chalk.blue(' │'));
    });
    
    console.log(chalk.blue('  ╰─────────────────────────────────────────────────────────╯'));
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
    console.log(chalk.red('  ║') + chalk.yellow('  ⚠️  CONFIGURATION INCOMPLETE  ⚠️                          ') + chalk.red('║'));
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
