import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DatePicker from '../components/DatePicker';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

function Hero() {
  const [heroMedia, setHeroMedia] = useState('');
  const [heroMediaType, setHeroMediaType] = useState('');
  useEffect(() => {
    api.get('/settings').then(r => {
      if (r.data.heroMedia) setHeroMedia(r.data.heroMedia);
      if (r.data.heroMediaType) setHeroMediaType(r.data.heroMediaType);
    }).catch(() => {});
  }, []);
  return (
    <section className="hero">
      {heroMedia && heroMediaType === 'video' ? (
        <video autoPlay muted loop playsInline className="hero-image" style={{ objectFit:'cover' }}>
          <source src={heroMedia} type="video/mp4" />
        </video>
      ) : heroMedia && heroMediaType === 'image' ? (
        <img src={heroMedia} alt="Hero" className="hero-image" style={{ opacity:1 }} />
      ) : (
        <div className="hero-placeholder" />
      )}
    </section>
  );
}

function Carousel() {
  const [photos, setPhotos] = useState([]);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    api.get('/settings/carousel').then(r => setPhotos(r.data)).catch(() => {});
  }, []);

  const items = ['Street','Wedding','Speed & Steel','Abstract','Portrait','Events','Fine Art','Urban','Documentary','Fashion'];

  if (photos.length === 0) {
    return (
      <div className="marquee-strip" style={{ marginTop:'24px', marginBottom:'24px' }}>
        <div className="marquee-inner">
          {[...items,...items].map((item, i) => (
            <span key={i} className="marquee-item">{item}{i < items.length*2-1 && <span className="marquee-dot" />}</span>
          ))}
        </div>
      </div>
    );
  }

  const FRAME_W = 200, GAP = 6;
  const doubled = [...photos, ...photos];

  return (
    <div style={{ marginTop:'24px', marginBottom:'24px' }}>
      <style>{`
        @keyframes carouselScroll {
          0%{transform:translateX(0)}
          100%{transform:translateX(-${photos.length*(FRAME_W+GAP)}px)}
        }
        .c-track {
          display: flex;
          gap: ${GAP}px;
          width: ${doubled.length*(FRAME_W+GAP)}px;
          animation: carouselScroll ${photos.length*5}s linear infinite;
          align-items: center;
        }
        .c-track.paused { animation-play-state: paused; }
        .c-frame {
          flex-shrink: 0;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: width 0.4s ease, height 0.4s ease, border-color 0.2s;
        }
        .c-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
          transition: width 0.4s, height 0.4s;
        }
        .c-frame.normal { width: ${FRAME_W}px; height: 160px; }
        .c-frame.shrunk { width: ${Math.round(FRAME_W*0.75)}px; height: 120px; opacity: 0.5; }
        .c-frame.expanded { width: ${Math.round(FRAME_W*1.4)}px; height: 280px; border-color: rgba(255,255,255,0.3); z-index: 10; position: relative; }
      `}</style>

      <div style={{ overflow:'hidden', background:'#000', borderTop:'1px solid #111', borderBottom:'1px solid #111', padding:'20px 0' }}>
        <div
          className={`c-track${hoveredIdx !== null ? ' paused' : ''}`}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {doubled.map((p, i) => (
            <div
              key={i}
              className={`c-frame ${
                hoveredIdx === null ? 'normal' :
                i % photos.length === hoveredIdx % photos.length ? 'expanded' : 'shrunk'
              }`}
              onMouseEnter={() => setHoveredIdx(i)}
            >
              <img src={p.url} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function About() {
  const [settings, setSettings] = useState({});
  useEffect(() => { api.get('/settings').then(r => setSettings(r.data)).catch(() => {}); }, []);
  const name  = settings.aboutName  || 'Madhu Sai Pavan Dasam';
  const role  = settings.aboutRole  || 'Photographer · Storyteller · Visual Architect';
  const bio   = settings.aboutBio   || '';
  const photo = settings.aboutPhoto || '';
  const pos   = settings.aboutPhotoPosition || 'center top';
  const defaultBio = [
    `I am <strong>Madhu Sai Pavan Dasam</strong> — a photographer obsessed with finding beauty in unexpected places. From the chaos of street life to the stillness of a wedding moment, every frame tells a story worth keeping.`,
    `Trained at the legendary <strong>Annapurna Studios</strong> in Film and Photography, pursued a <strong>Masters in Photography at Dartmouth University, Massachusetts</strong> and an <strong>MBA from Lindsey Wilson College, Kentucky</strong> — bringing a rare blend of artistic mastery and business sharpness to every project.`,
    `Based in <strong>Alabama</strong> and available across the entire United States, I specialize in capturing the moments that words simply cannot describe. Weddings that make you cry rewatching them. Streets that feel alive. Cars that look like they are moving standing still. Abstract work that makes you stop and stare.`,
    `My unique combination of artistic training and business acumen means I do not just understand photography — <strong>I understand you, your brand, and what you need.</strong>`,
    `I do not just photograph your moments — <strong>I preserve them forever.</strong>`,
  ];
  return (
    <section id="about" style={{ borderTop:'1px solid #111', background:'#000' }}>
      <style>{`
        .about-grid { display: grid; grid-template-columns: 2fr 3fr; }
        .about-photo-col { background: #0a0a0a; overflow: hidden; max-height: 800px; }
        .about-text-col { padding: 4rem 5rem; display: flex; flex-direction: column; justify-content: center; border-left: 1px solid #111; }
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; }
          .about-photo-col { max-height: 60vw !important; }
          .about-text-col { padding: 2rem 1.5rem !important; border-left: none !important; border-top: 1px solid #111; }
        }
      `}</style>
      <div className="about-grid">
        <div className="about-photo-col">
          {photo ? (
            <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:pos, display:'block' }} />
          ) : (
            <div style={{ width:'100%', height:'480px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(3rem,8vw,7rem)', letterSpacing:'0.04em', color:'rgba(255,255,255,0.04)', userSelect:'none' }}>BYDASAM</span>
            </div>
          )}
        </div>
        <div className="about-text-col">
          <p className="about-role">{role}</p>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(2rem,4vw,3.5rem)', letterSpacing:'0.02em', lineHeight:1.05, color:'#fff', marginBottom:'2rem' }}>{name.toUpperCase()}</h2>
          <div className="about-text">
            {bio ? <p>{bio}</p> : defaultBio.map((line, i) => <p key={i} dangerouslySetInnerHTML={{ __html: line }} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Portfolio() {
  const [photos, setPhotos] = useState([]);
  const [lb, setLb] = useState({ open: false, idx: 0 });
  useEffect(() => {
    api.get('/photos').then(r => {
      const all = r.data;
      const featured = all.filter(p => p.featured);
      setPhotos(featured.length > 0 ? featured : all);
    }).catch(() => {});
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
    <section id="portfolio" style={{ background:'#000', borderTop:'1px solid #111' }}>
      <div className="section-header">
        <div>
          <p className="section-label">Selected Work</p>
          <h2 className="section-title">PORTFOLIO</h2>
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="empty-state" style={{ minHeight:'40vh' }}>
          <div style={{ fontSize:'2rem', color:'rgba(255,255,255,0.06)' }}>◻</div>
          <p>No photos yet — upload via admin panel</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'2px', padding:'2px' }}>
          {photos.map((p, i) => (
            <div key={p._id} onClick={() => openLb(i)} style={{ position:'relative', overflow:'hidden', aspectRatio:'1/1', cursor:'pointer', background:'#111' }}>
              <img src={p.url} alt={p.title||'Photo'} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s', display:'block' }}
                onMouseEnter={e => e.target.style.transform='scale(1.05)'}
                onMouseLeave={e => e.target.style.transform='scale(1)'}
              />
            </div>
          ))}
        </div>
      )}
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
    </section>
  );
}

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

function Collections() {
  const [folders, setFolders] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [folderPhotos, setFolderPhotos] = useState([]);
  const [lb, setLb] = useState({ open: false, idx: 0 });
  useEffect(() => { api.get('/categories/flat').then(r => setFolders(r.data)).catch(() => {}); }, []);
  const currentFolder = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null;
  const getChildren = parentId => {
    if (!parentId) return folders.filter(f => !f.parent);
    return folders.filter(f => String(f.parent?._id || f.parent) === String(parentId));
  };
  const openFolder = folder => {
    setBreadcrumb(prev => [...prev, folder]);
    api.get('/photos?folder=' + folder._id).then(r => setFolderPhotos(r.data)).catch(() => {});
  };
  const goToCrumb = idx => {
    if (idx === -1) { setBreadcrumb([]); setFolderPhotos([]); }
    else {
      const newCrumb = breadcrumb.slice(0, idx + 1);
      setBreadcrumb(newCrumb);
      api.get('/photos?folder=' + newCrumb[newCrumb.length - 1]._id).then(r => setFolderPhotos(r.data)).catch(() => {});
    }
  };
  const openLb = idx => setLb({ open: true, idx });
  const closeLb = () => setLb(l => ({ ...l, open: false }));
  const prev = () => setLb(l => ({ ...l, idx: (l.idx - 1 + folderPhotos.length) % folderPhotos.length }));
  const next = () => setLb(l => ({ ...l, idx: (l.idx + 1) % folderPhotos.length }));
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  });
  const rootFolders = getChildren(null);
  if (rootFolders.length === 0) return null;
  const currentChildren = currentFolder ? getChildren(currentFolder._id) : rootFolders;
  return (
    <section id="collections" style={{ background:'#000', borderTop:'1px solid #111', paddingBottom:'2rem' }}>
      <div className="section-header">
        <div>
          <p className="section-label">Browse Work</p>
          <h2 className="section-title">COLLECTIONS</h2>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0 2.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <span onClick={() => goToCrumb(-1)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', letterSpacing:'0.15em', textTransform:'uppercase', color: breadcrumb.length===0 ? '#fff' : 'rgba(255,255,255,0.35)', cursor:'pointer' }}>All Collections</span>
        {breadcrumb.map((b, i) => (
          <span key={b._id} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.9rem' }}>›</span>
            <span onClick={() => goToCrumb(i)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', letterSpacing:'0.15em', textTransform:'uppercase', color: i===breadcrumb.length-1 ? '#fff' : 'rgba(255,255,255,0.35)', cursor:'pointer' }}>{b.name}</span>
          </span>
        ))}
      </div>
      {currentChildren.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'4px', padding:'0 4px', marginBottom:'4px' }}>
          {currentChildren.map(f => (
            <div key={f._id} onClick={() => openFolder(f)} style={{ position:'relative', aspectRatio:'3/2', overflow:'hidden', cursor:'pointer', background:'#111' }}>
              {f.coverPhoto ? (
                <img src={f.coverPhoto} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s', display:'block' }}
                  onMouseEnter={e => e.target.style.transform='scale(1.05)'}
                  onMouseLeave={e => e.target.style.transform='scale(1)'}
                />
              ) : (
                <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#181818,#0d0d0d)' }} />
              )}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(transparent 40%, rgba(0,0,0,0.75))', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'1.5rem' }}>
                <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(1.2rem,2.5vw,2rem)', letterSpacing:'0.08em', color:'#fff', marginBottom:'0.2rem' }}>{f.name.toUpperCase()}</p>
                {getChildren(f._id).length > 0 && (
                  <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.9rem', letterSpacing:'0.2em', color:'rgba(255,255,255,0.5)', textTransform:'uppercase' }}>{getChildren(f._id).length} albums</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {folderPhotos.length > 0 && <PhotoGrid photos={folderPhotos} onOpen={openLb} />}
      {currentChildren.length === 0 && folderPhotos.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', letterSpacing:'0.25em', textTransform:'uppercase' }}>No photos in this collection yet</p>
        </div>
      )}
      <div className={`lightbox${lb.open?' open':''}`} onClick={closeLb}>
        {lb.open && folderPhotos[lb.idx] && (
          <>
            <img src={folderPhotos[lb.idx].url} alt="" onClick={e => e.stopPropagation()} />
            <button className="lb-close" onClick={closeLb}>Close ✕</button>
            {folderPhotos.length > 1 && <>
              <button className="lb-prev" onClick={e => { e.stopPropagation(); prev(); }}>← Prev</button>
              <button className="lb-next" onClick={e => { e.stopPropagation(); next(); }}>Next →</button>
            </>}
          </>
        )}
      </div>
    </section>
  );
}

function Contact() {
  const [socials, setSocials] = useState([]);
  useEffect(() => { api.get('/social').then(r => setSocials(r.data)).catch(() => {}); }, []);
  const defaults = [
    { name: 'WhatsApp', url: 'https://wa.me/12052189806' },
    { name: 'Instagram', url: 'https://www.instagram.com/pixtron_pixels' },
    { name: 'Email', url: 'mailto:madhusaipavan02@gmail.com' },
  ];
  const list = socials.length ? socials : defaults;
  return (
    <section id="contact" style={{ borderTop:'1px solid #111' }}>
      <div style={{ padding:'2rem 2.5rem 1rem' }}>
        <p className="section-label">Lets Create Something</p>
        <h2 className="contact-big">GET IN TOUCH</h2>
      </div>
      <div className="social-strip">
        {list.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noreferrer" className="social-link">{s.name}</a>
        ))}
      </div>
    </section>
  );
}

function Booking() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ firstName:'',lastName:'',email:'',phone:'',date:'',message:'' });
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    if (!form.firstName || !form.email) return toast('Fill in your name and email.');
    setBusy(true);
    try {
      await api.post('/bookings', { ...form, service:'General Inquiry' });
      toast('Booking sent! I will be in touch within 24h.');
      setForm({ firstName:'',lastName:'',email:'',phone:'',date:'',message:'' });
    } catch { toast('Something went wrong. Try again.'); }
    finally { setBusy(false); }
  };
  return (
    <section id="booking" style={{ padding:'2.5rem 2.5rem 3rem', borderTop:'1px solid #111' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <p className="section-label">Reserve Your Date</p>
        <h2 className="section-title">BOOK A SESSION</h2>
      </div>
      <form className="booking-wrap" onSubmit={submit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input name="firstName" value={form.firstName} onChange={set} className="form-input" placeholder="John" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input name="lastName" value={form.lastName} onChange={set} className="form-input" placeholder="Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" name="email" value={form.email} onChange={set} className="form-input" placeholder="john@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp / Phone</label>
            <input name="phone" value={form.phone} onChange={set} className="form-input" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Date</label>
            <DatePicker value={form.date} onChange={val => setForm(f => ({ ...f, date: val }))} />
          </div>
          <div className="form-group full">
            <label className="form-label">Tell Me About Your Vision</label>
            <textarea name="message" value={form.message} onChange={set} className="form-input" rows={4} placeholder="Location, number of people, style references..." style={{ resize:'none', height:'100px' }} />
          </div>
        </div>
        <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Sending...' : 'Send Request →'}</button>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span className="footer-brand">BYDASAM</span>
      <span className="footer-copy">© 2026 clicksbydasam.com · All rights reserved</span>
    </footer>
  );
}

export default function Home() {
  return (
    <main style={{ background:'#000', minHeight:'100vh' }}>
      <Navbar />
      <Hero />
      <Carousel />
      <About />
      <Portfolio />
      <Collections />
      <Contact />
      <Booking />
      <Footer />
    </main>
  );
}
