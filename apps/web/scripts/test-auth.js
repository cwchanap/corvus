// Test script to verify AuthService functionality
import { createDatabase } from "../src/lib/db/index.ts";
import { AuthService } from "../src/lib/auth/service.ts";

async function testAuth() {
  try {
    // Create a database instance
    const db = createDatabase();

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
    } else {
      console.log("Login failed - invalid credentials");
    }
  } catch (error) {
    console.error("Error during authentication test:", error);
  }
}

testAuth().catch(console.error);
