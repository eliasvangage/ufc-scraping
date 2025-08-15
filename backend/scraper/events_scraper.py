import requests
from bs4 import BeautifulSoup
import time
import json
import os
from datetime import datetime

headers = {'User-Agent': 'Mozilla/5.0'}
DELAY = 1.0  # seconds between requests to be polite
JSON_PATH = "upcoming_cards.json"

def clean_text(text):
    return " ".join(text.strip().split())

def get_upcoming_event_links():
    url = "http://ufcstats.com/statistics/events/upcoming"
    res = requests.get(url, headers=headers, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "lxml")

    event_links = []
    rows = soup.select("table.b-statistics__table-events tbody tr.b-statistics__table-row")

    for row in rows:
        link_tag = row.select_one("a.b-link")
        date_span = row.select_one("span.b-statistics__date")
        tds = row.select("td")
        location_td = tds[1] if len(tds) > 1 else None

        if link_tag and date_span and location_td:
            event_links.append({
                "event_name": clean_text(link_tag.text),
                "event_url": link_tag['href'],
                "date": clean_text(date_span.text),
                "location": clean_text(location_td.text)
            })

    return event_links

def parse_event_card(event):
    res = requests.get(event["event_url"], headers=headers, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "lxml")

    fights = []
    fight_rows = soup.select("tbody.b-fight-details__table-body tr.b-fight-details__table-row")

    for i, row in enumerate(fight_rows):
        fighter_links = row.select("td:nth-of-type(2) a")
        weight_td = row.select_one("td:nth-of-type(7)")
        belt_icon = row.select_one("img[src*='belt.png']")  # title fight indicator

        if len(fighter_links) == 2:
            red_name = clean_text(fighter_links[0].text)
            red_url = fighter_links[0]["href"]
            blue_name = clean_text(fighter_links[1].text)
            blue_url = fighter_links[1]["href"]
            weight_class = clean_text(weight_td.text) if weight_td else "Unknown"

            fights.append({
                "fighter_red": red_name,
                "fighter_red_url": red_url,
                "fighter_blue": blue_name,
                "fighter_blue_url": blue_url,
                "weight_class": weight_class,
                "bout_order": i + 1,
                "is_title_fight": belt_icon is not None
            })

    return {
        "event_name": event["event_name"],
        "event_url": event["event_url"],
        "date": event["date"],               # from listing
        "time": "TBD",
        "venue": event["location"],
        "fights": fights,
        "last_scraped": datetime.utcnow().isoformat(timespec="seconds") + "Z"
    }

def scrape_upcoming_cards():
    events = get_upcoming_event_links()
    cards = []
    for event in events:
        print(f"Scraping: {event['event_name']}")
        try:
            cards.append(parse_event_card(event))
        except Exception as e:
            print(f"❌ Failed to parse event: {event['event_name']} — {e}")
        time.sleep(DELAY)
    return cards

def load_existing(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            # If old file was a dict, convert to list safely
            return list(data.values())
    except Exception as e:
        print(f"⚠️ Failed to read existing {path}: {e}")
        return []

def backup_file(path):
    if not os.path.exists(path):
        return
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    bak = f"{path}.bak.{ts}"
    try:
        with open(path, "rb") as src, open(bak, "wb") as dst:
            dst.write(src.read())
        print(f"🗂️  Backup created: {bak}")
    except Exception as e:
        print(f"⚠️ Failed to create backup: {e}")

def upsert_cards(existing_list, fresh_list):
    # Index existing by event_url (stable key)
    index = {e.get("event_url"): e for e in existing_list if e.get("event_url")}
    added = updated = 0

    for new_evt in fresh_list:
        key = new_evt.get("event_url")
        if not key:
            continue
        if key in index:
            # Update metadata and REPLACE fights entirely (card changed)
            old = index[key]
            old.update({
                "event_name": new_evt["event_name"],
                "date": new_evt["date"],
                "time": new_evt["time"],
                "venue": new_evt["venue"],
                "fights": new_evt["fights"],
                "last_scraped": new_evt["last_scraped"],
            })
            updated += 1
        else:
            index[key] = new_evt
            added += 1

    merged = list(index.values())
    return merged, added, updated

if __name__ == "__main__":
    print("🔎 Scraping upcoming events…")
    fresh = scrape_upcoming_cards()
    print(f"📥 Scraped {len(fresh)} upcoming events")

    print("📖 Loading existing file…")
    existing = load_existing(JSON_PATH)
    print(f"🗃️ Existing events in file: {len(existing)}")

    merged, added, updated = upsert_cards(existing, fresh)
    print(f"➕ Added: {added}   ✏️ Updated: {updated}   🧮 Total after merge: {len(merged)}")

    backup_file(JSON_PATH)

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {JSON_PATH}")
