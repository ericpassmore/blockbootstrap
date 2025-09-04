import { mergeConfig, defineConfig } from 'vitest/config';
import viteBaseConfig from './vite.base.config'; // your shared Vite config
import path from 'path';

export default mergeConfig(
	viteBaseConfig,
	defineConfig({
		test: {
			projects: [
				{
					test: {
						name: 'client',
						environment: 'browser',
						browser: {
							enabled: true,
							provider: 'playwright',
							instances: [{ browser: 'chromium' }]
						},
						include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
						exclude: ['src/lib/server/**'],
						setupFiles: ['./vitest-setup-client.ts']
					},
					resolve: {
						alias: {
							$lib: path.resolve(__dirname, './src/lib'),
							'$env/static/private': path.resolve(__dirname, './src/tests/mocks/env.ts')
						}
					}
				},
				{
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: [
							'src/**/*.svelte.{test,spec}.{js,ts}',
							'src/tests/db/**/*.{test,spec}.{js,ts}'
						]
					},
					resolve: {
						alias: {
							$lib: path.resolve(__dirname, './src/lib'),
							'$env/static/private': path.resolve(__dirname, './src/tests/mocks/env.ts')
						}
					}
				},
				{
					test: {
						name: 'db-tests',
						environment: 'node',
						include: ['src/tests/db/**/*.{test,spec}.{js,ts}']
					},
					resolve: {
						alias: {
							$lib: path.resolve(__dirname, './src/lib'),
							'$env/static/private': path.resolve(__dirname, './src/tests/mocks/env-db.ts')
						}
					}
				}
			]
		}
	})
);
