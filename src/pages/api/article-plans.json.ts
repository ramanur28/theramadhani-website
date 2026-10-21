import type { APIRoute } from 'astro';
import { getAllPlans } from '../../utils/planner-db';

export const prerender = true;

export const GET: APIRoute = async () => {
  try {
    const plans = getAllPlans();
    return new Response(JSON.stringify(plans, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
