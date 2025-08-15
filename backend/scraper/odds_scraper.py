import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

JSON_PATH = "ufc_odds.json"

def normalize_name(name: str) -> str:
    # collapse spaces, lowercase
    return " ".join(name.strip().lower().split())

def scrape_ufc_odds():
    url = "https://sports-statistics.com/ufc/odds/"
    headers = {"User-Agent": "Mozilla/5.0"}

    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    odds_map = {}
    table = soup.select_one(".oddstablev2 table")
    if not table:
        print("❌ Could not find odds table")
        return odds_map

    for tbody in table.find_all("tbody"):
        rows = tbody.find_all("tr")
        if len(rows) != 2:
            continue
        try:
            f1 = normalize_name(rows[0].find("th", class_="team_name").get_text(strip=True))
            o1 = rows[0].find_all("td")[0].get_text(strip=True)

            f2 = normalize_name(rows[1].find("th", class_="team_name").get_text(strip=True))
            o2 = rows[1].find_all("td")[0].get_text(strip=True)

            key = "|".join(sorted([f1, f2]))
            odds_map[key] = {f1: o1, f2: o2}
        except Exception as e:
            print("⚠️ Error parsing a fight row:", e)
            continue
    return odds_map

def load_existing(path: str):
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Failed to read existing {path}: {e}")
        return {}

def backup_file(path: str):
    if not os.path.exists(path):
        return
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    bak = f"{path}.bak.{ts}"
    try:
        with open(path, "rb") as src, open(bak, "wb") as dst:
            dst.write(src.read())
        print(f"🗂️  Backup created: {bak}")
    except Exception as e:
        print(f"⚠️ Failed to create backup: {e}")

def merge_odds(existing: dict, fresh: dict):
    added, updated, unchanged = 0, 0, 0
    merged = dict(existing)

    for key, new_val in fresh.items():
        if key not in merged:
            merged[key] = new_val
            added += 1
        else:
            # Compare values; update if different
            if merged[key] != new_val:
                merged[key] = new_val
                updated += 1
            else:
                unchanged += 1
    return merged, added, updated, unchanged

if __name__ == "__main__":
    print("🔎 Scraping latest odds…")
    fresh_odds = scrape_ufc_odds()
    print(f"📥 Scraped {len(fresh_odds)} fights")

    print("📖 Loading existing JSON…")
    existing = load_existing(JSON_PATH)
    print(f"🗃️  Existing fights: {len(existing)}")

    merged, added, updated, unchanged = merge_odds(existing, fresh_odds)
    print(f"➕ Added: {added}   ✏️ Updated: {updated}   ➖ Unchanged: {unchanged}")
    print(f"🧮 Total in file after merge: {len(merged)}")

    backup_file(JSON_PATH)

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {JSON_PATH}")
