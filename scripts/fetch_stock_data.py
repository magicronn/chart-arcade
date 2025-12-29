#!/usr/bin/env python3
"""
Chart Arcade - Stock Data Fetcher

Downloads historical OHLCV data from Yahoo Finance and saves as JSON files
ready for the Chart Arcade application.

Usage:
    pip install yfinance
    python scripts/fetch_stock_data.py

Configuration:
    Edit SYMBOLS and YEARS_OF_DATA below to customize the data fetch.
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path

try:
    import yfinance as yf
except ImportError:
    print("Error: yfinance not installed.")
    print("Run: pip install yfinance")
    exit(1)


# =============================================================================
# Configuration
# =============================================================================

# SYMBOLS = ["TSLA", "RCL", "SPY", "IWM"]
SYMBOLS = ["AAPL", "UAL", "AXON", "T"]
YEARS_OF_DATA = 3

# Sector mapping for the symbols
SECTOR_MAP = {
    "UAL": "Consumer Cyclical",
    "T": "Consumer Cyclical",
    "AXON": "Technology",
    "AAPL": "Technology",
}

# Company names
NAME_MAP = {
    "UAL": "United Airlines Holdings, Inc.",
    "T": "AT&T Inc.",
    "AXON": "Axon Enterprise, Inc.",
    "AAPL": "Apple Inc.",
}

# Output directories
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "src" / "data" / "stocks"
METADATA_FILE = PROJECT_ROOT / "src" / "data" / "metadata.json"


# =============================================================================
# Data Fetching
# =============================================================================

def fetch_stock_data(symbol: str, years: int) -> dict | None:
    """
    Fetch historical daily OHLCV data for a symbol.

    Args:
        symbol: Stock ticker symbol
        years: Number of years of historical data to fetch

    Returns:
        Dictionary with stock data or None if fetch failed
    """
    print(f"Fetching {symbol}...")

    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years * 365)

        # Fetch data from Yahoo Finance
        ticker = yf.Ticker(symbol)
        df = ticker.history(
            start=start_date.strftime("%Y-%m-%d"),
            end=end_date.strftime("%Y-%m-%d"),
            interval="1d"
        )

        if df.empty:
            print(f"  Warning: No data returned for {symbol}")
            return None

        # Convert to our format
        bars = []
        for date, row in df.iterrows():
            bar = {
                "time": date.strftime("%Y-%m-%d"),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"]),
            }
            bars.append(bar)

        # Sort by date ascending
        bars.sort(key=lambda x: x["time"])

        # Build stock data object
        stock_data = {
            "ticker": symbol,
            "name": NAME_MAP.get(symbol, symbol),
            "sector": SECTOR_MAP.get(symbol, "Unknown"),
            "bars": bars,
        }

        print(f"  Downloaded {len(bars)} bars from {bars[0]['time']} to {bars[-1]['time']}")
        return stock_data

    except Exception as e:
        print(f"  Error fetching {symbol}: {e}")
        return None


def save_stock_data(stock_data: dict) -> bool:
    """
    Save stock data to JSON file.

    Args:
        stock_data: Stock data dictionary

    Returns:
        True if saved successfully
    """
    try:
        # Create output directory if needed
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        # Save to file
        filename = OUTPUT_DIR / f"{stock_data['ticker'].lower()}.json"
        with open(filename, "w") as f:
            json.dump(stock_data, f, indent=2)

        print(f"  Saved to {filename}")
        return True

    except Exception as e:
        print(f"  Error saving {stock_data['ticker']}: {e}")
        return False


def generate_metadata_from_files() -> list[dict]:
    """
    Scan the stocks directory and generate metadata from all existing JSON files.

    Returns:
        List of metadata dictionaries for all stocks found
    """
    metadata = []

    if not OUTPUT_DIR.exists():
        print(f"Warning: Stocks directory does not exist: {OUTPUT_DIR}")
        return metadata

    # Find all JSON files in the stocks directory
    json_files = sorted(OUTPUT_DIR.glob("*.json"))

    for json_file in json_files:
        try:
            with open(json_file, "r") as f:
                stock = json.load(f)

            if "bars" not in stock or len(stock["bars"]) == 0:
                print(f"  Warning: {json_file.name} has no bars, skipping")
                continue

            meta = {
                "ticker": stock["ticker"],
                "name": stock.get("name", stock["ticker"]),
                "sector": stock.get("sector", "Unknown"),
                "startDate": stock["bars"][0]["time"],
                "endDate": stock["bars"][-1]["time"],
                "barCount": len(stock["bars"]),
            }
            metadata.append(meta)

        except Exception as e:
            print(f"  Error reading {json_file.name}: {e}")

    return metadata


def save_metadata(metadata: list[dict]) -> None:
    """
    Save metadata index file.

    Args:
        metadata: List of stock metadata dictionaries
    """
    METADATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nMetadata saved to {METADATA_FILE}")
    print(f"  Total stocks indexed: {len(metadata)}")


def generate_metadata(_stocks: list[dict] | None = None) -> None:
    """
    Generate metadata index file for all stocks in the directory.
    This scans the stocks directory to include ALL existing stock files,
    not just the ones that were just fetched.

    Args:
        _stocks: Unused, kept for backwards compatibility
    """
    metadata = generate_metadata_from_files()
    save_metadata(metadata)


def print_summary(stocks: list[dict]) -> None:
    """Print summary of downloaded data."""
    print("\n" + "=" * 60)
    print("DOWNLOAD SUMMARY")
    print("=" * 60)

    for stock in stocks:
        bars = stock["bars"]
        print(f"\n{stock['ticker']} ({stock['name']})")
        print(f"  Sector: {stock['sector']}")
        print(f"  Date Range: {bars[0]['time']} to {bars[-1]['time']}")
        print(f"  Total Bars: {len(bars)}")

        # Calculate price range
        closes = [b["close"] for b in bars]
        print(f"  Price Range: ${min(closes):.2f} - ${max(closes):.2f}")

        # Check for gaps
        gaps = 0
        for i in range(1, len(bars)):
            prev_date = datetime.strptime(bars[i-1]["time"], "%Y-%m-%d")
            curr_date = datetime.strptime(bars[i]["time"], "%Y-%m-%d")
            days_diff = (curr_date - prev_date).days
            if days_diff > 5:  # More than a week gap
                gaps += 1

        if gaps > 0:
            print(f"  Significant Gaps: {gaps}")

    print("\n" + "=" * 60)


# =============================================================================
# Main
# =============================================================================

def main():
    import sys

    # Check for --refresh-metadata flag to only regenerate metadata
    if "--refresh-metadata" in sys.argv:
        print("=" * 60)
        print("Chart Arcade - Refreshing Metadata")
        print("=" * 60)
        print(f"\nScanning stocks directory: {OUTPUT_DIR}")
        generate_metadata()
        return

    print("=" * 60)
    print("Chart Arcade - Stock Data Fetcher")
    print("=" * 60)
    print(f"\nSymbols: {', '.join(SYMBOLS)}")
    print(f"Years of data: {YEARS_OF_DATA}")
    print(f"Output directory: {OUTPUT_DIR}\n")

    stocks = []

    for symbol in SYMBOLS:
        stock_data = fetch_stock_data(symbol, YEARS_OF_DATA)
        if stock_data:
            if save_stock_data(stock_data):
                stocks.append(stock_data)

    if stocks:
        generate_metadata()
        print_summary(stocks)
        print(f"\nSuccess! Downloaded data for {len(stocks)}/{len(SYMBOLS)} symbols.")
    else:
        print("\nError: No data was downloaded.")
        exit(1)


if __name__ == "__main__":
    main()
