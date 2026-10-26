import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// SWC est nécessaire pour émettre les métadonnées de décorateurs avec le bon
// type : le transformeur Oxc de Vite émet `Object` pour les paramètres du
// constructeur, ce qui casse l'injection de dépendances de NestJS.
const swcPlugin = swc.vite();
swcPlugin.enforce = 'pre';

export default defineConfig({
	plugins: [swcPlugin, tsconfigPaths()],
	test: {
		globals: true,
		root: './',
		include: ['**/*.spec.ts'],
	},
});
