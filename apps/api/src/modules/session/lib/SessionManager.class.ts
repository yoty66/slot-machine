import type { Session } from "./Session.types";
import { INITIAL_CREDITS } from "./session.constants";

export type SessionStore = Map<string, Session>;

export class SessionManager {
  constructor(private readonly store: SessionStore) {}

  createSession(): Session {
    const id = crypto.randomUUID();
    const session: Session = { id, credits: INITIAL_CREDITS };
    this.store.set(id, session);
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.store.get(id);
  }

  updateCredits(id: string, credits: number): Session | undefined {
    const session = this.store.get(id);
    if (session === undefined) return undefined;
    const clamped = Math.max(0, credits);
    const updated: Session = { ...session, credits: clamped };
    this.store.set(id, updated);
    return updated;
  }

  destroySession(id: string): void {
    this.store.delete(id);
  }

  resetInstance(): void {
    this.store.clear();
  }
}

const store = new Map<string, Session>();
export const sessionManager = new SessionManager(store);
