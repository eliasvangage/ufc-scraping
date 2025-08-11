import requests
from bs4 import BeautifulSoup
import json

def normalize_name(name: str) -> str:
    return name.strip().lower().replace("  ", " ")

def scrape_ufc_odds():
    url = "https://sports-statistics.com/ufc/odds/"
    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    odds_map = {}

    table = soup.select_one(".oddstablev2 table")  # Only one table
    if not table:
        print("❌ Could not find odds table")
        return {}

    tbodies = table.find_all("tbody")
    for tbody in tbodies:
        rows = tbody.find_all("tr")
        if len(rows) != 2:
            continue

        try:
            f1 = normalize_name(rows[0].find("th", class_="team_name").text)
            o1 = rows[0].find_all("td")[0].text.strip()
            f2 = normalize_name(rows[1].find("th", class_="team_name").text)
            o2 = rows[1].find_all("td")[0].text.strip()

            key = "|".join(sorted([f1, f2]))  # JSON-safe key
            odds_map[key] = {
                f1: o1,
                f2: o2
            }

        except Exception as e:
            print("⚠️ Error parsing row:", e)
            continue

    return odds_map

if __name__ == "__main__":
    odds = scrape_ufc_odds()
    with open("ufc_odds.json", "w", encoding="utf-8") as f:
        json.dump(odds, f, indent=2)
    print(f"✅ Saved ufc_odds.json with {len(odds)} fights")
