import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import data from './data.json';
import './styles.css';

const actors = data.actors;
const byId = new Map(actors.map(actor => [actor.id, actor]));
const number = value => new Intl.NumberFormat('en-US').format(value);
const score = value => Number(value).toFixed(2);
const colorSet = ['#e34d32', '#207e85', '#ba8a29', '#745b9d', '#ca6f48', '#44774e', '#927167', '#556a8e'];

function SectionHeading({ number: index, eyebrow, title, children }) {
  return <div className="section-heading">
    <span className="section-index">{index} / {eyebrow}</span>
    <div className="section-heading-inner"><h2>{title}</h2>{children && <p>{children}</p>}</div>
  </div>;
}

function Hero({ onExplore }) {
  return <section className="hero" id="top">
    <div className="hero-grain" />
    <div className="hero-main page-width">
      <div className="hero-copy">
        <div className="eyebrow light"><span className="eyebrow-line" /> AN INTERACTIVE FILM NETWORK</div>
        <h1>Who’s at the<br /><em>center</em> of<br />Indian cinema?</h1>
        <p className="hero-intro">A film can connect two actors. A lifetime of films can connect an entire industry. We mapped the co-stars to find out who sits closest to everyone else.</p>
        <button className="round-link" onClick={onExplore}><span className="round-arrow">↘</span><span>Explore the ranking</span></button>
      </div>
      <div className="hero-result" aria-label="Top five actors">
        <div className="result-topline"><span>THE 2025 CENTER</span><span>RANK / 01</span></div>
        <div className="result-orbit" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit orbit-three" /><span className="orbit-core">JS</span><span className="orbit-caption orbit-caption-one">1 film away</span><span className="orbit-caption orbit-caption-two">2 films away</span></div>
        <div className="result-name">{actors[0].name}</div>
        <div className="result-score"><strong>{score(actors[0].score)}</strong><span>average degrees<br />from another actor</span></div>
        <div className="result-divider" />
        <div className="result-runner"><span>FOLLOWED BY</span><span>{actors.slice(1, 4).map(a => a.name).join(' · ')}</span></div>
      </div>
    </div>
    <div className="hero-bottom page-width"><span>Based on {number(data.meta.films)} Indian films, 1960–2025</span><span>SCROLL TO EXPLORE ↓</span></div>
  </section>;
}

function StatBar() {
  return <div className="statbar"><div className="page-width stat-grid">
    <div><strong>{number(data.meta.films)}</strong><span>films mapped</span></div>
    <div><strong>{number(data.meta.actors)}</strong><span>actors in the network</span></div>
    <div><strong>{number(data.meta.ranked)}</strong><span>Indian actors ranked</span></div>
    <div><strong>{number(data.meta.component)}</strong><span>in the largest connected group</span></div>
  </div></div>;
}

function ActorSpotlight({ actor }) {
  return <div className="spotlight">
    <div className="spotlight-head"><span>ACTOR IN FOCUS</span><span className="spotlight-rank">#{number(actor.rank)} OVERALL</span></div>
    <div className="spotlight-body"><div><h3>{actor.name}</h3><a href={`https://www.wikidata.org/wiki/${actor.id}`} target="_blank" rel="noreferrer">Wikidata profile ↗</a></div><div className="spotlight-stats"><div><strong>{score(actor.score)}</strong><span>remoteness</span></div><div><strong>{number(actor.films)}</strong><span>films</span></div><div><strong>{number(actor.costars)}</strong><span>distinct co-stars</span></div></div></div>
  </div>;
}

function Ranking({ selectedId, onSelect }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(12);
  const results = useMemo(() => actors.filter(actor => actor.name.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim())), [query]);
  const visible = results.slice(0, shown);
  return <section className="ranking-section page-width" id="ranking">
    <SectionHeading number="01" eyebrow="THE LEADERBOARD" title={<>The center has<br />a name.</>}>A lower remoteness score means fewer co-star steps to the rest of the network. Search any ranked actor and see how they compare.</SectionHeading>
    <div className="ranking-layout">
      <div className="ranking-list">
        <div className="ranking-toolbar"><div><span className="toolbar-label">2025 RANKING</span><p>{number(results.length)} {results.length === 1 ? 'actor' : 'actors'}</p></div><label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => { setQuery(event.target.value); setShown(12); }} placeholder="Search an actor" aria-label="Search an actor" />{query && <button onClick={() => setQuery('')} aria-label="Clear search">×</button>}</label></div>
        <div className="rank-table-head"><span>RANK / ACTOR</span><span>FILMS</span><span>CO-STARS</span><span>REMOTENESS</span></div>
        <div className="rank-table-body">{visible.map(actor => <button key={actor.id} className={`rank-row ${selectedId === actor.id ? 'selected' : ''}`} onClick={() => onSelect(actor.id)} aria-pressed={selectedId === actor.id}><span className="rank-name"><span className="rank-number">{String(actor.rank).padStart(2, '0')}</span><span>{actor.name}</span></span><span>{number(actor.films)}</span><span>{number(actor.costars)}</span><strong>{score(actor.score)}</strong></button>)}</div>
        {visible.length === 0 && <p className="no-results">No actors found. Try another spelling.</p>}
        {shown < results.length && <button className="load-more" onClick={() => setShown(n => n + 20)}>Show more actors <span>↓</span></button>}
      </div>
      <div className="ranking-aside"><ActorSpotlight actor={byId.get(selectedId)} /><div className="reading-note"><span className="note-symbol">↗</span><p><strong>Read the score</strong>{byId.get(selectedId).name} is, on average, {score(byId.get(selectedId).score)} film links away from another actor in the connected network.</p></div></div>
    </div>
  </section>;
}

function LineChart({ selectedId, onSelect }) {
  const [hoverYear, setHoverYear] = useState(null);
  const width = 940, height = 390, left = 52, right = 18, top = 18, bottom = 40;
  const px = year => left + (year - 1980) / 45 * (width - left - right);
  const py = value => top + (value - 2) / 1.65 * (height - top - bottom);
  const groups = data.topIds.map((id, index) => ({ id, index, actor: byId.get(id), points: data.history.filter(point => point.id === id) }));
  const yearData = hoverYear ? groups.map(group => ({ ...group, point: group.points.find(p => p.year === hoverYear) })).filter(x => x.point).sort((a, b) => a.point.score - b.point.score) : [];
  return <div className="timeline-card">
    <div className="timeline-head"><div><span className="small-label">REMOTENESS OVER TIME</span><h3>How today’s leaders moved</h3></div><span className="chart-caption">LOWER IS CLOSER TO THE CENTER ↓</span></div>
    <div className="chart-scroll"><svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart showing remoteness scores of the top eight actors from 1980 to 2025">
      {[2, 2.5, 3, 3.5].map(tick => <g key={tick}><line className="grid-line" x1={left} x2={width-right} y1={py(tick)} y2={py(tick)} /><text className="axis-label" x={left-10} y={py(tick)+4} textAnchor="end">{tick.toFixed(1)}</text></g>)}
      {[1980,1990,2000,2010,2020,2025].map(year => <text key={year} className="axis-label" x={px(year)} y={height-9} textAnchor={year===1980?'start':year===2025?'end':'middle'}>{year}</text>)}
      {groups.map(group => <path key={group.id} d={group.points.map((p,i) => `${i?'L':'M'}${px(p.year).toFixed(1)},${py(p.score).toFixed(1)}`).join(' ')} fill="none" stroke={colorSet[group.index]} strokeWidth={selectedId===group.id?3.5:2.1} strokeOpacity={selectedId===group.id||!data.topIds.includes(selectedId)?1:.28} strokeLinecap="round" strokeLinejoin="round" />)}
      {hoverYear && <line x1={px(hoverYear)} x2={px(hoverYear)} y1={top} y2={height-bottom} stroke="#30312c" strokeWidth="1" strokeDasharray="3 4" />}
      {hoverYear && yearData.map(group => <circle key={group.id} cx={px(hoverYear)} cy={py(group.point.score)} r="4.5" fill={colorSet[group.index]} stroke="#fff" strokeWidth="1.5" />)}
      <rect x={left} y={top} width={width-left-right} height={height-top-bottom} fill="transparent" onMouseMove={event => {const rect=event.currentTarget.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width;setHoverYear(Math.max(1980,Math.min(2025,Math.round(1980+x*45))))}} onMouseLeave={() => setHoverYear(null)} />
    </svg></div>
    {hoverYear && <div className="year-tooltip"><strong>{hoverYear}</strong><div>{yearData.map(group => <span key={group.id}><i style={{background:colorSet[group.index]}} />{group.actor.name} <b>{score(group.point.score)}</b></span>)}</div></div>}
    <div className="chart-legend">{groups.map(group => <button key={group.id} onClick={() => onSelect(group.id)} className={selectedId===group.id?'active':''}><i style={{background:colorSet[group.index]}} />{group.actor.name}</button>)}</div>
    <p className="chart-footnote">The network is rebuilt through each year. A line begins after an actor has at least five films in the connected group.</p>
  </div>;
}

function Scatter({ variant, selectedId, onSelect }) {
  const [hover, setHover] = useState(null);
  const isRemoteness = variant === 'remoteness';
  const width = 600, height = 375, left=56, right=18, top=22, bottom=42;
  const x = value => left + (Math.log10(value)-Math.log10(5))/(Math.log10(600)-Math.log10(5))*(width-left-right);
  const y = value => isRemoteness ? top+(value-2)/(4.5-2)*(height-top-bottom) : top+(Math.log10(1000)-Math.log10(Math.max(4,value)))/(Math.log10(1000)-Math.log10(4))*(height-top-bottom);
  const yTicks = isRemoteness ? [2,2.5,3,3.5,4,4.5] : [10,30,100,300,1000];
  const selected = byId.get(selectedId);
  return <div className="scatter-card"><div className="scatter-head"><span className="small-label">{isRemoteness ? '02 / THE FILM COUNT QUESTION' : '03 / THE CO-STAR QUESTION'}</span><h3>{isRemoteness ? 'More films, closer center?' : 'More films, more co-stars?'}</h3><p>{isRemoteness ? 'A long filmography helps, but the people in those films matter too.' : 'Every film opens a set of new possible connections.'}</p></div>
    <div className="chart-scroll"><svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={isRemoteness?'Scatter plot of film count versus remoteness':'Scatter plot of film count versus distinct co-stars'}>
      {yTicks.map(tick => <g key={tick}><line className="grid-line" x1={left} x2={width-right} y1={y(tick)} y2={y(tick)} /><text className="axis-label" x={left-9} y={y(tick)+4} textAnchor="end">{tick}</text></g>)}
      {[5,10,20,50,100,200,500].map(tick => <text key={tick} className="axis-label" x={x(tick)} y={height-14} textAnchor="middle">{tick}</text>)}
      {actors.map(actor => <circle key={actor.id} cx={x(actor.films)} cy={y(isRemoteness?actor.score:actor.costars)} r={actor.rank<=10?3.8:2.8} fill={actor.rank<=10?'#de563b':'#3e6262'} opacity={actor.id===selectedId?0:actor.rank<=10?.85:.23} onMouseEnter={event=>setHover({actor,x:event.clientX,y:event.clientY})} onMouseMove={event=>setHover({actor,x:event.clientX,y:event.clientY})} onMouseLeave={()=>setHover(null)} onClick={()=>onSelect(actor.id)} className="scatter-point" />)}
      <circle cx={x(selected.films)} cy={y(isRemoteness?selected.score:selected.costars)} r="8" fill="#e34d32" stroke="#fff" strokeWidth="2.5" pointerEvents="none" />
    </svg></div>
    <div className="axis-caption">FILM COUNT <span>→</span></div>
    <div className="scatter-bottom"><span>{isRemoteness?'REMOTENESS · LOWER IS BETTER':'DISTINCT CO-STARS · HIGHER IS MORE'}</span><span>LOG FILM SCALE</span></div>
    {hover && <div className="scatter-tooltip" style={{left:Math.min(hover.x+12,window.innerWidth-190),top:Math.max(hover.y-70,10)}}><strong>{hover.actor.name}</strong><span>#{number(hover.actor.rank)} · {number(hover.actor.films)} films</span><span>{isRemoteness?`${score(hover.actor.score)} remoteness`:`${number(hover.actor.costars)} co-stars`}</span></div>}
  </div>;
}

function Story({ selectedId, onSelect }) {
  return <><section className="timeline-section page-width" id="over-time"><SectionHeading number="02" eyebrow="THE TIME MACHINE" title={<>The center<br />keeps moving.</>}>Follow today’s eight closest actors through the changing film network, year by year from 1980 to 2025.</SectionHeading><LineChart selectedId={selectedId} onSelect={onSelect} /></section>
    <section className="scatter-section" id="connections"><div className="page-width"><SectionHeading number="03" eyebrow="THE CONNECTIONS" title={<>It’s more than<br />a film count.</>}>The same number of films can lead to very different places. The cast around an actor shapes how quickly they can reach everyone else.</SectionHeading><div className="scatter-grid"><Scatter variant="remoteness" selectedId={selectedId} onSelect={onSelect} /><Scatter variant="costars" selectedId={selectedId} onSelect={onSelect} /></div><p className="scatter-note">Each dot is one ranked actor. Select a row above or click a dot to highlight them in both charts.</p></div></section></>;
}

function Method() {
  return <section className="method-section" id="method"><div className="page-width method-layout"><div><span className="section-index">04 / THE METHOD</span><h2>What does<br /><em>“remote”</em> mean?</h2><p className="method-intro">Imagine every actor as a point and every shared film as a link. An actor’s remoteness is their average shortest path to every other actor in the largest connected group. Lower scores mean a more central position.</p><a className="source-link" href="https://www.wikidata.org/wiki/Wikidata:Licensing" target="_blank" rel="noreferrer">About the source data ↗</a></div><div className="method-steps"><div><span>01</span><div><h3>Build the film set</h3><p>We use Wikidata items marked as films, with India as a country of origin, a release date from 1960 through 2025, and at least two named cast members.</p></div></div><div><span>02</span><div><h3>Draw the connections</h3><p>Every pair of actors credited in the same film becomes one co-star link. We count each distinct co-star once, even if they shared several films.</p></div></div><div><span>03</span><div><h3>Rank the actors</h3><p>We score actors with Indian citizenship recorded in Wikidata and at least five films in the set. Shortest paths are averaged across the {number(data.meta.component)} actors in the largest connected group.</p></div></div><div className="method-caveat"><strong>READ THIS AS A MAP OF THE AVAILABLE DATA.</strong><p>Wikidata’s cast and citizenship records are incomplete. Scores are sensitive to those gaps and to the film set, so they are an exploratory measure of recorded connections, not a judgment of talent or influence.</p></div></div></div></section>;
}

function App() {
  const [selectedId, setSelectedId] = useState(actors[0].id);
  const goRanking = () => document.getElementById('ranking')?.scrollIntoView({behavior:'smooth'});
  return <><header className="site-header"><div className="page-width nav-inner"><a className="brand" href="#top"><span className="brand-mark">●</span><span>THE CENTER<br />OF INDIAN CINEMA</span></a><nav aria-label="Main navigation"><a href="#ranking">Ranking</a><a href="#over-time">Over time</a><a href="#connections">Connections</a><a href="#method">Method</a></nav><span className="header-year">DATA THROUGH 2025</span></div></header><main><Hero onExplore={goRanking} /><StatBar /><Ranking selectedId={selectedId} onSelect={setSelectedId} /><Story selectedId={selectedId} onSelect={setSelectedId} /><Method /></main><footer className="footer"><div className="page-width footer-inner"><div><strong>THE CENTER OF<br />INDIAN CINEMA</strong><span>A data story about the people who connect the screen.</span></div><div><a href="#top">Back to top ↑</a><span>Wikidata snapshot: October 23, 2026</span></div></div></footer></>;
}

createRoot(document.getElementById('root')).render(<App />);
