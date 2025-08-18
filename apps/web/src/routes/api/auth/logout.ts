import { redirect } from "@solidjs/router";
import { createDatabase } from "../../../lib/db.js";
import { AuthService } from "../../../lib/auth/service.js";
import {
  getSessionCookie,
  clearSessionCookie,
} from "../../../lib/auth/session.js";
import { getD1 } from "../../../lib/cloudflare.js";

export async function GET() {
  try {
    const sessionId = getSessionCookie();

    if (sessionId) {
      const db = createDatabase(getD1());
      const authService = new AuthService(db);

      await authService.deleteSession(sessionId);
    }

    clearSessionCookie();
    return redirect("/");
  } catch {
    // On any error, still clear cookie to avoid broken state
    clearSessionCookie();
    return redirect("/");
  }
}
