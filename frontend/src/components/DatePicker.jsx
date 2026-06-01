import { useState, useRef, useEffect } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function DatePicker({ value, onChange }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('days');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [typed, setTyped] = useState(value || '');
  const ref = useRef();

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => { setTyped(value || ''); }, [value]);

  const formatDisplay = v => {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    if (!y || !m || !d) return v;
    return `${MONTHS[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
  };

  const selectDay = d => {
    const m = String(month+1).padStart(2,'0');
    const day = String(d).padStart(2,'0');
    const val = `${year}-${m}-${day}`;
    onChange(val);
    setOpen(false);
    setView('days');
  };

  const handleTyped = e => {
    setTyped(e.target.value);
    onChange(e.target.value);
  };

  const getDays = () => new Date(year, month+1, 0).getDate();
  const getFirstDay = () => new Date(year, month, 1).getDay();

  const years = [];
  for (let y = today.getFullYear(); y <= today.getFullYear() + 5; y++) years.push(y);

  const calStyle = {
    position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:200,
    background:'#111', border:'1px solid #2a2a2a',
    width:'300px', padding:'1rem',
    boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
  };

  const headerBtnStyle = {
    background:'none', border:'none', cursor:'pointer',
    fontFamily:"'Barlow Condensed',sans-serif",
    fontSize:'0.85rem', letterSpacing:'0.1em',
    textTransform:'uppercase', padding:'0.3rem 0.6rem',
    transition:'color 0.2s',
  };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', borderBottom:'1px solid #1c1c1c', transition:'border-color 0.3s' }}>
        <input
          type="text"
          value={typed}
          onChange={handleTyped}
          onFocus={() => { setOpen(true); setView('days'); }}
          placeholder="Type date or use calendar"
          style={{
            flex:1, background:'transparent', border:'none',
            color:'#fff', fontFamily:"'Barlow',sans-serif",
            fontSize:'0.92rem', fontWeight:300,
            padding:'0.6rem 0 0.8rem', outline:'none',
          }}
        />
        <button type="button" onClick={() => { setOpen(o => !o); setView('days'); }}
          style={{ background:'none', border:'none', cursor:'pointer', padding:'0.4rem', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
      </div>

      {open && (
        <div style={calStyle}>

          {view === 'days' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.8rem' }}>
                <button type="button" onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
                  style={{ ...headerBtnStyle, color:'rgba(255,255,255,0.5)' }}>←</button>
                <div style={{ display:'flex', gap:'0.3rem' }}>
                  <button type="button" onClick={() => setView('months')}
                    style={{ ...headerBtnStyle, color:'#fff' }}>{MONTHS[month]}</button>
                  <button type="button" onClick={() => setView('years')}
                    style={{ ...headerBtnStyle, color:'#fff' }}>{year}</button>
                </div>
                <button type="button" onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
                  style={{ ...headerBtnStyle, color:'rgba(255,255,255,0.5)' }}>→</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'0.4rem' }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ textAlign:'center', fontSize:'0.62rem', color:'rgba(255,255,255,0.3)', fontFamily:"'Barlow Condensed',sans-serif", padding:'0.3rem 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
                {Array(getFirstDay()).fill(null).map((_,i) => <div key={`e${i}`} />)}
                {Array(getDays()).fill(null).map((_,i) => {
                  const d = i+1;
                  const date = new Date(year, month, d);
                  const isPast = date < today;
                  const sel = value === `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                  return (
                    <button key={d} type="button" onClick={() => !isPast && selectDay(d)} disabled={isPast}
                      style={{
                        background: sel ? '#fff' : 'transparent',
                        color: isPast ? 'rgba(255,255,255,0.15)' : sel ? '#000' : 'rgba(255,255,255,0.85)',
                        border: 'none', padding:'0.45rem 0',
                        fontSize:'0.82rem', cursor: isPast ? 'not-allowed' : 'pointer',
                        borderRadius:'2px', transition:'all 0.15s',
                        fontFamily:"'Barlow',sans-serif", textAlign:'center',
                      }}
                      onMouseEnter={e => { if(!isPast && !sel) e.target.style.background='rgba(255,255,255,0.1)'; }}
                      onMouseLeave={e => { if(!sel) e.target.style.background='transparent'; }}
                    >{d}</button>
                  );
                })}
              </div>
            </>
          )}

          {view === 'months' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#fff' }}>Select Month</span>
                <button type="button" onClick={() => setView('days')} style={{ ...headerBtnStyle, color:'rgba(255,255,255,0.4)', fontSize:'0.7rem' }}>← Back</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'4px' }}>
                {MONTHS.map((m, i) => (
                  <button key={m} type="button" onClick={() => { setMonth(i); setView('days'); }}
                    style={{
                      background: month===i ? '#fff' : 'transparent',
                      color: month===i ? '#000' : 'rgba(255,255,255,0.7)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      padding:'0.6rem 0.3rem', fontSize:'0.72rem',
                      cursor:'pointer', borderRadius:'2px',
                      fontFamily:"'Barlow Condensed',sans-serif",
                      letterSpacing:'0.08em', transition:'all 0.15s',
                    }}
                    onMouseEnter={e => { if(month!==i) e.target.style.background='rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { if(month!==i) e.target.style.background='transparent'; }}
                  >{m.slice(0,3)}</button>
                ))}
              </div>
            </>
          )}

          {view === 'years' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#fff' }}>Select Year</span>
                <button type="button" onClick={() => setView('days')} style={{ ...headerBtnStyle, color:'rgba(255,255,255,0.4)', fontSize:'0.7rem' }}>← Back</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'4px' }}>
                {years.map(y => (
                  <button key={y} type="button" onClick={() => { setYear(y); setView('days'); }}
                    style={{
                      background: year===y ? '#fff' : 'transparent',
                      color: year===y ? '#000' : 'rgba(255,255,255,0.7)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      padding:'0.6rem 0.3rem', fontSize:'0.82rem',
                      cursor:'pointer', borderRadius:'2px',
                      fontFamily:"'Barlow Condensed',sans-serif",
                      transition:'all 0.15s',
                    }}
                    onMouseEnter={e => { if(year!==y) e.target.style.background='rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { if(year!==y) e.target.style.background='transparent'; }}
                  >{y}</button>
                ))}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
