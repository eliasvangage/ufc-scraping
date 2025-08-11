import requests
from bs4 import BeautifulSoup
import time
import json

headers = {'User-Agent': 'Mozilla/5.0'}
DELAY = 1.0  # seconds between requests to be polite

def clean_text(text):
    return " ".join(text.strip().split())

def get_upcoming_event_links():
    url = "http://ufcstats.com/statistics/events/upcoming"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "lxml")

    event_links = []
    rows = soup.select("table.b-statistics__table-events tbody tr.b-statistics__table-row")

    for row in rows:
        link_tag = row.select_one("a.b-link")
        date_span = row.select_one("span.b-statistics__date")
        location_td = row.select("td")[1] if len(row.select("td")) > 1 else None

        if link_tag and date_span and location_td:
            event_links.append({
                "event_name": clean_text(link_tag.text),
                "event_url": link_tag['href'],
                "date": clean_text(date_span.text),
                "location": clean_text(location_td.text)
            })

    return event_links

def parse_event_card(event):
    res = requests.get(event["event_url"], headers=headers)
    soup = BeautifulSoup(res.text, "lxml")

    fights = []
    fight_rows = soup.select("tbody.b-fight-details__table-body tr.b-fight-details__table-row")

    for i, row in enumerate(fight_rows):
        fighter_links = row.select("td:nth-of-type(2) a")
        weight_td = row.select_one("td:nth-of-type(7)")
        belt_icon = row.select_one("img[src*='belt.png']")  # ✅ Detect title fights via image

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
        "date": event["date"],               # ✅ From event listing (accurate)
        "time": "TBD",                       # ❌ Not available — use placeholder
        "venue": event["location"],          # ✅ Already from event listing
        "fights": fights
    }


def scrape_upcoming_cards():
    events = get_upcoming_event_links()
    all_cards = []

    for event in events:
        print(f"Scraping: {event['event_name']}")
        try:
            card = parse_event_card(event)
            all_cards.append(card)
        except Exception as e:
            print(f"❌ Failed to parse event: {event['event_name']} — {e}")
        time.sleep(DELAY)

    return all_cards

if __name__ == "__main__":
    data = scrape_upcoming_cards()
    with open("upcoming_cards.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Done. Scraped {len(data)} events and saved to upcoming_cards.json")
