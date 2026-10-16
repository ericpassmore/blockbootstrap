#!/usr/bin/env python3
"""Rebuild nominal sample covariance matrices from their two source blocks.

Run from any directory: python3 scripts/regenerate_covariance.py
No downloaded data or third-party packages are required. Means are calculated
over all 20 observations, including repeated calendar years in overlapping blocks,
matching the existing mean/std series files. Covariance uses sample divisor n - 1.
"""

import csv
from pathlib import Path
from statistics import mean


def regenerate():
    data_dir = Path(__file__).resolve().parents[1] / "static" / "data"
    with (data_dir / "nominal_returns_10yr_blocks_1970on.csv").open() as source:
        observations = list(csv.DictReader(source))
    paths = sorted((data_dir / "analysis").glob("variance_covariance_series_*.csv"))
    for path in paths:
        first, second = map(int, path.stem.rsplit("_", 1)[1].split("-"))
        rows = [row for row in observations if int(row["Series"]) in (first, second)]
        if len(rows) != 20 or first == second:
            raise ValueError(f"Expected two complete blocks for {path.name}")
        with path.open() as existing:
            assets = next(csv.reader(existing))[1:]
        values = {asset: [float(row[asset]) for row in rows] for asset in assets}
        means = {asset: mean(values[asset]) for asset in assets}
        with path.open("w", newline="") as output:
            writer = csv.writer(output, lineterminator="\n")
            writer.writerow([""] + assets)
            for asset in assets:
                writer.writerow([asset] + [
                    sum((x - means[asset]) * (y - means[other])
                        for x, y in zip(values[asset], values[other])) / (len(rows) - 1)
                    for other in assets
                ])
    print(f"Regenerated {len(paths)} nominal sample covariance matrices")


if __name__ == "__main__":
    regenerate()
