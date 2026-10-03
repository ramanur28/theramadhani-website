import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

function decapServerIntegration() {
  return {
    name: 'decap-server-integration',
    hooks: {
      'astro:server:setup': async ({ server }) => {
        // 1. Rewrite any relative /admin/images/uploads/* to /images/uploads/*
        // This eliminates 404 errors when preview or editor renders relative image paths
        server.middlewares.use((req, _res, next) => {
          if (req.url && req.url.startsWith('/admin/images/uploads/')) {
            req.url = req.url.replace('/admin/images/uploads/', '/images/uploads/');
          }
          next();
        });

        // 2. Direct local media upload endpoint for instant disk persistence
        server.middlewares.use('/api/dev-upload', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            return;
          }
          const fs = await import('fs');
          const path = await import('path');
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { filename, content } = JSON.parse(body);
              if (!filename || !content) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing filename or content' }));
                return;
              }
              const uploadsDir = path.resolve(process.cwd(), 'public/images/uploads');
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }
              const cleanName = path.basename(filename);
              const targetPath = path.join(uploadsDir, cleanName);
              const buffer = Buffer.from(content, 'base64');
              fs.writeFileSync(targetPath, buffer);
              console.log(
                '\x1b[32m[dev-upload]\x1b[0m Saved to disk: public/images/uploads/' + cleanName
              );
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  path: '/images/uploads/' + cleanName,
                })
              );
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
        });

        // 3. Check and start Decap CMS proxy server on port 8081 if needed
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
