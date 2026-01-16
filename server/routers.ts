import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getPostsByCategory,
  getPostById,
  createPost,
  incrementViewCount,
  deletePost,
  getUserProgress,
  getModuleProgress,
  upsertModuleProgress,
  calculateOverallProgress,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Posts router for notice board and free board
  posts: router({
    list: publicProcedure
      .input(z.object({ category: z.enum(["notice", "free"]) }))
      .query(async ({ input }) => {
        return await getPostsByCategory(input.category);
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        await incrementViewCount(input.id);
        return await getPostById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          content: z.string().min(1),
          category: z.enum(["notice", "free"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Only admins can post to notice board
        if (input.category === "notice" && ctx.user.role !== "admin") {
          throw new Error("Only admins can post to notice board");
        }

        await createPost({
          title: input.title,
          content: input.content,
          category: input.category,
          authorId: ctx.user.id,
          authorName: ctx.user.name || ctx.user.email || "익명",
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await getPostById(input.id);
        if (!post) {
          throw new Error("Post not found");
        }

        // Allow deletion if user is author or admin
        if (post.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Not authorized to delete this post");
        }

        await deletePost(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Learning progress router
  progress: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await getUserProgress(ctx.user.id);
    }),

    getModule: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getModuleProgress(ctx.user.id, input.moduleId);
      }),

    updateModule: protectedProcedure
      .input(
        z.object({
          moduleId: z.number(),
          completedCheckpoints: z.string(),
          isCompleted: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertModuleProgress(
          ctx.user.id,
          input.moduleId,
          input.completedCheckpoints,
          input.isCompleted
        );
        return { success: true };
      }),

    getOverallProgress: protectedProcedure.query(async ({ ctx }) => {
      return await calculateOverallProgress(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
