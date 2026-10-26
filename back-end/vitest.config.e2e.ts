import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const swcPlugin = swc.vite();
swcPlugin.enforce = 'pre';

export default defineConfig({
	plugins: [swcPlugin, tsconfigPaths()],
	test: {
		globals: true,
		root: './',
		include: ['**/*.e2e-spec.ts'],
	},
});
