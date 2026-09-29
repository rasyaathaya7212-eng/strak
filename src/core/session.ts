/**
 * Session Manager
 * Handles conversation history and context management
 */

import { Message, Session } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
  private sessions: Map<string, Session>;
  private currentSessionId: string | null;

  constructor() {
    this.sessions = new Map();
    this.currentSessionId = null;
  }

  /**
   * Create a new session
   */
  createSession(): Session {
    const session: Session = {
      id: uuidv4(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;
    return session;
  }

  /**
   * Get current session or create new one
   */
  getCurrentSession(): Session {
    if (!this.currentSessionId || !this.sessions.has(this.currentSessionId)) {
      return this.createSession();
    }

    return this.sessions.get(this.currentSessionId)!;
  }

  /**
   * Add message to current session
   */
  addMessage(message: Message): void {
    const session = this.getCurrentSession();
    session.messages.push(message);
    session.updatedAt = new Date();
  }

  /**
   * Get session by ID
   */
  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get all messages from current session
   */
  getMessages(): Message[] {
    const session = this.getCurrentSession();
    return session.messages;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    if (this.currentSessionId) {
      this.sessions.delete(this.currentSessionId);
      this.currentSessionId = null;
    }
  }

  /**
   * List all sessions
   */
  listSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}
