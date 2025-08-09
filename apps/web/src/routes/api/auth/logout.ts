import { redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { createDatabase } from "../../../lib/db.js";
import { AuthService } from "../../../lib/auth/service.js";
import {
  getSessionCookie,
  clearSessionCookie,
} from "../../../lib/auth/session.js";

export async function GET() {
  try {
    const sessionId = getSessionCookie();

    if (sessionId) {
      const event = getRequestEvent() as any;
      const d1Database = event?.nativeEvent?.context?.cloudflare?.env?.DB;
      const db = createDatabase(d1Database);
      const authService = new AuthService(db);

      await authService.deleteSession(sessionId);
    }

    clearSessionCookie();
    return redirect("/");
  } catch (_e) {
    // On any error, still clear cookie to avoid broken state
    clearSessionCookie();
    return redirect("/");
  }
}
