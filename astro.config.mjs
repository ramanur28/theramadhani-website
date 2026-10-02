import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

function decapServerIntegration() {
  return {
    name: 'decap-server-integration',
    hooks: {
      'astro:server:setup': async () => {
        const net = await import('net');
        const isPortInUse = await new Promise((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(400);
          socket.on('connect', () => {
            socket.destroy();
            resolve(true);
          });
          socket.on('error', () => {
            resolve(false);
          });
          socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
          });
          socket.connect(8081, '127.0.0.1');
        });

        if (!isPortInUse) {
          const { spawn } = await import('child_process');
          console.log('\x1b[36m[decap-server]\x1b[0m Starting Decap CMS proxy server on port 8081...');
          const serverProc = spawn('npx', ['decap-server'], {
            stdio: 'inherit',
            shell: true,
          });
          process.on('exit', () => serverProc.kill());
          process.on('SIGINT', () => {
            serverProc.kill();
            process.exit();
          });
          process.on('SIGTERM', () => {
            serverProc.kill();
            process.exit();
          });
        }
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://theramadhani.com',
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    decapServerIntegration(),
  ],
});
