"""Retrieve exact Wikidata film-type IDs for filtering cast credits."""
import json
import pathlib
import urllib.parse
import urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
query = 'SELECT DISTINCT ?film WHERE { ?film wdt:P495 wd:Q668 ; wdt:P31 wd:Q11424 ; wdt:P161 ?actor ; wdt:P577 ?date . FILTER(?date >= "1960-01-01T00:00:00Z"^^xsd:dateTime && ?date < "2026-01-01T00:00:00Z"^^xsd:dateTime) }'
url = 'https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query':query,'format':'json'})
req=urllib.request.Request(url,headers={'User-Agent':'IndianCinemaNetwork/0.1 (https://github.com/abhi-srivathsa)'})
data=json.load(urllib.request.urlopen(req,timeout=75))
ids=sorted({b['film']['value'].split('/')[-1] for b in data['results']['bindings']})
(ROOT/'data'/'film_ids.json').write_text(json.dumps(ids))
print('film ids',len(ids))
