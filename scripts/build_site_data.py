"""Turn the scored graph into the small public JSON used by the website."""
import csv
import datetime
import json
import pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
metadata=json.loads((ROOT/'data'/'metadata.json').read_text())
ranking=list(csv.DictReader((ROOT/'data'/'ranking.tsv').open(),delimiter='\t'))
history=list(csv.DictReader((ROOT/'data'/'history.tsv').open(),delimiter='\t'))
actors=[]
for rank,row in enumerate(ranking,1):
    source=metadata['actors'][int(row['actor'])]
    actors.append({'id':source['id'],'name':source['name'],'rank':rank,'score':round(float(row['score']),4),'films':int(row['films']),'costars':int(row['costars'])})
by_index={int(row['actor']):metadata['actors'][int(row['actor'])]['id'] for row in ranking}
series=[]
for row in history:
    series.append({'year':int(row['year']),'id':by_index[int(row['actor'])],'rank':int(row['rank']),'score':round(float(row['score']),4)})
source_credits=sum(1 for _ in (ROOT/'data'/'wikidata_credits.csv').open())-1
out={'meta':{'asOf':'2026-10-23','fromYear':1960,'throughYear':2025,'films':len(metadata['films']),'actors':len(metadata['actors']),'ranked':len(actors),'component':int(ranking[0]['component']),'credits':source_credits,'source':'Wikidata Query Service'},'actors':actors,'history':series,'topIds':[a['id'] for a in actors[:8]]}
public=ROOT/'public';public.mkdir(exist_ok=True)
payload=json.dumps(out,ensure_ascii=False,separators=(',',':'))
(public/'data.json').write_text(payload)
source=ROOT/'src';source.mkdir(exist_ok=True)
(source/'data.json').write_text(payload)
print('wrote',public/'data.json',len(actors),'actors',len(series),'history points')
