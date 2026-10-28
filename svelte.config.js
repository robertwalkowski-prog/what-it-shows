import adapter from '@sveltejs/adapter-static';
import { fileURLToPath } from 'node:url';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [mdsvex({ extensions: ['.svx'], layout: { runbook: fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url)) } })],
  kit: {
    adapter: adapter({ pages: 'build', assets: 'build', strict: false }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['/kb'], handleHttpError: 'warn' },
  },
};
