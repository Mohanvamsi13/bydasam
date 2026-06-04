import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

function PhotoGrid({ photos, onOpen }) {
  if (!photos.length) return null;
  return (
    <div style={{ padding:'0 3px' }}>
      <style>{`
        .photo-grid { columns: 4; column-gap: 3px; }
        .photo-grid-item { break-inside: avoid; margin-bottom: 3px; overflow: hidden; cursor: pointer; display: block; }
        .photo-grid-item img { width: 100%; height: auto; display: block; transition: transform 0.5s; }
        .photo-grid-item:hover img { transform: scale(1.03); }
        @media (max-width: 768px) { .photo-grid { columns: 2; } }
        @media (max-width: 480px) { .photo-grid { columns: 2; } }
      `}</style>
      <div className="photo-grid">
        {photos.map((p, i) => (
          <div key={p._id || i} className="photo-grid-item" onClick={() => onOpen(i)}>
            <img src={p.url} alt="" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Weddings() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lb, setLb] = useState({ open: false, idx: 0 });

  useEffect(() => {
    api.get('/categories/flat').then(r => {
      const weddingFolder = r.data.find(f => f.name.toLowerCase() === 'weddings' || f.name.toLowerCase() === 'wedding');
      if (weddingFolder) {
        api.get('/photos?folder=' + weddingFolder._id).then(res => {
          setPhotos(res.data); setLoading(false);
        }).catch(() => setLoading(false));
      } else { setLoading(false); }
    }).catch(() => setLoading(false));
  }, []);

  const openLb = idx => setLb({ open: true, idx });
  const closeLb = () => setLb(l => ({ ...l, open: false }));
  const prev = () => setLb(l => ({ ...l, idx: (l.idx - 1 + photos.length) % photos.length }));
  const next = () => setLb(l => ({ ...l, idx: (l.idx + 1) % photos.length }));
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  });

  return (
    <main style={{ background:'#000', minHeight:'100vh' }}>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'1.4rem 2.4rem', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.92)', backdropFilter:'blur(10px)', borderBottom:'1px solid #111' }}>
        <Link to="/" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', letterSpacing:'0.12em', color:'#fff', textDecoration:'none' }}>BYDASAM</Link>
        <Link to="/" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', borderBottom:'1px solid rgba(255,255,255,0.2)', paddingBottom:'2px', textDecoration:'none' }}>← Back</Link>
      </nav>
      <div style={{ paddingTop:'80px' }}>
        <div style={{ padding:'3rem 2.5rem 2rem' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', letterSpacing:'0.4em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:'0.5rem' }}>Photography</p>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(3rem,8vw,8rem)', letterSpacing:'0.04em', color:'#fff' }}>WEDDINGS</h1>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', letterSpacing:'0.15em', color:'rgba(255,255,255,0.4)', marginTop:'0.8rem', maxWidth:'600px', lineHeight:1.8 }}>
            Every wedding is a unique story. We love capturing the transformation of two individuals becoming soulmates — a visual diary of love, laughter and emotions.
          </p>
        </div>
        {loading && (
          <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.2)' }}>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.3em', textTransform:'uppercase' }}>Loading...</p>
          </div>
        )}
        {!loading && photos.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.15)' }}>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.3em', textTransform:'uppercase' }}>No wedding photos yet</p>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.1)', marginTop:'0.8rem' }}>Create a "Weddings" collection in admin and upload photos</p>
          </div>
        )}
        {!loading && photos.length > 0 && <PhotoGrid photos={photos} onOpen={openLb} />}
      </div>
      <div className={`lightbox${lb.open?' open':''}`} onClick={closeLb}>
        {lb.open && photos[lb.idx] && (
          <>
            <img src={photos[lb.idx].url} alt="" onClick={e => e.stopPropagation()} />
            <button className="lb-close" onClick={closeLb}>Close ✕</button>
            {photos.length > 1 && <>
              <button className="lb-prev" onClick={e => { e.stopPropagation(); prev(); }}>← Prev</button>
              <button className="lb-next" onClick={e => { e.stopPropagation(); next(); }}>Next →</button>
            </>}
          </>
        )}
      </div>
      <footer className="footer" style={{ marginTop:'4rem' }}>
        <span className="footer-brand">BYDASAM</span>
        <span className="footer-copy">© 2026 clicksbydasam.com · All rights reserved</span>
      </footer>
    </main>
  );
}
