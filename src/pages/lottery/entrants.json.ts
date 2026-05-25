import type { APIRoute } from 'astro';
import entrants from '../../data/lottery-entrants.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(entrants, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
