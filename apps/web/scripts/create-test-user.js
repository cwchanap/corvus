// Simple script to generate a password hash for testing
// This mimics the algorithm in src/lib/auth/crypto.ts

async function generateHash() {
  const password = "password123";

  // Simple implementation of the hash function for testing
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import the password as a key
  const key = await crypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  // Derive the hash
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );

  // Combine salt and hash
  const combined = new Uint8Array(salt.length + hashBuffer.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hashBuffer), salt.length);

  // Convert to base64
  const hash = btoa(String.fromCharCode(...combined));

  console.log("Generated password hash:", hash);
  console.log("\nSQL command to insert test user:");
  console.log(
    `INSERT INTO users (email, password_hash, name) VALUES ('test@example.com', '${hash}', 'Test User');`,
  );
}

generateHash().catch(console.error);
