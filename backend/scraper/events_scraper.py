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
    rows = soup.select("tbody tr")

    for row in rows:
        link_tag = row.select_one("a")
        date_td = row.select_one("td:nth-of-type(2)")
        if link_tag and "event-details" in link_tag['href']:
            event_links.append({
                "event_name": clean_text(link_tag.text),
                "event_url": link_tag['href'],
                "date": clean_text(date_td.text) if date_td else "Unknown"
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
                "bout_order": i + 1
            })

    # Extract time and venue from event summary
    event_info_box = soup.select_one(".b-list__box-list")
    info_items = event_info_box.select("li") if event_info_box else []

    time_str = "TBD"
    venue_str = "TBD"

    for item in info_items:
        label = clean_text(item.text)
        if "ET" in label:
            time_str = label
        elif "," in label:
            venue_str = label

    return {
        "event_name": event["event_name"],
        "event_url": event["event_url"],
        "date": event["date"],
        "time": time_str,
        "venue": venue_str,
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
