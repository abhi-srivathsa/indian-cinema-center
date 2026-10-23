"""Create a compact graph input from the pinned Wikidata extract."""
import collections
import csv
import json
import pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
valid_films=set(json.loads((ROOT/'data'/'film_ids.json').read_text()))
indian=set(json.loads((ROOT/'data'/'indian_actor_ids.json').read_text()))
films={}
people={}
for row in csv.DictReader((ROOT/'data'/'wikidata_credits.csv').open()):
    film=row['film'].split('/')[-1]
    year=int(row['date'][:4])
    if film not in valid_films or year>2025 or year<1960:
        continue
    actor=row['actor'].split('/')[-1]
    if film not in films:
        films[film]={'id':film,'title':row['filmLabel'] or film,'year':year,'cast':set()}
    films[film]['year']=min(films[film]['year'],year)
    films[film]['cast'].add(actor)
    if actor not in people:
        people[actor]={'id':actor,'name':row['actorLabel'] or actor}
    elif people[actor]['name']==actor and row['actorLabel']:
        people[actor]['name']=row['actorLabel']
films={k:v for k,v in films.items() if len(v['cast'])>=2}
used={a for f in films.values() for a in f['cast']}
people={k:v for k,v in people.items() if k in used}
ids=sorted(people)
lookup={k:i for i,k in enumerate(ids)}
counts=collections.Counter(a for f in films.values() for a in f['cast'])
candidates=[lookup[a] for a in ids if counts[a]>=5 and a in indian]
with (ROOT/'data'/'graph_input.txt').open('w') as out:
    out.write(f'{len(ids)} {len(films)}\n')
    for film in sorted(films.values(), key=lambda f:(f['year'],f['id'])):
        cast=sorted(lookup[a] for a in film['cast'])
        out.write(' '.join(map(str,[film['year'],len(cast),*cast]))+'\n')
    out.write(str(len(candidates))+'\n')
    out.write(' '.join(map(str,candidates))+'\n')
metadata={'actors':[people[a] for a in ids], 'films':[{**{k:v for k,v in f.items() if k!='cast'},'cast':sorted(lookup[a] for a in f['cast'])} for f in films.values()], 'candidateCount':len(candidates)}
(ROOT/'data'/'metadata.json').write_text(json.dumps(metadata,ensure_ascii=False))
print('films',len(films),'actors',len(ids),'Indian candidates',len(candidates))
