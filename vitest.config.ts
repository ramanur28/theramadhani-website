import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    env: {
      PLANNER_DB_PATH: 'data/test-article-plans.db',
      PLANNER_JSON_PATH: 'data/test-article-plans.json',
    },
  },
});
