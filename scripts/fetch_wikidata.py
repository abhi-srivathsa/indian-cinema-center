"""Fetch cast credits for India-country films from the Wikidata Query Service."""
import csv
import io
import json
import pathlib
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'wikidata_credits.csv'
UA = 'IndianCinemaNetwork/0.1 (https://github.com/abhi-srivathsa)'
rows = []
for start in range(1960, 2030, 5):
    end = min(start + 5, 2027)
    if start >= end:
        break
    query = f'''SELECT ?film ?filmLabel ?actor ?actorLabel ?date WHERE {{
      ?film wdt:P495 wd:Q668 ; wdt:P161 ?actor ; wdt:P577 ?date .
      FILTER(?date >= "{start}-01-01T00:00:00Z"^^xsd:dateTime && ?date < "{end}-01-01T00:00:00Z"^^xsd:dateTime)
      OPTIONAL {{ ?film rdfs:label ?filmLabel . FILTER(LANG(?filmLabel)="en") }}
      OPTIONAL {{ ?actor rdfs:label ?actorLabel . FILTER(LANG(?actorLabel)="en") }}
    }}'''
    url = 'https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': query, 'format': 'json'})
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': UA})
            response = json.load(urllib.request.urlopen(request, timeout=75))
            bindings = response['results']['bindings']
            for item in bindings:
                rows.append({key: item.get(key, {}).get('value', '') for key in ('film', 'filmLabel', 'actor', 'actorLabel', 'date')})
            print(start, end, len(bindings), 'total', len(rows), flush=True)
            break
        except Exception as error:
            print('retry', start, attempt, repr(error), flush=True)
            if attempt == 2:
                raise
            time.sleep(10 * (attempt + 1))
    time.sleep(1)

with OUT.open('w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=('film', 'filmLabel', 'actor', 'actorLabel', 'date'))
    writer.writeheader()
    writer.writerows(rows)
print('saved', OUT, len(rows), flush=True)
