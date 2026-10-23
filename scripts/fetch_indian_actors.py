"""Find Indian citizenship among actors with at least five qualifying films."""
import collections
import csv
import json
import pathlib
import time
import urllib.parse
import urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
films=set(json.loads((ROOT/'data'/'film_ids.json').read_text()))
counts=collections.defaultdict(set)
for row in csv.DictReader((ROOT/'data'/'wikidata_credits.csv').open()):
    film=row['film'].split('/')[-1]
    if film in films and row['date'][:4] <= '2025':
        counts[row['actor'].split('/')[-1]].add(film)
ids=sorted(a for a,f in counts.items() if len(f)>=5)
found=set()
for index in range(0,len(ids),400):
    batch=ids[index:index+400]
    values=' '.join('wd:'+qid for qid in batch)
    query=f'SELECT DISTINCT ?actor WHERE {{ VALUES ?actor {{ {values} }} ?actor wdt:P27 wd:Q668 . }}'
    url='https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':query,'format':'json'})
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'IndianCinemaNetwork/0.1 (https://github.com/abhi-srivathsa)'})
            data=json.load(urllib.request.urlopen(req,timeout=75))
            found.update(b['actor']['value'].split('/')[-1] for b in data['results']['bindings'])
            print(index,len(batch),len(found),flush=True)
            break
        except Exception as e:
            print('retry',index,repr(e),flush=True)
            if attempt==2: raise
            time.sleep(10*(attempt+1))
    time.sleep(1)
(ROOT/'data'/'indian_actor_ids.json').write_text(json.dumps(sorted(found)))
print('saved',len(found),'of',len(ids))
