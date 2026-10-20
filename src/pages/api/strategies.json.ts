import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = true;

export const GET: APIRoute = async () => {
  try {
    const stratFilePath = path.resolve(process.cwd(), 'public/admin/strategies.json');
    let data = [];
    if (fs.existsSync(stratFilePath)) {
      try {
        data = JSON.parse(fs.readFileSync(stratFilePath, 'utf8'));
      } catch (_) {
        data = [];
      }
    }
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
