import { createApp } from "../server/_core/index.js";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const { app } = await createApp();
    app(req, res);
}
