import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, posts, InsertPost, learningProgress, InsertLearningProgress } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Posts Functions ============

export async function getPostsByCategory(category: 'notice' | 'free') {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.category, category))
    .orderBy(desc(posts.createdAt));

  return result;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(posts).values(post);
  return result;
}

export async function incrementViewCount(postId: number) {
  const db = await getDb();
  if (!db) return;

  const post = await getPostById(postId);
  if (post) {
    await db
      .update(posts)
      .set({ viewCount: post.viewCount + 1 })
      .where(eq(posts.id, postId));
  }
}

export async function deletePost(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Only allow deletion if user is the author
  await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.authorId, userId)));
}

// ============ Learning Progress Functions ============

export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(learningProgress)
    .where(eq(learningProgress.userId, userId));

  return result;
}

export async function getModuleProgress(userId: number, moduleId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), eq(learningProgress.moduleId, moduleId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertModuleProgress(
  userId: number,
  moduleId: number,
  completedCheckpoints: string,
  isCompleted: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getModuleProgress(userId, moduleId);

  if (existing) {
    await db
      .update(learningProgress)
      .set({
        completedCheckpoints,
        isCompleted,
        lastAccessedAt: new Date(),
      })
      .where(eq(learningProgress.id, existing.id));
  } else {
    await db.insert(learningProgress).values({
      userId,
      moduleId,
      completedCheckpoints,
      isCompleted,
      lastAccessedAt: new Date(),
    });
  }
}

export async function calculateOverallProgress(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const progress = await getUserProgress(userId);
  const totalModules = 6;

  if (progress.length === 0) return 0;

  let totalCheckpoints = 0;
  let completedCheckpoints = 0;

  // Each module has approximately 3 checkpoints
  const checkpointsPerModule = 3;
  totalCheckpoints = totalModules * checkpointsPerModule;

  progress.forEach((p) => {
    if (p.completedCheckpoints) {
      const completed = p.completedCheckpoints.split(',').filter(Boolean).length;
      completedCheckpoints += completed;
    }
  });

  return Math.round((completedCheckpoints / totalCheckpoints) * 100);
}

