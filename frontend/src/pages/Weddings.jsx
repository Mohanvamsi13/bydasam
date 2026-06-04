import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

function PhotoGrid({ photos, onOpen }) {
  if (!photos.length) return null;
  return (
    <div style={{ padding:'0 4px' }}>
      <style>{`
        .w-photo-grid { columns: 4; column-gap: 4px; }
        .w-photo-item { break-inside: avoid; margin-bottom: 4px; overflow: hidden; cursor: pointer; display: block; position: relative; border-radius: 4px; }
        .w-photo-item img { width: 100%; height: auto; display: block; transition: transform 0.5s; }
        .w-photo-item:hover img { transform: scale(1.03); }
        @media (max-width: 768px) { .w-photo-grid { columns: 2; } }
      `}</style>
      <div className="w-photo-grid">
        {photos.map((p, i) => (
          <div key={p._id || i} className="w-photo-item" onClick={() => onOpen(i)}>
            <img src={p.url} alt="" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FolderGrid({ folders, onOpen }) {
  if (!folders.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'4px', padding:'0 4px' }}>
      {folders.map(f => (
        <div key={f._id} onClick={() => onOpen(f)} style={{ position:'relative', aspectRatio:'3/2', overflow:'hidden', cursor:'pointer', background:'#111', borderRadius:'4px' }}>
          {f.coverPhoto ? (
            <img src={f.coverPhoto} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.6s' }}
              onMouseEnter={e => e.target.style.transform='scale(1.05)'}
              onMouseLeave={e => e.target.style.transform='scale(1)'}
            />
          ) : (
            <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#181818,#0d0d0d)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', color:'rgba(255,255,255,0.15)', textTransform:'uppercase' }}>No Cover</span>
            </div>
          )}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0.8rem 1rem', background:'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.6)' }}>📁</span>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.08em', color:'#fff', textTransform:'uppercase' }}>{f.name}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Weddings() {
  const [allFolders, setAllFolders] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lb, setLb] = useState({ open: false, idx: 0 });

  useEffect(() => {
    api.get('/categories/flat').then(r => {
      setAllFolders(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getChildren = parentId => {
    if (!parentId) return allFolders.filter(f => !f.parent);
    return allFolders.filter(f => String(f.parent?._id || f.parent) === String(parentId));
  };

  const weddingRoot = allFolders.find(f => !f.parent && (f.name.toLowerCase() === 'weddings' || f.name.toLowerCase() === 'wedding'));
  const currentFolder = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null;
  const currentChildren = currentFolder ? getChildren(currentFolder._id) : (weddingRoot ? getChildren(weddingRoot._id) : []);

  const openFolder = folder => {
    setBreadcrumb(prev => [...prev, folder]);
    setPhotos([]);
    api.get('/photos?folder=' + folder._id).then(r => setPhotos(r.data)).catch(() => {});
  };

  const goToCrumb = idx => {
    if (idx === -1) { setBreadcrumb([]); setPhotos([]); }
    else {
      const newCrumb = breadcrumb.slice(0, idx + 1);
      setBreadcrumb(newCrumb);
      setPhotos([]);
      api.get('/photos?folder=' + newCrumb[newCrumb.length - 1]._id).then(r => setPhotos(r.data)).catch(() => {});
    }
  };

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
    <main style={{ background:'#0d0d0d', minHeight:'100vh' }}>
      <nav style={{ position:'sticky', top:0, zIndex:100, padding:'1.2rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.95)', backdropFilter:'blur(10px)', borderBottom:'1px solid #1a1a1a' }}>
        <Link to="/" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', letterSpacing:'0.12em', color:'#fff', textDecoration:'none' }}>BYDASAM</Link>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
          <Link to="/" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.95rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>Home</Link>
          <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.8rem' }}>›</span>
          <span onClick={() => goToCrumb(-1)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.95rem', letterSpacing:'0.2em', textTransform:'uppercase', color: breadcrumb.length===0 ? '#fff' : 'rgba(255,255,255,0.4)', cursor:'pointer' }}>Weddings</span>
          {breadcrumb.map((b, i) => (
            <span key={b._id} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.8rem' }}>›</span>
              <span onClick={() => goToCrumb(i)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.95rem', letterSpacing:'0.2em', textTransform:'uppercase', color: i===breadcrumb.length-1 ? '#fff' : 'rgba(255,255,255,0.4)', cursor:'pointer' }}>{b.name}</span>
            </span>
          ))}
        </div>
      </nav>

      <div style={{ padding:'2.5rem 0 4rem' }}>
        {loading && (
          <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.2)' }}>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.3em', textTransform:'uppercase' }}>Loading...</p>
          </div>
        )}

        {!loading && !weddingRoot && (
          <div style={{ textAlign:'center', padding:'4rem' }}>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>No weddings yet</p>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.1)', marginTop:'0.8rem' }}>Create a "Weddings" collection in admin, then add couple folders inside it</p>
          </div>
        )}

        {!loading && weddingRoot && currentChildren.length > 0 && (
          <>
            {breadcrumb.length === 0 && (
              <div style={{ padding:'0 2rem 2rem' }}>
                <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.4em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:'0.4rem' }}>Photography</p>
                <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(2.5rem,6vw,5rem)', letterSpacing:'0.04em', color:'#fff' }}>WEDDINGS</h1>
              </div>
            )}
            <FolderGrid folders={currentChildren} onOpen={openFolder} />
          </>
        )}

        {!loading && photos.length > 0 && (
          <div style={{ marginTop:'4px' }}>
            <PhotoGrid photos={photos} onOpen={openLb} />
          </div>
        )}

        {!loading && weddingRoot && currentChildren.length === 0 && photos.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.15)' }}>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.3em', textTransform:'uppercase' }}>No photos in this folder yet</p>
          </div>
        )}
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

      <footer style={{ padding:'2rem', borderTop:'1px solid #1a1a1a', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.3rem', letterSpacing:'0.12em', color:'rgba(255,255,255,0.3)' }}>BYDASAM</span>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)' }}>© 2026 clicksbydasam.com</span>
      </footer>
    </main>
  );
}
