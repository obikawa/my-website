import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://nagoyasakae.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [tailwind(), react()],
});
