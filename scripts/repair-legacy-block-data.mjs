import { readFileSync, writeFileSync } from 'node:fs';

// Reconcile only missing copies of observations already present in another overlapping block.
const file = new URL('../static/data/Fifty10YearBlocksFrom1970.csv', import.meta.url);
const original = readFileSync(file, 'utf8');
const [header, ...lines] = original.trimEnd().split(/\r?\n/);
const columns = header.split(',');
const rows = lines.map((line) => line.split(','));
const calendarYear = (row) => 1970 + Number(row[0]) - 1 + Number(row[1]) - 1;
let repaired = 0;
for (const asset of ['Emerging Markets', 'NASDAQ 100']) {
	const column = columns.indexOf(asset);
	if (column < 0) throw new Error(`Missing column: ${asset}`);
	const observed = new Map();
	for (const row of rows) {
		const value = row[column];
		if (!value || value === '#N/A') continue;
		const year = calendarYear(row);
		if (observed.has(year) && observed.get(year) !== value) {
			throw new Error(`Conflicting ${asset} observations for ${year}`);
		}
		observed.set(year, value);
	}
	for (const row of rows) {
		const known = observed.get(calendarYear(row));
		if (row[column] === '' && known !== undefined) {
			row[column] = known;
			repaired++;
		}
	}
}
if (repaired) {
	const ending = /\r?\n$/.test(original) ? '\n' : '';
	writeFileSync(file, [header, ...rows.map((row) => row.join(','))].join('\n') + ending);
}
console.log(`Reconciled ${repaired} missing historical observations.`);
