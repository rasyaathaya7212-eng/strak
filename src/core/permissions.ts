/**
 * Permissions System
 * Manages tool execution permissions
 */

export class PermissionManager {
  private allowedTools: Set<string>;
  private deniedTools: Set<string>;

  constructor() {
    this.allowedTools = new Set();
    this.deniedTools = new Set();
  }

  /**
   * Check if tool execution is allowed
   */
  isAllowed(toolName: string): boolean {
    if (this.deniedTools.has(toolName)) {
      return false;
    }

    if (this.allowedTools.size === 0) {
      return true; // Allow all by default
    }

    return this.allowedTools.has(toolName);
  }

  /**
   * Allow a tool
   */
  allow(toolName: string): void {
    this.allowedTools.add(toolName);
    this.deniedTools.delete(toolName);
  }

  /**
   * Deny a tool
   */
  deny(toolName: string): void {
    this.deniedTools.add(toolName);
    this.allowedTools.delete(toolName);
  }

  /**
   * Reset permissions
   */
  reset(): void {
    this.allowedTools.clear();
    this.deniedTools.clear();
  }
}
