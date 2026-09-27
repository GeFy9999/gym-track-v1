import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      JWT_SECRET: "test-jwt-secret",
      CORS_ORIGIN: "http://localhost:5173",
      FRONTEND_URL: "http://localhost:5173",
      RESEND_API_KEY: "test-resend-key",
    },
    globalSetup: ["./src/__tests__/globalSetup.ts"],
  },
});
