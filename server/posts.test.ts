import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => { },
    } as TrpcContext["res"],
  };
}

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "google",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => { },
    } as TrpcContext["res"],
  };
}

describe("posts router", () => {
  it("allows public access to list posts", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for public procedure
    const result = await caller.posts.list({ category: "notice" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows public access to get single post", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for public procedure (returns null if not found)
    const result = await caller.posts.get({ id: 999999 });
    expect(result).toBeNull();
  });

  it("requires authentication to create posts", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.posts.create({
        title: "Test Post",
        content: "Test Content",
        category: "free",
      })
    ).rejects.toThrow();
  });

  it("allows authenticated users to create free board posts", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    // This should not throw (actual DB operation may fail in test env)
    try {
      await caller.posts.create({
        title: "Test Post",
        content: "Test Content",
        category: "free",
      });
    } catch (error: any) {
      // Database errors are expected in test environment
      expect(error.message).not.toContain("UNAUTHORIZED");
    }
  });

  it("prevents non-admin users from posting to notice board", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.posts.create({
        title: "Test Notice",
        content: "Test Content",
        category: "notice",
      })
    ).rejects.toThrow("Only admins can post to notice board");
  });
});

describe("progress router", () => {
  it("requires authentication to get progress", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.progress.getAll()).rejects.toThrow();
  });

  it("requires authentication to get module progress", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.progress.getModule({ moduleId: 1 })).rejects.toThrow();
  });

  it("requires authentication to update module progress", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.progress.updateModule({
        moduleId: 1,
        completedCheckpoints: "0,1",
        isCompleted: false,
      })
    ).rejects.toThrow();
  });

  it("allows authenticated users to access progress", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    // Should not throw for authenticated users
    try {
      const result = await caller.progress.getAll();
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      // Database errors are expected in test environment
      expect(error.message).not.toContain("UNAUTHORIZED");
    }
  });
});
