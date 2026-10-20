import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import fs from 'node:fs';
import path from 'node:path';

function decapServerIntegration() {
  return {
    name: 'decap-server-integration',
    hooks: {
      'astro:server:setup': async ({ server }) => {
        // 1. Rewrite any relative /admin/images/uploads/* to /images/uploads/*
        // This eliminates 404 errors when preview or editor renders relative image paths
        server.middlewares.use((req, _res, next) => {
          // Rewrite clean /admin/collections/* and /admin/media to /admin/
          if (req.url && (req.url.startsWith('/admin/collections') || req.url.startsWith('/admin/media'))) {
            req.url = '/admin/';
          }
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

        // 2c. Persistent Custom Strategies API (Direct Disk Storage in public/admin/strategies.json)
        server.middlewares.use(async (req, res, next) => {
          const urlPath = (req.url || '').split('?')[0];
          if (urlPath === '/api/strategies' || urlPath === '/api/strategies.json') {
            const fs = await import('fs');
            const path = await import('path');
            const stratFilePath = path.resolve(process.cwd(), 'public/admin/strategies.json');

            function readDiskStrategies() {
              if (!fs.existsSync(stratFilePath)) {
                fs.writeFileSync(stratFilePath, '[]\n', 'utf8');
                return [];
              }
              try {
                const raw = fs.readFileSync(stratFilePath, 'utf8');
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
              } catch (_) {
                return [];
              }
            }

            function writeDiskStrategies(data) {
              const dir = path.dirname(stratFilePath);
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(stratFilePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
            }

            if (req.method === 'GET') {
              const data = readDiskStrategies();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return;
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  const payload = JSON.parse(body);
                  let current = readDiskStrategies();
                  if (Array.isArray(payload)) {
                    current = payload;
                  } else if (payload.action === 'delete') {
                    current = current.filter((s) => s.id !== payload.id);
                  } else {
                    const idx = current.findIndex((s) => s.id === payload.id);
                    if (idx >= 0) {
                      current[idx] = { ...current[idx], ...payload, updatedAt: Date.now() };
                    } else {
                      current.push({ ...payload, updatedAt: Date.now() });
                    }
                  }
                  writeDiskStrategies(current);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, strategies: current }));
                } catch (err) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: String(err) }));
                }
              });
              return;
            }

            if (req.method === 'DELETE') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  const { id } = JSON.parse(body);
                  let current = readDiskStrategies();
                  current = current.filter((s) => s.id !== id);
                  writeDiskStrategies(current);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, strategies: current }));
                } catch (err) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: String(err) }));
                }
              });
              return;
            }
          }
          next();
        });

        // 2b. Live Articles & Work Index endpoint for AI Studio Internal Linking
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/articles-index' || req.url === '/api/articles-index.json') {
            try {
              const fs = await import('fs');
              const path = await import('path');
              const articlesDir = path.resolve(process.cwd(), 'src/content/articles');
              const workDir = path.resolve(process.cwd(), 'src/content/work');
              const items = [];

              function parseMDX(filePath, typePrefix) {
                const text = fs.readFileSync(filePath, 'utf-8');
                const titleM = text.match(/^title:\s*["']?([^"'\r\n]+)["']?/m);
                const descM = text.match(/^description:\s*["']?([^"'\r\n]+)["']?/m);
                const slugM = text.match(/^slug:\s*["']?([^"'\r\n]+)["']?/m);
                const tagsM = text.match(/^tags:\s*\[(.*?)\]/m);
                const fileSlug = path.basename(filePath, path.extname(filePath));
                const slug = slugM ? slugM[1].trim() : fileSlug;
                let tags = [];
                if (tagsM) {
                  tags = tagsM[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''));
                }
                return {
                  type: typePrefix === 'articles' ? 'article' : 'case-study',
                  title: titleM ? titleM[1].trim() : fileSlug,
                  slug,
                  url: `/${typePrefix}/${slug}/`,
                  description: descM ? descM[1].trim() : '',
                  tags,
                };
              }

              if (fs.existsSync(articlesDir)) {
                for (const f of fs.readdirSync(articlesDir)) {
                  if (f.endsWith('.md') || f.endsWith('.mdx')) {
                    items.push(parseMDX(path.join(articlesDir, f), 'articles'));
                  }
                }
              }

              if (fs.existsSync(workDir)) {
                for (const f of fs.readdirSync(workDir)) {
                  if (f.endsWith('.md') || f.endsWith('.mdx')) {
                    items.push(parseMDX(path.join(workDir, f), 'work'));
                  }
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(items, null, 2));
              return;
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(err) }));
              return;
            }
          }
          next();
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

/**
 * Builds metadata (lastmod, changefreq, priority) for sitemap serialization.
 */
function getSitemapMetadataMap() {
  const metaMap = new Map();

  function parseFrontmatter(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const slugMatch = content.match(/^slug:\s*["']?([^"'\r\n]+)["']?/m);
      const pubMatch = content.match(/^publishDate:\s*["']?([^"'\r\n]+)["']?/m);
      const updMatch = content.match(/^updatedDate:\s*["']?([^"'\r\n]+)["']?/m);
      const dateStr = updMatch ? updMatch[1].trim() : (pubMatch ? pubMatch[1].trim() : null);
      const fileSlug = path.basename(filePath, path.extname(filePath));
      const slug = slugMatch ? slugMatch[1].trim() : fileSlug;
      const date = dateStr ? new Date(dateStr) : fs.statSync(filePath).mtime;
      return { slug, date };
    } catch {
      return null;
    }
  }

  // 1. Articles collection
  const articlesDir = path.resolve('src/content/articles');
  if (fs.existsSync(articlesDir)) {
    for (const file of fs.readdirSync(articlesDir)) {
      if (file.endsWith('.md') || file.endsWith('.mdx')) {
        const parsed = parseFrontmatter(path.join(articlesDir, file));
        if (parsed) {
          metaMap.set(`/articles/${parsed.slug}/`, {
            lastmod: parsed.date,
            changefreq: 'monthly',
            priority: 0.7,
          });
        }
      }
    }
  }

  // 2. Work collection
  const workDir = path.resolve('src/content/work');
  if (fs.existsSync(workDir)) {
    for (const file of fs.readdirSync(workDir)) {
      if (file.endsWith('.md') || file.endsWith('.mdx')) {
        const parsed = parseFrontmatter(path.join(workDir, file));
        if (parsed) {
          metaMap.set(`/work/${parsed.slug}/`, {
            lastmod: parsed.date,
            changefreq: 'monthly',
            priority: 0.7,
          });
        }
      }
    }
  }

  // 3. Static pages
  const staticPages = [
    { route: '/', file: 'src/pages/index.astro', changefreq: 'weekly', priority: 1.0 },
    { route: '/services/seo/', file: 'src/pages/services/seo.astro', changefreq: 'monthly', priority: 0.9 },
    { route: '/services/geo/', file: 'src/pages/services/geo.astro', changefreq: 'monthly', priority: 0.9 },
    { route: '/services/google-ads/', file: 'src/pages/services/google-ads.astro', changefreq: 'monthly', priority: 0.9 },
    { route: '/services/seo/workflow/', file: 'src/pages/services/seo/workflow.astro', changefreq: 'monthly', priority: 0.8 },
    { route: '/articles/', file: 'src/pages/articles/index.astro', changefreq: 'daily', priority: 0.8 },
    { route: '/work/', file: 'src/pages/work.astro', changefreq: 'monthly', priority: 0.7 },
    { route: '/about/', file: 'src/pages/about.astro', changefreq: 'monthly', priority: 0.7 },
    { route: '/contact/', file: 'src/pages/contact.astro', changefreq: 'monthly', priority: 0.6 },
  ];

  for (const page of staticPages) {
    const fullPath = path.resolve(page.file);
    let mtime = new Date();
    if (fs.existsSync(fullPath)) {
      mtime = fs.statSync(fullPath).mtime;
    }
    metaMap.set(page.route, {
      lastmod: mtime,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  }

  return metaMap;
}

const sitemapMetaMap = getSitemapMetadataMap();

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://theramadhani.com',
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        try {
          const { pathname } = new URL(page);
          return (
            !pathname.startsWith('/admin') &&
            !pathname.startsWith('/api') &&
            !pathname.startsWith('/auth') &&
            !pathname.startsWith('/callback')
          );
        } catch {
          return !/\/admin(\/|$)/.test(page) && !/\/api(\/|$)/.test(page);
        }
      },
      serialize(item) {
        try {
          const { pathname } = new URL(item.url);
          const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
          const meta = sitemapMetaMap.get(normalizedPath);
          if (meta) {
            if (meta.lastmod && !isNaN(meta.lastmod.getTime())) {
              item.lastmod = meta.lastmod.toISOString();
            }
            if (meta.changefreq) {
              item.changefreq = meta.changefreq;
            }
            if (typeof meta.priority === 'number') {
              item.priority = meta.priority;
            }
          }
        } catch {}
        return item;
      },
    }),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    decapServerIntegration(),
  ],
});
