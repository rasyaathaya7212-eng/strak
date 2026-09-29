/**
 * UI Component for CLI
 * Handles display of logo, header, and formatting
 */

import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';

export class UI {
  private config: any;

  constructor(config: any) {
    this.config = config;
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

    // Cyberpunk border top with animation effect
    const borderTop = chalk.cyan('═'.repeat(100));
    const borderLight = chalk.magenta('▓') + chalk.cyan('▒') + chalk.blue('░');
    
    console.log('\n' + borderLight.repeat(33) + chalk.magenta('▓'));
    console.log(borderTop);
    console.log('');
    
    // Main title - STRAK in big ASCII art (centered)
    const title = [
      '              ███████╗████████╗██████╗  █████╗ ██╗  ██╗',
      '              ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║ ██╔╝',
      '              ███████╗   ██║   ██████╔╝███████║█████╔╝ ',
      '              ╚════██║   ██║   ██╔══██╗██╔══██║██╔═██╗ ',
      '              ███████║   ██║   ██║  ██║██║  ██║██║  ██╗',
      '              ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝'
    ];

    // Display title with blue color and cyberpunk effect
    title.forEach(line => {
      const coloredLine = line
        .split('')
        .map((char) => {
          if (char === '█' || char === '╗' || char === '╔' || char === '║' || 
              char === '═' || char === '╚' || char === '╝' || char === '╠' || char === '╣') {
            return chalk.blue.bold(char);
          } else if (char === ' ') {
            return char;
          } else {
            return chalk.blue(char);
          }
        })
        .join('');
      console.log(coloredLine);
    });

    console.log('');
    
    // Animated cyberpunk separator line
    const cyberLinePattern = chalk.blue('░') + chalk.cyan('▒') + chalk.magenta('▓') + chalk.blue('█');
    const cyberLine = cyberLinePattern.repeat(25);
    console.log(cyberLine);
    console.log('');

    // Info section with cyberpunk style
    const versionStr = chalk.cyan('│ ') + chalk.white('VERSION:  ') + chalk.yellow(version);
    const modelStr = chalk.cyan('│ ') + chalk.white('MODEL:    ') + chalk.magenta(model);
    const dirStr = chalk.cyan('│ ') + chalk.white('DIRECTORY:') + chalk.green(` ${currentDir}`);
    const statusStr = chalk.cyan('│ ') + chalk.white('STATUS:   ') + chalk.green('● ONLINE') + chalk.gray(' | AI Agent Ready');
    
    console.log(versionStr);
    console.log(modelStr);
    console.log(statusStr);
    console.log(dirStr);
    console.log('');
    
    // Bottom border with animation
    console.log(cyberLine);
    console.log(borderTop);
    console.log(borderLight.repeat(33) + chalk.magenta('▓') + '\n');
    
    // Welcome message
    console.log(chalk.cyan('  ▶') + chalk.white(' Welcome to STRAK - AI Agent with 2000+ Tools'));
    console.log(chalk.cyan('  ▶') + chalk.gray(' Type your command below or "exit" to quit\n'));
  }

  /**
   * Display ASCII robot logo (old version - kept for compatibility)
   */
  displayLogo(): void {
    // This is now integrated into displayHeader()
  }

  /**
   * Display success message
   */
  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  /**
   * Display error message
   */
  error(message: string): void {
    console.log(chalk.red(`✗ ${message}`));
  }

  /**
   * Display info message
   */
  info(message: string): void {
    console.log(chalk.cyan(`ℹ ${message}`));
  }

  /**
   * Display tool execution status
   */
  toolExecution(toolName: string): void {
    console.log(chalk.magenta(`⚡ EXECUTING TOOL: `) + chalk.yellow(toolName));
  }

  /**
   * Display assistant response
   */
  assistantMessage(content: string): void {
    console.log(chalk.cyan('\n┌─ ASSISTANT RESPONSE'));
    console.log(chalk.white(content));
    console.log(chalk.cyan('└─────────────────────\n'));
  }

  /**
   * Display warning about incomplete configuration
   */
  configWarning(): void {
    const configPath = require('../utils/config').getConfigFilePath();
    console.log(chalk.red('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.red('║') + chalk.yellow('  ⚠️  CONFIGURATION INCOMPLETE  ⚠️                          ') + chalk.red('║'));
    console.log(chalk.red('╠════════════════════════════════════════════════════════════╣'));
    console.log(chalk.red('║') + chalk.white('  Please fill in the following fields in config.json:      ') + chalk.red('║'));
    console.log(chalk.red('║') + chalk.cyan('    • apiKey   ') + chalk.gray('- Your API key                           ') + chalk.red('║'));
    console.log(chalk.red('║') + chalk.cyan('    • baseUrl  ') + chalk.gray('- API endpoint URL                       ') + chalk.red('║'));
    console.log(chalk.red('║') + chalk.cyan('    • model    ') + chalk.gray('- Model name                             ') + chalk.red('║'));
    console.log(chalk.red('╠════════════════════════════════════════════════════════════╣'));
    console.log(chalk.red('║') + chalk.white('  Config file location:                                     ') + chalk.red('║'));
    console.log(chalk.red('║') + chalk.green(`  ${configPath}`) + ' '.repeat(58 - configPath.length) + chalk.red('║'));
    console.log(chalk.red('╚════════════════════════════════════════════════════════════╝\n'));
  }
}
