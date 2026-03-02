export default {
  async fetch(request, env) {
    // Solo intercepta el POST al formulario
    if (request.method === 'POST' && new URL(request.url).pathname === '/contact') {
      const ip = request.headers.get('CF-Connecting-IP');
      const key = `rate:${ip}`;
      const count = parseInt(await env.RATE_LIMIT_KV.get(key) || '0');

      if (count >= 3) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 3600 });

      // Reenvía al Cloud Run
      return fetch('https://sendcontactemail-orp4zew6aa-uc.a.run.app', {
        method: 'POST',
        body: request.body,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Todo lo demás → assets estáticos
    return env.ASSETS.fetch(request);
  }
};
