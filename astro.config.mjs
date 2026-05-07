import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://lingtai.ai',
  output: 'static',
  adapter: cloudflare(),
});