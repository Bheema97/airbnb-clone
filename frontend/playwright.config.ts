import { defineConfig } from "@playwright/test";

const pythonCommand = process.env.PLAYWRIGHT_PYTHON || (process.platform === "win32" ? "py -3" : "python3");
const browserPath = process.env.PLAYWRIGHT_CHROME_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  webServer: [
    {
      command: "node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3000",
      url: "http://127.0.0.1:3000",
      timeout: 120_000,
      reuseExistingServer: true,
    },
    {
      command: `${pythonCommand} run_e2e.py`,
      cwd: "../backend",
      url: "http://127.0.0.1:8000/api/health",
      timeout: 120_000,
      reuseExistingServer: true,
    },
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1440, height: 900 },
    launchOptions: browserPath ? { executablePath: browserPath } : undefined,
  },
});
