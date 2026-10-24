import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import data from './data.json';
import './styles.css';

const actors = data.actors;
const byId = new Map(actors.map(actor => [actor.id, actor]));
const number = value => new Intl.NumberFormat('en-US').format(value);
const score = value => Number(value).toFixed(2);

function SectionHeading({ number: index, eyebrow, title, children }) {
  return <div className="section-heading">
    <span className="section-index">{index} / {eyebrow}</span>
    <div className="section-heading-inner"><h2>{title}</h2>{children && <p>{children}</p>}</div>
  </div>;
}

// The first twelve points share a recorded film with Jackie Shroff in the pinned snapshot.
const storyCoStarIds = ['Q3595438', 'Q2050534', 'Q9570', 'Q560163', 'Q3765029', 'Q312789', 'Q80309', 'Q469945', 'Q379604', 'Q158233', 'Q6933443', 'Q6937290'];
const storyActors = [actors[0], ...storyCoStarIds.map(id => byId.get(id)), ...actors.slice(1).filter((_, index) => index % 10 === 0 && !storyCoStarIds.includes(actors[index + 1].id))].slice(0, 260);
const storySteps = ['The question', 'How it works', 'Your guess', 'The reveal', 'Explore'];
const random = (seed) => { const value = Math.sin(seed * 127.1 + 31.7) * 43758.5453; return value - Math.floor(value); };

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
  const linePoints = storyActors.slice(1, storyCoStarIds.length + 1).map((actor, index) => storyPoint(actor, index + 1, step));
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

function GuessRanking({ guess, revealed, onSelect }) {
  const viewportRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 37;
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - 3);
  const visible = actors.slice(first, Math.min(actors.length, first + 18));
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const target = revealed || !guess ? 0 : Math.max(0, (guess.rank - 1) * rowHeight - 4 * rowHeight);
    viewport.scrollTop = target;
    setScrollTop(target);
  }, [guess?.id, revealed]);
  return <div className={`guess-ranking ${revealed ? 'is-revealed' : ''}`}>
    <div className="guess-ranking-head"><div><span>THE 2025 RANKING</span><strong>{revealed ? 'The full list' : guess ? `Your pick is #${number(guess.rank)}` : 'Who is #1?'}</strong></div><span>{number(actors.length)} ACTORS</span></div>
    <div className="guess-ranking-columns"><span>RANK</span><span>ACTOR</span><span>REMOTENESS</span></div>
    <div className="guess-ranking-viewport" ref={viewportRef} onScroll={event => setScrollTop(event.currentTarget.scrollTop)} tabIndex={0} aria-label={revealed ? 'Full actor ranking, scroll to browse' : 'Ranking preview, hidden until the right guess or skip'}>
      <div className="guess-ranking-space" style={{height: actors.length * rowHeight}}>
        {visible.map(actor => <button key={actor.id} style={{top: (actor.rank - 1) * rowHeight}} className={`guess-rank-row ${!revealed && actor.id !== guess?.id ? 'is-obscured' : ''} ${actor.id === guess?.id ? 'is-guess' : ''} ${actor.rank === 1 && revealed ? 'is-winner' : ''}`} disabled={!revealed} aria-hidden={!revealed && actor.id !== guess?.id} onClick={() => onSelect(actor.id)}><span>#{number(actor.rank)}</span><strong>{actor.name}</strong><span>{score(actor.score)}</span></button>)}
      </div>
    </div>
    <p className="guess-ranking-foot" role="status">{revealed ? 'The full ranking is unlocked. Scroll this list to explore every actor.' : guess ? `${guess.name} is #${number(guess.rank)} with a score of ${score(guess.score)}. Try another name.` : 'Make a guess to uncover one row. The rest stays hidden.'}</p>
  </div>;
}

function StoryIntro({ onExplore, onSelect }) {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [guessId, setGuessId] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [skipped, setSkipped] = useState(false);
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
  const submitGuess = (id) => {
    setGuessId(id);
    onSelect(id);
    setQuery('');
    if (id === actors[0].id) {
      setRevealed(true);
      stateRef.current = { step: 2, revealed: true };
    }
    setNotice(false);
  };
  const skipGuess = () => {
    setSkipped(true);
    setGuessId(null);
    setRevealed(true);
    onSelect(actors[0].id);
    stateRef.current = { step: 2, revealed: true };
    setNotice(false);
  };
  const chooseGuess = (event) => {
    event.preventDefault();
    const candidate = actors.find(actor => actor.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase()) || suggestions[0];
    if (candidate) submitGuess(candidate.id);
    else setNotice(true);
  };

  useEffect(() => {
    const element = storyRef.current;
    let touchStart = null;
    const onWheel = (event) => {
      if (event.target.closest('.guess-options, .guess-ranking-viewport')) return;
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
      <article className="story-panel story-explainer" aria-hidden={step !== 1} inert={step !== 1 ? true : undefined}><div className="story-panel-inner"><span className="story-kicker">02 / HOW IT WORKS</span><h2>Count the<br /><em>connections.</em></h2><dl className="story-definitions"><div><dt>One degree</dt><dd>Two actors who share a film are one co-star step apart.</dd></div><div><dt>Six Degrees of Kevin Bacon</dt><dd>The game asks you to reach Kevin Bacon from any actor in six or fewer co-star steps.</dd></div><div><dt>Remoteness</dt><dd>We average an actor’s shortest co-star paths to everyone else in the largest connected group. Lower is closer.</dd></div><div><dt>Our ranking</dt><dd>From {number(data.meta.films)} Indian films (1960–2025), we rank Indian actors with at least five films.</dd></div></dl></div></article>
      <article className="story-panel guess-panel" aria-hidden={step !== 2} inert={step !== 2 ? true : undefined}><div className="story-panel-inner guess-layout"><div className="guess-copy"><span className="story-kicker">03 / MAKE YOUR GUESS</span><h2>{revealed ? <>The ranking<br /><em>unlocked.</em></> : <>Who do <em>you</em><br />think it is?</>}</h2><p>{revealed ? skipped ? 'You skipped the guess. The full ranking is now visible.' : 'You found the actor at the center. Explore the full ranking, then continue.' : guess ? `${guess.name} is #${number(guess.rank)}. Try another actor to find #1.` : 'Pick the Indian actor with the lowest remoteness score. Each guess uncovers only their place.'}</p>{!revealed && <form className="guess-form" onSubmit={chooseGuess}><label htmlFor="actor-guess">YOUR PICK</label><div className="guess-search"><input id="actor-guess" value={query} onChange={event => { setQuery(event.target.value); setNotice(false); }} placeholder="Start typing an actor’s name…" autoComplete="off" /><button type="submit" aria-label="Submit actor guess">→</button></div>{suggestions.length > 0 && <div className="guess-options" role="listbox" aria-label="Actor suggestions">{suggestions.map(actor => <button key={actor.id} type="button" onClick={() => submitGuess(actor.id)} role="option" aria-selected={false}>{actor.name}</button>)}</div>}</form>}<div className="guess-actions">{revealed ? <button className="story-cta guess-continue" onClick={() => move(1)}>Continue to the reveal <span>→</span></button> : <button className="story-skip" onClick={skipGuess}>Skip the guess →</button>}{notice && <span className="guess-notice" role="status">Choose a name or skip to unlock the ranking.</span>}</div></div><GuessRanking guess={guess} revealed={revealed} onSelect={onSelect} /></div></article>
      <article className="story-panel" aria-hidden={step !== 3} inert={step !== 3 ? true : undefined}><div className="story-panel-inner"><span className="story-kicker">04 / THE REVEAL</span><h2>Meet the<br /><em>center.</em></h2><div className="story-reveal"><span>THE LOWEST REMOTENESS SCORE</span><strong>{actors[0].name}</strong><div><b>#{actors[0].rank}</b><b>{score(actors[0].score)}</b><span>AVERAGE FILM LINKS</span></div></div>{guess && !skipped ? <p className="guess-result">Your final pick, <strong>{guess.name}</strong>, ranks <strong>#{number(guess.rank)}</strong> with a remoteness score of <strong>{score(guess.score)}</strong>.</p> : <p>In this snapshot, Jackie Shroff is about {score(actors[0].score)} film links away from another actor on average.</p>}</div></article>
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

const decades = [
  { label: '1980s', start: 1980, end: 1989 },
  { label: '1990s', start: 1990, end: 1999 },
  { label: '2000s', start: 2000, end: 2009 },
  { label: '2010s', start: 2010, end: 2019 },
  { label: '2020s', start: 2020, end: 2025 },
];
const historyByYear = new Map(Array.from({ length: 46 }, (_, index) => [1980 + index, data.history.filter(point => point.year === 1980 + index)]));
const historyIds = [...new Set(data.history.map(point => point.id))];
const historyColor = id => `hsl(${(historyIds.indexOf(id) * 47 + 12) % 360} 66% 73%)`;

function DecadePlot({ decade, compact, focusedYear, onFocusYear, selectedId, onSelect }) {
  const years = Array.from({ length: decade.end - decade.start + 1 }, (_, index) => decade.start + index);
  const points = years.flatMap(year => historyByYear.get(year));
  const ids = [...new Set(points.map(point => point.id))];
  const width = compact ? 560 : 960, height = 345, left = compact ? 48 : 56, right = compact ? 18 : 24, top = 32, bottom = 53;
  const x = year => left + (year - decade.start) / (decade.end - decade.start) * (width - left - right);
  const y = rank => top + (rank - 1) / 4 * (height - top - bottom);
  const paths = ids.flatMap(id => {
    const runs = []; let run = [];
    for (const year of years) {
      const point = historyByYear.get(year).find(entry => entry.id === id);
      if (point) run.push(point);
      else if (run.length) { runs.push(run); run = []; }
    }
    if (run.length) runs.push(run);
    return runs.map((segment, index) => {
      const first = segment[0], last = segment[segment.length - 1];
      const before = historyByYear.get(first.year - 1)?.find(entry => entry.id === id);
      const after = historyByYear.get(last.year + 1)?.find(entry => entry.id === id);
      const startRank = before && first.year === decade.start ? before.rank : 5.9;
      const endRank = after && last.year === decade.end ? after.rank : 5.9;
      const beginning = `M ${x(first.year - .48).toFixed(1)} ${y(startRank).toFixed(1)}`;
      const middle = segment.map(point => `L ${x(point.year).toFixed(1)} ${y(point.rank).toFixed(1)}`).join(' ');
      const ending = `L ${x(last.year + .48).toFixed(1)} ${y(endRank).toFixed(1)}`;
      return { id, key: `${id}-${index}`, path: `${beginning} ${middle} ${ending}` };
    });
  });
  const clipId = `plot-${decade.start}`;
  return <div className="decade-panel"><div className="decade-panel-title"><strong>{decade.label}</strong><span>{decade.start}–{decade.end}</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Top five actors by remoteness rank from ${decade.start} to ${decade.end}`}>
    <defs><clipPath id={clipId}><rect x={left} y={top - 8} width={width - left - right} height={y(5) - top + 16} /></clipPath></defs>
    {[1, 2, 3, 4, 5].map(rank => <g key={rank}><line className="decade-grid" x1={left} x2={width - right} y1={y(rank)} y2={y(rank)} /><text className="decade-axis" x={left - 13} y={y(rank) + 5} textAnchor="end">#{rank}</text></g>)}
    {focusedYear >= decade.start && focusedYear <= decade.end && <line className="decade-focus-line" x1={x(focusedYear)} x2={x(focusedYear)} y1={top} y2={y(5)} />}
    {years.map(year => <g key={year}><text className={`decade-year ${focusedYear === year ? 'active' : ''}`} x={x(year)} y={height - 15} textAnchor="middle">{year}</text><rect x={x(year) - (width - left - right) / Math.max(1, years.length - 1) / 2} y={top} width={(width - left - right) / Math.max(1, years.length - 1)} height={y(5) - top} fill="transparent" onMouseEnter={() => onFocusYear(year)} onClick={() => onFocusYear(year)} /></g>)}
    <g clipPath={`url(#${clipId})`}>{paths.map(item => <path key={item.key} d={item.path} fill="none" stroke={historyColor(item.id)} strokeWidth={selectedId === item.id ? 4 : 2.5} strokeOpacity={selectedId === item.id ? 1 : .8} strokeLinecap="round" strokeLinejoin="round" />)}{points.map(point => <circle key={`${point.year}-${point.id}`} cx={x(point.year)} cy={y(point.rank)} r={focusedYear === point.year ? 5.5 : 3.5} fill={historyColor(point.id)} stroke="#1b0c22" strokeWidth="1.5" onMouseEnter={() => onFocusYear(point.year)} onClick={() => { onFocusYear(point.year); onSelect(point.id); }} className="decade-point" />)}</g>
  </svg></div>;
}

function LineChart({ selectedId, onSelect }) {
  const trackRef = useRef(null);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width:760px)').matches);
  const [decadeIndex, setDecadeIndex] = useState(4);
  const [focusedYear, setFocusedYear] = useState(2025);
  useEffect(() => { const media = window.matchMedia('(max-width:760px)'); const update = () => setCompact(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { const track = trackRef.current; if (track) track.scrollLeft = decadeIndex * track.clientWidth; }, [compact]);
  const goDecade = index => {
    const next = Math.max(0, Math.min(decades.length - 1, index));
    setDecadeIndex(next);
    setFocusedYear(decades[next].end);
    trackRef.current?.scrollTo({ left: next * trackRef.current.clientWidth, behavior: 'smooth' });
  };
  const onScroll = event => {
    const index = Math.max(0, Math.min(decades.length - 1, Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth)));
    if (index !== decadeIndex) { setDecadeIndex(index); setFocusedYear(decades[index].end); }
  };
  const leaders = historyByYear.get(focusedYear) || [];
  return <div className="timeline-card decade-card">
    <div className="timeline-head"><div><span className="small-label">REMOTENESS OVER TIME</span><h3>The top five, year by year</h3><p>Each line follows an actor while they rank among that year’s five closest. It enters or leaves as the top five changes.</p></div><div className="decade-nav"><button onClick={() => goDecade(decadeIndex - 1)} disabled={decadeIndex === 0} aria-label="Previous decade">←</button><strong>{decades[decadeIndex].label}</strong><button onClick={() => goDecade(decadeIndex + 1)} disabled={decadeIndex === decades.length - 1} aria-label="Next decade">→</button></div></div>
    <div className="decade-tabs" aria-label="Choose a decade">{decades.map((decade, index) => <button key={decade.label} className={index === decadeIndex ? 'active' : ''} onClick={() => goDecade(index)} aria-current={index === decadeIndex ? 'true' : undefined}>{decade.label}</button>)}</div>
    <div className="decade-layout"><div className="decade-scroll" ref={trackRef} onScroll={onScroll} aria-label="Scroll horizontally through decades" tabIndex={0}>{decades.map(decade => <DecadePlot key={decade.start} decade={decade} compact={compact} focusedYear={focusedYear} onFocusYear={setFocusedYear} selectedId={selectedId} onSelect={onSelect} />)}</div><aside className="decade-roster"><span className="small-label">TOP FIVE IN {focusedYear}</span><p>Ranked by lowest remoteness</p>{leaders.map(point => <button key={point.id} onClick={() => onSelect(point.id)} className={selectedId === point.id ? 'active' : ''}><span className="decade-roster-rank">#{point.rank}</span><i style={{background: historyColor(point.id)}} /><strong>{byId.get(point.id)?.name}</strong><span>{score(point.score)}</span></button>)}</aside></div>
    <p className="chart-footnote">The network is rebuilt through each year. A score averages shortest co-star paths within that year’s largest connected group. Drag or scroll sideways to explore one decade at a time.</p>
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
  return <><section className="timeline-section page-width" id="over-time"><SectionHeading number="02" eyebrow="THE TIME MACHINE" title={<>The center<br />keeps moving.</>}>Scroll one decade at a time through the five most central actors in every year from 1980 to 2025.</SectionHeading><LineChart selectedId={selectedId} onSelect={onSelect} /></section>
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
