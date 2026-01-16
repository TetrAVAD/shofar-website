import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { supabaseAdmin } from "./supabase";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get JWT from Authorization header (Bearer token)
    const authHeader = opts.req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Verify JWT with Supabase
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

      if (supabaseUser && !error) {
        // Try to find/create user in our DB
        let dbUser = await db.getUserByOpenId(supabaseUser.id);

        if (dbUser) {
          // Update last signed in
          await db.upsertUser({
            openId: supabaseUser.id,
            lastSignedIn: new Date(),
          });
          user = dbUser;
        } else {
          // Try to create user in DB
          await db.upsertUser({
            openId: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
            email: supabaseUser.email || null,
            loginMethod: 'google',
            lastSignedIn: new Date(),
          });
          dbUser = await db.getUserByOpenId(supabaseUser.id);

          if (dbUser) {
            user = dbUser;
          } else {
            // Database not available - create temporary user from Supabase info
            user = {
              id: 0, // Temporary ID
              openId: supabaseUser.id,
              name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
              email: supabaseUser.email || null,
              loginMethod: 'google',
              role: 'user',
              createdAt: new Date(),
              updatedAt: new Date(),
              lastSignedIn: new Date(),
            };
          }
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error('[Auth] Error during authentication:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}


