#!/usr/bin/env python3
"""Apply the five offline return, inflation and dividend snapshots for 2025.

Only 2025 rows are rewritten, including replacing 2025 crypto projections with
observed USD returns. Non-2025 data and projections are preserved.
Run with --check to verify the committed files without writing anything.
"""

import argparse
import json
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = (
    "Fifty10YearBlocksFrom1970.csv",
    "nominal_returns_10yr_blocks_1970on.csv",
    "real_returns_10yr_blocks_1970on.csv",
    "risk_free_returns_10yr_blocks_1970on.csv",
)
def update_contents(contents, snapshot, inflation_snapshot, dividend_snapshot, equity_snapshot, crypto_snapshot):
    if snapshot["year"] != 2025 or snapshot["units"] != "percent":
        raise ValueError("Expected a 2025 snapshot in percent units")
    supplied = {name: Decimal(value) for name, value in snapshot["returns"].items()}
    expected = {"S&P 500 (includes dividends)", "US Small cap (bottom decile)", "3-month T.Bill",
                "US T. Bond (10-year)", "Baa Corporate Bond", "Real Estate", "Gold*"}
    if set(supplied) != expected or any(not value.is_finite() for value in supplied.values()):
        raise ValueError("Expected exactly the seven verified asset returns")
    for extra, columns in (
        (equity_snapshot, {"International Stocks", "Emerging Markets", "NASDAQ 100"}),
        (crypto_snapshot, {"Bitcoin*", "Ethereum", "XRP", "SOL"}),
    ):
        if extra["year"] != 2025 or extra["units"] != "percent":
            raise ValueError("Expected a 2025 return snapshot in percent units")
        values = {name: Decimal(value) for name, value in extra["returns"].items()}
        if set(values) != columns or any(not value.is_finite() or value < -100 for value in values.values()):
            raise ValueError("Expected verified returns for every remaining asset")
        supplied.update(values)
    if inflation_snapshot["year"] != 2025 or inflation_snapshot["units"] != "percent":
        raise ValueError("Expected a 2025 inflation snapshot in percent units")
    inflation_percent = Decimal(inflation_snapshot["inflation"])
    if not inflation_percent.is_finite() or inflation_percent <= -100:
        raise ValueError("Inflation must be finite and greater than -100 percent")
    inflation = inflation_percent / 100
    if dividend_snapshot["year"] != 2025 or dividend_snapshot["units"] != "percent":
        raise ValueError("Expected a 2025 dividend yield snapshot in percent units")
    dividend_percent = Decimal(dividend_snapshot["dividend_yield"])
    if not dividend_percent.is_finite() or dividend_percent < 0:
        raise ValueError("Dividend yield must be finite and nonnegative")
    nominal_2025 = {}
    updated = {}
    changed = {}
    for filename in FILES:
        lines = contents[filename].splitlines(keepends=True)
        header = lines[0].rstrip("\r\n").split(",")
        output = [lines[0]]
        changed[filename] = 0
        count = 0
        for line in lines[1:]:
            body = line.rstrip("\r\n")
            ending = line[len(body):]
            row = body.split(",")
            year = (int(row[header.index("calendar year")]) if "calendar year" in header
                    else 1968 + int(row[0]) + int(row[1]))
            if year != 2025:
                output.append(line)
                continue
            count += 1
            original = row.copy()
            if filename == FILES[0]:
                for asset, value in supplied.items():
                    row[header.index(asset)] = f"{value:.2f}%"
                row[header.index("inflation")] = f"{inflation_percent:.2f}%"
                row[header.index("SP500 Dividend Yield")] = f"{dividend_percent:.2f}%"
            elif filename == FILES[1]:
                for asset, value in supplied.items():
                    row[header.index(asset)] = f"{value / 100:.4f}"
                row[header.index("inflation")] = f"{inflation:.4f}"
                row[header.index("SP500 Dividend Yield")] = f"{dividend_percent / 100:.4f}"
                nominal_2025[(row[0], row[1])] = dict(zip(header, row))
            elif filename == FILES[2]:
                nominal = nominal_2025[(row[0], row[1])]
                for index, asset in enumerate(header[3:], 3):
                    value = nominal[asset]
                    if asset in ("inflation", "SP500 Dividend Yield") or value in ("", "#N/A"):
                        row[index] = ""
                    else:
                        real = (1 + Decimal(value)) / (1 + inflation) - 1
                        row[index] = f"{real:.4f}"
            else:
                nominal = nominal_2025[(row[0], row[1])]
                risk_free = supplied["3-month T.Bill"] / 100
                for index, asset in enumerate(header[3:], 3):
                    value = nominal[asset]
                    if asset in ("inflation", "SP500 Dividend Yield") or value in ("", "#N/A"):
                        row[index] = ""
                    else:
                        excess = (1 + Decimal(value)) / (1 + risk_free) - 1
                        row[index] = f"{excess:.4f}"
            changed[filename] += sum(before != after for before, after in zip(original, row))
            output.append(",".join(row) + ending)
        if count != 4:
            raise ValueError(f"Expected four 2025 rows in {filename}, found {count}")
        updated[filename] = "".join(output)
    return updated, changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify outputs without writing")
    args = parser.parse_args()
    snapshot = json.loads((ROOT / "data/sources/damodaran-2025.json").read_text())
    inflation_snapshot = json.loads((ROOT / "data/sources/bls-inflation-2025.json").read_text())
    dividend_snapshot = json.loads((ROOT / "data/sources/multpl-sp500-dividend-yield-2025.json").read_text())
    equity_snapshot = json.loads((ROOT / "data/sources/equity-index-returns-2025.json").read_text())
    crypto_snapshot = json.loads((ROOT / "data/sources/coinbase-crypto-returns-2025.json").read_text())
    paths = {name: ROOT / "static/data" / name for name in FILES}
    contents = {name: path.read_bytes().decode("utf-8") for name, path in paths.items()}
    updated, changed = update_contents(contents, snapshot, inflation_snapshot, dividend_snapshot, equity_snapshot, crypto_snapshot)
    if args.check:
        if any(changed.values()):
            raise SystemExit("2025 return files differ from the offline snapshot; run this script to update")
        print("2025 return files match the offline snapshot (no changes).")
        return
    for name, path in paths.items():
        if updated[name] != contents[name]:
            path.write_bytes(updated[name].encode("utf-8"))
        print(f"{name}: {changed[name]} cells updated across four 2025 rows")


if __name__ == "__main__":
    main()
