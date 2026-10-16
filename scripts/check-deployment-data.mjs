import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.vercel/output');
assert.ok(
	existsSync(path.join(output, 'config.json')),
	'Run npm run build before checking deployment data'
);
assert.equal(
	existsSync(path.join(output, 'static/data/analysis')),
	false,
	'Precomputed analysis directory leaked into static deployment assets'
);

function checkDirectory(directory) {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const location = path.join(directory, entry.name);
		if (entry.isDirectory()) checkDirectory(location);
		else
			assert.ok(
				!/^(?:variance_covariance|(?:(?:nominal|real|excess)_)?mean_std)_series_.*\.csv$/.test(
					entry.name
				),
				`Precomputed analysis file leaked into deployment: ${location}`
			);
	}
}
checkDirectory(output);
for (const name of [
	'Fifty10YearBlocksFrom1970.csv',
	'MarketYields.csv',
	'nominal_returns_10yr_blocks_1970on.csv',
	'real_returns_10yr_blocks_1970on.csv',
	'risk_free_returns_10yr_blocks_1970on.csv'
]) {
	assert.deepEqual(
		readFileSync(path.join(output, 'static/data', name)),
		readFileSync(path.join(root, 'static/data', name)),
		`Runtime CSV missing or changed in deployment: ${name}`
	);
}
console.log('Deployment contains all five runtime CSVs and no precomputed analysis CSVs.');
