import fs from 'node:fs';
const [input, rankingPath, historyPath] = process.argv.slice(2);
const tokens = fs.readFileSync(input,'utf8').trim().split(/\s+/).map(Number);
let at=0; const n=tokens[at++], m=tokens[at++];
const films=[];
for(let i=0;i<m;i++){const year=tokens[at++], k=tokens[at++];films.push({year,cast:tokens.slice(at,at+k)});at+=k;}
const c=tokens[at++], candidates=tokens.slice(at,at+c);
function build(through){
  const links=Array.from({length:n},()=>new Set()),counts=new Uint16Array(n);
  for(const f of films){if(f.year>through)continue;const cast=f.cast;
    for(const a of cast) counts[a]++;
    for(let i=0;i<cast.length;i++)for(let j=i+1;j<cast.length;j++){links[cast[i]].add(cast[j]);links[cast[j]].add(cast[i]);}
  }
  const adj=links.map(x=>Array.from(x));
  const component=new Int32Array(n).fill(-1);let giant=-1,size=0,ci=0;
  for(let a=0;a<n;a++)if(component[a]===-1 && adj[a].length){let stack=[a],s=0;component[a]=ci;
    while(stack.length){const u=stack.pop();s++;for(const v of adj[u])if(component[v]===-1){component[v]=ci;stack.push(v);}}
    if(s>size){size=s;giant=ci;}ci++;
  }
  return {adj,counts,component,giant,size};
}
function score(g,source){
  if(g.component[source]!==g.giant||g.size<2)return NaN;
  const dist=new Uint16Array(n),queue=new Int32Array(g.size);let head=0,tail=0,sum=0;
  queue[tail++]=source;dist[source]=1;
  while(head<tail){const u=queue[head++],next=dist[u]+1;for(const v of g.adj[u])if(!dist[v]){dist[v]=next;sum+=next-1;queue[tail++]=v;}}
  return tail===g.size?sum/(g.size-1):NaN;
}
const full=build(2025);
const ranked=candidates.filter(a=>full.component[a]===full.giant).map(actor=>({actor,score:score(full,actor),films:full.counts[actor],costars:full.adj[actor].length,component:full.size})).sort((a,b)=>a.score-b.score);
fs.writeFileSync(rankingPath,'actor\tscore\tfilms\tcostars\tcomponent\n'+ranked.map(r=>`${r.actor}\t${r.score}\t${r.films}\t${r.costars}\t${r.component}`).join('\n')+'\n');
const top=ranked.slice(0,8).map(r=>r.actor),history=['year\tactor\tscore\tcomponent'];
for(let year=1980;year<=2025;year++){
  const g=build(year);
  for(const actor of top)if(g.counts[actor]>=5 && g.component[actor]===g.giant)history.push(`${year}\t${actor}\t${score(g,actor)}\t${g.size}`);
  if(year%10===0)console.log('history',year,'component',g.size);
}
fs.writeFileSync(historyPath,history.join('\n')+'\n');
console.log('ranked',ranked.length,'component',full.size,'winner',ranked[0]);
