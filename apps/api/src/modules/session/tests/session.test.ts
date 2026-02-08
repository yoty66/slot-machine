import { describe, it, expect, beforeEach } from "vitest";
import { SessionManager, sessionManager } from "../lib/SessionManager.class";
import { INITIAL_CREDITS } from "../lib/session.constants";

describe("sessionManager singleton", () => {
  beforeEach(() => {
    sessionManager.resetInstance();
  });

  it("is an instance of SessionManager", () => {
    expect(sessionManager).toBeInstanceOf(SessionManager);
  });

  it("uses the module-scope store (createSession and getSession share state)", () => {
    const session = sessionManager.createSession();
    expect(sessionManager.getSession(session.id)).toEqual(session);
  });

  it("resetInstance clears the module-scope store", () => {
    const session = sessionManager.createSession();
    sessionManager.resetInstance();
    expect(sessionManager.getSession(session.id)).toBeUndefined();
  });
});

describe("SessionManager", () => {
  const createManager = () => new SessionManager(new Map());

  it("createSession returns session with INITIAL_CREDITS", () => {
    const manager = createManager();
    const session = manager.createSession();
    expect(session).toHaveProperty("id");
    expect(session.id).toBeDefined();
    expect(typeof session.id).toBe("string");
    expect(session.credits).toBe(INITIAL_CREDITS);
  });

  it("getSession returns undefined for unknown id", () => {
    const manager = createManager();
    expect(manager.getSession("unknown-id")).toBeUndefined();
  });

  it("getSession returns session for existing id", () => {
    const manager = createManager();
    const created = manager.createSession();
    const found = manager.getSession(created.id);
    expect(found).toEqual(created);
    expect(found?.credits).toBe(INITIAL_CREDITS);
  });

  it("updateCredits updates and returns session", () => {
    const manager = createManager();
    const created = manager.createSession();
    const updated = manager.updateCredits(created.id, 5);
    expect(updated?.credits).toBe(5);
    expect(manager.getSession(created.id)?.credits).toBe(5);
  });

  it("updateCredits clamps to 0", () => {
    const manager = createManager();
    const created = manager.createSession();
    manager.updateCredits(created.id, -10);
    const session = manager.getSession(created.id);
    expect(session?.credits).toBe(0);
  });

  it("destroySession removes session", () => {
    const manager = createManager();
    const created = manager.createSession();
    manager.destroySession(created.id);
    expect(manager.getSession(created.id)).toBeUndefined();
  });

  it("resetInstance clears state for isolation", () => {
    const manager = createManager();
    const session = manager.createSession();
    manager.resetInstance();
    expect(manager.getSession(session.id)).toBeUndefined();
  });

  it("each manager uses its own store (DI isolation)", () => {
    const store1 = new Map();
    const store2 = new Map();
    const manager1 = new SessionManager(store1);
    const manager2 = new SessionManager(store2);
    const session1 = manager1.createSession();
    expect(manager2.getSession(session1.id)).toBeUndefined();
    expect(manager1.getSession(session1.id)).toEqual(session1);
  });
});
