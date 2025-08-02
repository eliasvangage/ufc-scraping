import requests
from bs4 import BeautifulSoup
import time
import json
import string

headers = {'User-Agent': 'Mozilla/5.0'}
BASE_URL = 'http://www.ufcstats.com/statistics/fighters?char={}&page={}'
MAX_FIGHTERS = None
DELAY = 0.1

def clean_text(text):
    return " ".join(text.strip().split())

def get_fighter_stats(profile_url, fighter_name):
    try:
        res = requests.get(profile_url, headers=headers)
        soup = BeautifulSoup(res.text, 'lxml')
        stats = {}
        fights = []

        stat_sections = soup.select("div.b-list__info-box-left, div.b-list__info-box-right")
        for section in stat_sections:
            for item in section.select("li.b-list__box-list-item"):
                label_tag = item.select_one("i.b-list__box-item-title")
                if label_tag:
                    label = clean_text(label_tag.text.strip().rstrip(":"))
                    value = label_tag.next_sibling.strip() if label_tag.next_sibling else None
                    if value and value != '--':
                        stats[label] = value

        fight_table = soup.select_one("table.b-fight-details__table")
        if fight_table:
            rows = fight_table.select("tbody tr.b-fight-details__table-row")
            for row in rows:
                cols = row.select("td")
                if len(cols) < 10:
                    continue

                fighters = cols[1].select("p.b-fight-details__table-text a")
                if len(fighters) != 2:
                    continue

                fighter_1 = fighters[0].text.strip()
                fighter_2 = fighters[1].text.strip()

                if fighter_1.lower() == fighter_name.lower():
                    stats_idx = 0
                elif fighter_2.lower() == fighter_name.lower():
                    stats_idx = 1
                else:
                    continue

                def get_stat(col):
                    values = col.select("p.b-fight-details__table-text")
                    return clean_text(values[stats_idx].text) if len(values) > stats_idx else ""

                fight = {
                    "result": cols[0].select_one("a .b-flag__text").text.strip() if cols[0].select_one("a .b-flag__text") else "",
                    "opponent": fighter_2 if stats_idx == 0 else fighter_1,
                    "KD": get_stat(cols[2]),
                    "STR": get_stat(cols[3]),
                    "TD": get_stat(cols[4]),
                    "SUB": get_stat(cols[5]),
                    "event": clean_text(cols[6].text),
                    "method": clean_text(cols[7].text),
                    "round": clean_text(cols[8].text),
                    "time": clean_text(cols[9].text),
                }
                fights.append(fight)

        return stats, fights

    except Exception as e:
        print(f"[ERROR] {fighter_name}: {e}")
        return {}, []

def get_all_fighters():
    all_fighters = []
    total_count = 0

    for letter in string.ascii_lowercase:
        page = 1
        while True:
            url = BASE_URL.format(letter, page)
            print(f"Fetching: {url}")
            res = requests.get(url, headers=headers)
            soup = BeautifulSoup(res.text, 'lxml')
            rows = soup.select("table.b-statistics__table tbody tr")

            if not rows or all(not row.select_one("a") for row in rows):
                break

            for row in rows:
                if MAX_FIGHTERS and total_count >= MAX_FIGHTERS:
                    return all_fighters

                cols = row.select("td")
                if len(cols) < 10:
                    continue

                link_tag = cols[0].select_one("a")
                if not link_tag:
                    continue

                full_name = f"{link_tag.text.strip()} {cols[1].text.strip()}".strip()
                fighter = {
                    "name": full_name,
                    "nickname": clean_text(cols[2].text),
                    "height": clean_text(cols[3].text),
                    "weight": clean_text(cols[4].text),
                    "reach": clean_text(cols[5].text),
                    "stance": clean_text(cols[6].text),
                    "record": f"{clean_text(cols[7].text)}-{clean_text(cols[8].text)}-{clean_text(cols[9].text)}",
                    "profile_url": link_tag['href']
                }

                stats, fights = get_fighter_stats(fighter["profile_url"], full_name)
                fighter["stats"] = stats
                fighter["fight_history"] = fights

                all_fighters.append(fighter)
                total_count += 1
                print(f"[{total_count}] Scraped {fighter['name']}")
                # time.sleep(DELAY)

            page += 1 

    return all_fighters


if __name__ == "__main__":
    data = get_all_fighters()

    with open("ufc_fighters.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done. Scraped {len(data)} fighters and saved to ufc_fighters.json")
