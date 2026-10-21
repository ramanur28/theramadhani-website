import { defineConfig } from '@playwright/test';

export default defineConfig({
    fullyParallel: true,
    workers: '75%', // Uses 75% of your CPU cores simultaneously
    retries: 0,     // Fail immediately so the agent sees the bug right away
    reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
    use: {
        headless: true,
        trace: 'retain-on-failure',      // Zero overhead on passing tests
        screenshot: 'only-on-failure',   // Only capture PNG if a test crashes
        video: 'off',                    // Disables heavy WebM encoding
        launchOptions: {
            args: [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ],
        },
    },
});