/**
 * Gateway/Router
 * Routes commands to appropriate handlers and manages sessions
 */

import { SessionManager } from '../core/session';
import { AgentLoop } from '../core/agent-loop';
import { Config } from '../types';
import { toolRegistry } from '../tools/registry';

export class Gateway {
  private sessionManager: SessionManager;
  private agentLoop: AgentLoop;

  constructor(config: Config) {
    this.sessionManager = new SessionManager();
    this.agentLoop = new AgentLoop(config, this.sessionManager);
  }

  /**
   * Handle user input and route to agent loop
   */
  async handleInput(input: string, ui?: any): Promise<string> {
    try {
      const response = await this.agentLoop.run(input, ui);
      return response;
    } catch (error: any) {
      throw new Error(`Gateway error: ${error.message}`);
    }
  }

  /**
   * Get available tools list
   */
  getAvailableTools(): string[] {
    return toolRegistry.getToolNames();
  }

  /**
   * Get current session
   */
  getSession() {
    return this.sessionManager.getCurrentSession();
  }

  /**
   * Create new session
   */
  newSession() {
    return this.sessionManager.createSession();
  }
}
