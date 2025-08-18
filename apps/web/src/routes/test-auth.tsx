import { json } from "@solidjs/router";
import { createDatabase } from "../lib/db.js";
import { AuthService } from "../lib/auth/service.js";
import { getD1 } from "../lib/cloudflare.js";

export async function GET() {
  try {
    // Create a database instance bound to Cloudflare D1
    const db = createDatabase(getD1());

    // Create AuthService instance
    const authService = new AuthService(db);

    console.log("Testing login with test@example.com / password123");

    // Test login
    const user = await authService.login("test@example.com", "password123");

    if (user) {
      console.log("Login successful!");
      console.log("User:", user);

      // Test session creation
      const sessionId = await authService.createSession(user.id);
      console.log("Session created:", sessionId);

      // Test session validation
      const validatedUser = await authService.validateSession(sessionId);
      console.log("Session validation:", validatedUser ? "Valid" : "Invalid");

      // Test session deletion
      await authService.deleteSession(sessionId);
      console.log("Session deleted");

      return json({
        success: true,
        message: "Authentication test completed successfully",
        user: user,
      });
    } else {
      return json({
        success: false,
        message: "Login failed - invalid credentials",
      });
    }
  } catch (error) {
    console.error("Error during authentication test:", error);
    return json({
      success: false,
      message: "Error during authentication test",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
