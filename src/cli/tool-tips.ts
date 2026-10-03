/**
 * Rotating Tool Tips
 * Shows random tool suggestions every 6 seconds below input
 */

import chalk from 'chalk';
import { toolRegistry } from '../tools/registry';

export class ToolTips {
  private interval: NodeJS.Timeout | null = null;
  private shuffledTools: string[] = [];
  private currentIndex: number = 0;

  /**
   * Start rotating tool tips
   */
  start(): void {
    if (this.interval) return;

    // Get all tools and shuffle
    const allTools = toolRegistry.getToolNames();
    this.shuffledTools = this.shuffle([...allTools]);
    this.currentIndex = 0;

    // Show first tip immediately
    this.showTip();

    // Rotate every 6 seconds
    this.interval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.shuffledTools.length;
      
      // Re-shuffle when completing a cycle
      if (this.currentIndex === 0) {
        this.shuffledTools = this.shuffle([...allTools]);
      }
      
      this.showTip();
    }, 6000);
  }

  /**
   * Stop rotating tool tips
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.clearTip();
  }

  /**
   * Show current tool tip
   */
  private showTip(): void {
    const toolName = this.shuffledTools[this.currentIndex];
    const tool = toolRegistry.getTool(toolName);
    
    if (!tool) return;

    const rows = process.stdout.rows || 24;
    const maxWidth = (process.stdout.columns || 80) - 10;
    
    // Truncate description to fit terminal width
    let description = tool.description;
    if (description.length > maxWidth - toolName.length - 30) {
      description = description.substring(0, maxWidth - toolName.length - 33) + '...';
    }

    const tipText = chalk.gray('Tip: Use ') + 
                    chalk.cyan.bold(`/${toolName}`) + 
                    chalk.gray(` - ${description}`);

    // Save cursor, move to bottom, show tip, restore cursor
    process.stdout.write('\x1b7'); // Save cursor position
    process.stdout.write(`\x1b[${rows - 1};1H`); // Move to second-to-last row
    process.stdout.write(tipText);
    process.stdout.write('\x1b[K'); // Clear to end of line
    process.stdout.write('\x1b8'); // Restore cursor position
  }

  /**
   * Clear tool tip line
   */
  private clearTip(): void {
    const rows = process.stdout.rows || 24;
    process.stdout.write('\x1b7'); // Save cursor
    process.stdout.write(`\x1b[${rows - 1};1H`); // Move to tip line
    process.stdout.write('\x1b[K'); // Clear line
    process.stdout.write('\x1b8'); // Restore cursor
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
