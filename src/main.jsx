import React, { useEffect, useMemo, useRef, useState } from 'react';
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

// A stable sample of the ranked actors drives every scene of the opening network.
const storyActors = [actors[0], ...actors.slice(1).filter((_, index) => index % 10 === 0).slice(0, 259)];
const storySteps = ['The question', 'The network', 'Your guess', 'The reveal', 'Explore'];
const random = (seed) => { const value = Math.sin(seed * 127.1 + 31.7) * 43758.5453; return value - Math.floor(value); };
const mix = (a, b, t) => a + (b - a) * t;

function storyPoint(actor, index, step) {
  if (index === 0 && step < 4) return step === 2 ? { x: 760, y: 330 } : { x: 752, y: 324 };
  const angle = index * 2.39996 + random(index + 61) * .3;
  const spread = Math.sqrt(index / storyActors.length);
  if (step === 0) return { x: 750 + Math.cos(angle) * (64 + spread * 300), y: 325 + Math.sin(angle) * (64 + spread * 252) };
  if (step === 1) {
    const cluster = index % 4;
    const centers = [[630, 224], [870, 210], [665, 445], [892, 448]];
    return { x: centers[cluster][0] + Math.cos(angle) * (18 + spread * 110), y: centers[cluster][1] + Math.sin(angle) * (18 + spread * 100) };
  }
  if (step === 2) return { x: 760 + Math.cos(angle) * (138 + spread * 205), y: 326 + Math.sin(angle) * (122 + spread * 175) };
  if (step === 3) return { x: 752 + Math.cos(angle) * (62 + spread * 287), y: 324 + Math.sin(angle) * (62 + spread * 235) };
  const x = 480 + (Math.log10(Math.max(actor.films, 5)) - Math.log10(5)) / (Math.log10(600) - Math.log10(5)) * 485;
  const y = 94 + (actor.score - 2) / 2.4 * 475;
  return { x, y: Math.min(568, y) };
}

function StoryNetwork({ step }) {
  const linePoints = storyActors.slice(1, 13).map((actor, index) => storyPoint(actor, index + 1, step));
  return <div className={`story-network story-network-${step}`} aria-hidden="true">
    <svg viewBox="0 0 1100 650" preserveAspectRatio="xMidYMid meet">
      <g className="story-edges" style={{ opacity: step <= 1 ? .62 : 0 }}>
        {linePoints.map((point, index) => <line key={index} x1="752" y1="324" x2={point.x} y2={point.y} />)}
      </g>
      {storyActors.map((actor, index) => {
        const point = storyPoint(actor, index, step);
        const central = index === 0;
        return <circle key={actor.id} className={`story-dot ${central ? 'story-dot-center' : ''}`} cx={point.x} cy={point.y} r={central ? (step === 3 ? 17 : 10) : (index < 9 ? 5.5 : 2.6 + random(index) * 1.7)} fill={central ? '#f5ede7' : index < 9 ? '#f2a58f' : index % 7 === 0 ? '#86d2c2' : '#c7adbc'} opacity={central ? 1 : step === 2 ? .7 : .78} />;
      })}
      {step === 3 && <><circle cx="752" cy="324" r="37" fill="none" stroke="#f4a083" strokeOpacity=".55" /><text className="story-graph-label" x="752" y="390" textAnchor="middle">JACKIE SHROFF</text></>}
      {step === 4 && <><line className="story-axis" x1="480" x2="990" y1="568" y2="568" /><text className="story-graph-label" x="740" y="604" textAnchor="middle">FILM COUNT →</text><text className="story-graph-label" x="493" y="83">REMOTENESS ↓</text></>}
    </svg>
  </div>;
}

function StoryIntro({ onExplore, onSelect }) {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [guessId, setGuessId] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState(false);
  const storyRef = useRef(null);
  const stateRef = useRef({ step, revealed });
  const lastMove = useRef(0);
  stateRef.current = { step, revealed };
  const guess = guessId ? byId.get(guessId) : null;
  const suggestions = useMemo(() => query.trim().length < 2 ? [] : actors.filter(actor => actor.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0, 5), [query]);

  const move = (direction) => {
    const current = stateRef.current;
    if (direction > 0 && current.step === 2 && !current.revealed) { setNotice(true); return true; }
    const next = Math.max(0, Math.min(4, current.step + direction));
    if (next === current.step) return false;
    stateRef.current = { ...current, step: next };
    setStep(next);
    setNotice(false);
    return true;
  };
  const reveal = (id) => {
    setGuessId(id);
    onSelect(id || actors[0].id);
    setRevealed(true);
    stateRef.current = { step: 3, revealed: true };
    setStep(3);
    setNotice(false);
  };
  const chooseGuess = (event) => {
    event.preventDefault();
    const candidate = actors.find(actor => actor.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase()) || suggestions[0];
    if (candidate) reveal(candidate.id);
    else setNotice(true);
  };

  useEffect(() => {
    const element = storyRef.current;
    let touchStart = null;
    const onWheel = (event) => {
      if (event.target.closest('.guess-options')) return;
      const direction = Math.sign(Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY);
      const { step: current } = stateRef.current;
      if (!direction || (current === 0 && direction < 0) || (current === 4 && direction > 0)) return;
      event.preventDefault();
      if (Date.now() - lastMove.current < 850) return;
      lastMove.current = Date.now();
      move(direction);
    };
    const onKey = (event) => {
      if (event.target.closest('input, button, a')) return;
      if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
      const bounds = element.getBoundingClientRect();
      if (bounds.top > window.innerHeight / 2 || bounds.bottom < window.innerHeight / 2) return;
      if (move(event.key === 'ArrowRight' ? 1 : -1)) event.preventDefault();
    };
    const onTouchStart = (event) => { touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }; };
    const onTouchEnd = (event) => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.15) move(dx < 0 ? 1 : -1);
      touchStart = null;
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => { element.removeEventListener('wheel', onWheel); element.removeEventListener('touchstart', onTouchStart); element.removeEventListener('touchend', onTouchEnd); document.removeEventListener('keydown', onKey); };
  }, []);

  return <section className="story-intro" id="top" ref={storyRef} aria-label="Interactive story about the center of Indian cinema">
    <StoryNetwork step={step} />
    <div className="story-track" style={{ transform: `translateX(-${step * 100}%)` }}>
      <article className="story-panel" aria-hidden={step !== 0} inert={step !== 0 ? true : undefined}><div className="story-panel-inner"><span className="story-kicker">01 / THE QUESTION</span><h1>Who’s at the<br /><em>center</em> of<br />Indian cinema?</h1><p>We mapped {number(data.meta.films)} films and the actors who shared their screens. Follow the dots to see who sits closest to everyone else.</p><span className="story-cue">Scroll or use the arrows to move through the story <b>→</b></span></div></article>
      <article className="story-panel" aria-hidden={step !== 1} inert={step !== 1 ? true : undefined}><div className="story-panel-inner"><span className="story-kicker">02 / THE NETWORK</span><h2>A cast is a<br /><em>connection.</em></h2><p>Every pair of co-stars is one link. Follow the shortest chain of films from one actor to another. A lower average number of links means a more central actor.</p><div className="story-fact"><strong>{number(data.meta.component)}</strong><span>actors in the largest connected group</span></div></div></article>
      <article className="story-panel" aria-hidden={step !== 2} inert={step !== 2 ? true : undefined}><div className="story-panel-inner"><span className="story-kicker">03 / MAKE YOUR GUESS</span><h2>Who do <em>you</em><br />think it is?</h2><p>Pick the Indian actor you think has the lowest remoteness score in this network.</p><form className="guess-form" onSubmit={chooseGuess}><label htmlFor="actor-guess">YOUR PICK</label><div className="guess-search"><input id="actor-guess" value={query} onChange={event => { setQuery(event.target.value); setNotice(false); }} placeholder="Start typing an actor’s name…" autoComplete="off" /><button type="submit" aria-label="Submit actor guess">→</button></div>{suggestions.length > 0 && <div className="guess-options" role="listbox" aria-label="Actor suggestions">{suggestions.map(actor => <button key={actor.id} type="button" onClick={() => reveal(actor.id)} role="option" aria-selected={false}>{actor.name}</button>)}</div>}</form><div className="guess-actions"><button className="story-skip" onClick={() => reveal(null)}>Skip the guess →</button>{notice && <span className="guess-notice" role="status">Choose a name or skip to see the answer.</span>}</div></div></article>
      <article className="story-panel" aria-hidden={step !== 3} inert={step !== 3 ? true : undefined}><div className="story-panel-inner"><span className="story-kicker">04 / THE REVEAL</span><h2>Meet the<br /><em>center.</em></h2><div className="story-reveal"><span>THE LOWEST REMOTENESS SCORE</span><strong>{actors[0].name}</strong><div><b>#{actors[0].rank}</b><b>{score(actors[0].score)}</b><span>AVERAGE FILM LINKS</span></div></div>{guess ? <p className="guess-result">Your pick, <strong>{guess.name}</strong>, ranks <strong>#{number(guess.rank)}</strong> with a remoteness score of <strong>{score(guess.score)}</strong>.</p> : <p>In this snapshot, Jackie Shroff is about {score(actors[0].score)} film links away from another actor on average.</p>}</div></article>
      <article className="story-panel" aria-hidden={step !== 4} inert={step !== 4 ? true : undefined}><div className="story-panel-inner"><span className="story-kicker">05 / THE DATA</span><h2>There’s more<br />to the <em>story.</em></h2><p>More films can mean more co-stars, but film count alone does not determine who lands in the middle. Search the full ranking and explore how the network changed over time.</p><button className="story-cta" onClick={onExplore}>Explore the ranking <span>↘</span></button><span className="story-plot-note">Dots here show a sample of ranked actors by film count and remoteness. The complete chart is below.</span></div></article>
    </div>
    <div className="story-controls"><button className="story-arrow" onClick={() => move(-1)} disabled={step === 0} aria-label="Previous scene">←</button><div className="story-progress" aria-label={`Scene ${step + 1} of ${storySteps.length}: ${storySteps[step]}`}>{storySteps.map((label, index) => <button key={label} className={index === step ? 'active' : ''} onClick={() => { if (index > 2 && !revealed) { setStep(2); setNotice(true); } else setStep(index); }} aria-label={`Go to scene ${index + 1}: ${label}`} aria-current={index === step ? 'step' : undefined} />)}</div><button className="story-arrow" onClick={() => move(1)} disabled={step === 4} aria-label="Next scene">→</button></div>
    <div className="story-counter"><span>{String(step + 1).padStart(2, '0')} / 05</span><span>{storySteps[step]}</span></div>
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
  return <><header className="site-header"><div className="page-width nav-inner"><a className="brand" href="#top"><span className="brand-mark">●</span><span>THE CENTER<br />OF INDIAN CINEMA</span></a><nav aria-label="Main navigation"><a href="#top">The story</a><a href="#ranking">Ranking</a><a href="#over-time">Over time</a><a href="#connections">Connections</a><a href="#method">Method</a></nav><span className="header-year">DATA THROUGH 2025</span></div></header><main><StoryIntro onExplore={goRanking} onSelect={setSelectedId} /><StatBar /><Ranking selectedId={selectedId} onSelect={setSelectedId} /><Story selectedId={selectedId} onSelect={setSelectedId} /><Method /></main><footer className="footer"><div className="page-width footer-inner"><div><strong>THE CENTER OF<br />INDIAN CINEMA</strong><span>A data story about the people who connect the screen.</span></div><div><a href="#top">Back to top ↑</a><span>Wikidata snapshot: October 23, 2026</span></div></div></footer></>;
}

createRoot(document.getElementById('root')).render(<App />);
