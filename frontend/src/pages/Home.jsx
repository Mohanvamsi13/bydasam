import { useState, useEffect, useRef } from 'react';
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
        <img src={heroMedia} alt="Hero" className="hero-image" />
      ) : (
        <div className="hero-placeholder" />
      )}
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="hero-eyebrow">Photography</p>
        <h1 className="hero-name">BYDASAM</h1>
        <p className="hero-tagline">Street · Wedding · Speed & Steel · Abstract · Portrait</p>
      </div>
      <div className="hero-scroll">Scroll</div>
    </section>
  );
}

function Carousel() {
  const [photos, setPhotos] = useState([]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/settings/carousel').then(r => setPhotos(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % photos.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [photos]);

  const go = idx => {
    clearInterval(timerRef.current);
    setCurrent((idx + photos.length) % photos.length);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % photos.length), 5000);
  };

  if (photos.length === 0) {
    const items = ['Street','Wedding','Speed & Steel','Abstract','Portrait','Events','Fine Art','Urban','Documentary','Fashion'];
    return (
      <div className="marquee-strip">
        <div className="marquee-inner">
          {[...items,...items].map((item, i) => (
            <span key={i} className="marquee-item">
              {item}{i < items.length*2-1 && <span className="marquee-dot" />}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'relative', width:'100%', overflow:'hidden', background:'#000', borderTop:'1px solid #111', borderBottom:'1px solid #111', height:'75vh' }}>
      <div style={{ display:'flex', height:'100%', transition:'transform 0.8s cubic-bezier(0.77,0,0.175,1)', transform:`translateX(-${current * 100}%)` }}>
        {photos.map((p, i) => (
          <div key={i} style={{ minWidth:'100%', height:'100%', flexShrink:0, position:'relative' }}>
            <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.15)' }} />
          </div>
        ))}
      </div>
      <button onClick={() => go(current - 1)} style={{ position:'absolute', left:'2rem', top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', width:'52px', height:'52px', borderRadius:'50%', fontSize:'1.2rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', transition:'all 0.2s' }}>←</button>
      <button onClick={() => go(current + 1)} style={{ position:'absolute', right:'2rem', top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', width:'52px', height:'52px', borderRadius:'50%', fontSize:'1.2rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', transition:'all 0.2s' }}>→</button>
      <div style={{ position:'absolute', bottom:'1.5rem', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'8px' }}>
        {photos.map((_, i) => (
          <button key={i} onClick={() => go(i)} style={{ width: i===current ? '24px' : '8px', height:'8px', borderRadius:'4px', background: i===current ? '#fff' : 'rgba(255,255,255,0.4)', border:'none', cursor:'pointer', transition:'all 0.4s', padding:0 }} />
        ))}
      </div>
    </div>
  );
}

function Portfolio() {
  const [photos, setPhotos] = useState([]);
  const [folders, setFolders] = useState([]);
  const [active, setActive] = useState('all');
  const [lb, setLb] = useState({ open: false, idx: 0 });

  useEffect(() => {
    api.get('/categories/flat').then(r => setFolders(r.data)).catch(() => {});
    api.get('/photos').then(r => {
      const all = r.data;
      const featured = all.filter(p => p.featured);
      setPhotos(featured.length > 0 ? featured : all);
    }).catch(() => {});
  }, []);

  const filtered = active === 'all' ? photos : photos.filter(p => String(p.folder?._id || p.folder) === active);
  const openLb = idx => setLb({ open: true, idx });
  const closeLb = () => setLb(l => ({ ...l, open: false }));
  const prev = () => setLb(l => ({ ...l, idx: (l.idx - 1 + filtered.length) % filtered.length }));
  const next = () => setLb(l => ({ ...l, idx: (l.idx + 1) % filtered.length }));

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  });

  return (
    <section id="portfolio" style={{ background:'#000', paddingBottom:'3px' }}>
      <div className="section-header">
        <div>
          <p className="section-label">Selected Work</p>
          <h2 className="section-title">PORTFOLIO</h2>
        </div>
        <div className="cat-tabs" style={{ border:'none' }}>
          <button className={`cat-tab${active==='all'?' active':''}`} onClick={() => setActive('all')}>All</button>
          {folders.filter(f => !f.parent).map(f => (
            <button key={f._id} className={`cat-tab${active===f._id?' active':''}`} onClick={() => setActive(f._id)}>{f.name}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight:'40vh' }}>
          <div style={{ fontSize:'2rem', color:'rgba(255,255,255,0.06)' }}>◻</div>
          <p>No photos yet — upload via admin panel</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'2px', padding:'2px' }}>
          {filtered.map((p, i) => (
            <div key={p._id} onClick={() => openLb(i)} style={{ position:'relative', overflow:'hidden', aspectRatio:'2/3', cursor:'pointer', background:'#111' }}>
              <img src={p.url} alt={p.title||'Photo'} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)', display:'block' }}
                onMouseEnter={e => e.target.style.transform='scale(1.05)'}
                onMouseLeave={e => e.target.style.transform='scale(1)'}
              />
              {p.title && (
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'1.2rem 1rem 0.8rem', background:'linear-gradient(transparent,rgba(0,0,0,0.8))', opacity:0, transition:'opacity 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity='1'}
                  onMouseLeave={e => e.currentTarget.style.opacity='0'}
                >
                  <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.78rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#fff' }}>{p.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={`lightbox${lb.open?' open':''}`} onClick={closeLb}>
        {lb.open && filtered[lb.idx] && (
          <>
            <img src={filtered[lb.idx].url} alt={filtered[lb.idx].title||''} onClick={e => e.stopPropagation()} />
            <button className="lb-close" onClick={closeLb}>Close ✕</button>
            {filtered.length > 1 && <>
              <button className="lb-prev" onClick={e => { e.stopPropagation(); prev(); }}>← Prev</button>
              <button className="lb-next" onClick={e => { e.stopPropagation(); next(); }}>Next →</button>
            </>}
          </>
        )}
      </div>
    </section>
  );
}

function Collections() {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [folderPhotos, setFolderPhotos] = useState([]);
  const [lb, setLb] = useState({ open: false, idx: 0 });
  const [breadcrumb, setBreadcrumb] = useState([]);

  useEffect(() => {
    api.get('/categories/flat').then(r => setFolders(r.data)).catch(() => {});
  }, []);

  const openFolder = folder => {
    setActiveFolder(folder);
    setBreadcrumb(prev => [...prev, folder]);
    api.get('/photos?folder=' + folder._id).then(r => setFolderPhotos(r.data)).catch(() => {});
  };

  const goBack = () => {
    const newCrumb = breadcrumb.slice(0, -1);
    setBreadcrumb(newCrumb);
    if (newCrumb.length === 0) { setActiveFolder(null); setFolderPhotos([]); }
    else {
      const parent = newCrumb[newCrumb.length - 1];
      setActiveFolder(parent);
      api.get('/photos?folder=' + parent._id).then(r => setFolderPhotos(r.data)).catch(() => {});
    }
  };

  const getChildren = parentId => {
    if (!parentId) return folders.filter(f => !f.parent);
    return folders.filter(f => String(f.parent?._id || f.parent) === String(parentId));
  };

  const getCoverPhoto = folderId => {
    return null;
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
  const subFolders = activeFolder ? getChildren(activeFolder._id) : [];

  if (rootFolders.length === 0) return null;

  return (
    <section id="collections" style={{ background:'#000', borderTop:'1px solid #111', paddingBottom:'4rem' }}>
      <div className="section-header">
        <div>
          <p className="section-label">Browse Work</p>
          <h2 className="section-title">COLLECTIONS</h2>
        </div>
        {activeFolder && (
          <button onClick={goBack} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.2em', textTransform:'uppercase', background:'none', border:'1px solid #333', color:'rgba(255,255,255,0.5)', padding:'0.6rem 1.4rem', cursor:'pointer' }}>← Back</button>
        )}
      </div>

      {breadcrumb.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 2.5rem', marginBottom:'1.5rem' }}>
          <span onClick={() => { setActiveFolder(null); setBreadcrumb([]); setFolderPhotos([]); }} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.78rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', cursor:'pointer' }}>All</span>
          {breadcrumb.map((b, i) => (
            <span key={b._id} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ color:'rgba(255,255,255,0.2)' }}>›</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.78rem', letterSpacing:'0.15em', textTransform:'uppercase', color: i===breadcrumb.length-1 ? '#fff' : 'rgba(255,255,255,0.3)', cursor:'pointer' }}>{b.name}</span>
            </span>
          ))}
        </div>
      )}

      {!activeFolder ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'2px', padding:'0 2px' }}>
          {rootFolders.map(f => (
            <div key={f._id} onClick={() => openFolder(f)} style={{ position:'relative', aspectRatio:'4/3', overflow:'hidden', cursor:'pointer', background:'#111', group:true }}>
              <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#161616,#0d0d0d)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(1.5rem,4vw,3rem)', letterSpacing:'0.08em', color:'rgba(255,255,255,0.06)' }}>{f.name}</span>
              </div>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0)', transition:'background 0.3s', display:'flex', alignItems:'flex-end', padding:'1.5rem' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.4)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0)'}
              >
                <div>
                  <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', letterSpacing:'0.06em', color:'#fff' }}>{f.name}</p>
                  <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>{getChildren(f._id).length > 0 ? `${getChildren(f._id).length} albums` : 'View photos'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {subFolders.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'2px', padding:'0 2px', marginBottom:'2px' }}>
              {subFolders.map(f => (
                <div key={f._id} onClick={() => openFolder(f)} style={{ position:'relative', aspectRatio:'4/3', overflow:'hidden', cursor:'pointer', background:'#111' }}>
                  <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#161616,#0d0d0d)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:'0.06em', color:'rgba(255,255,255,0.06)' }}>{f.name}</span>
                  </div>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', padding:'1.2rem' }}>
                    <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#fff' }}>{f.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {folderPhotos.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'2px', padding:'0 2px' }}>
              {folderPhotos.map((p, i) => (
                <div key={p._id} onClick={() => openLb(i)} style={{ position:'relative', aspectRatio:'3/4', overflow:'hidden', cursor:'pointer', background:'#111' }}>
                  <img src={p.url} alt={p.title||''} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s', display:'block' }}
                    onMouseEnter={e => e.target.style.transform='scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform='scale(1)'}
                  />
                  {p.title && (
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'1rem', background:'linear-gradient(transparent,rgba(0,0,0,0.8))' }}>
                      <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#fff' }}>{p.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {subFolders.length === 0 && folderPhotos.length === 0 && (
            <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.15)' }}>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.25em', textTransform:'uppercase' }}>No photos in this collection yet</p>
            </div>
          )}
        </>
      )}

      <div className={`lightbox${lb.open?' open':''}`} onClick={closeLb}>
        {lb.open && folderPhotos[lb.idx] && (
          <>
            <img src={folderPhotos[lb.idx].url} alt={folderPhotos[lb.idx].title||''} onClick={e => e.stopPropagation()} />
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

function About() {
  const [settings, setSettings] = useState({});
  useEffect(() => { api.get('/settings').then(r => setSettings(r.data)).catch(() => {}); }, []);

  const name  = settings.aboutName  || 'Madhu Sai Pavan Dasam';
  const role  = settings.aboutRole  || 'Photographer · Storyteller · Visual Architect';
  const bio   = settings.aboutBio   || '';
  const photo = settings.aboutPhoto || '';
  const defaultBio = `I am a photographer obsessed with finding beauty in unexpected places. From the chaos of street life to the stillness of a wedding moment, every frame tells a story worth keeping. Trained at the legendary Annapurna Studios in Film and Photography, pursued a Masters in Photography at Dartmouth University, Massachusetts and an MBA from Lindsey Wilson College, Kentucky. Based in Alabama and available across the entire United States.`;

  return (
    <section id="about" style={{ borderTop:'1px solid #111', background:'#000' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:'80vh' }}>
        <div style={{ position:'relative', overflow:'hidden', background:'#0a0a0a' }}>
          {photo ? (
            <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
          ) : (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(4rem,10vw,9rem)', letterSpacing:'0.04em', color:'rgba(255,255,255,0.04)', userSelect:'none' }}>BYDASAM</span>
            </div>
          )}
        </div>
        <div style={{ padding:'6rem 5rem', display:'flex', flexDirection:'column', justifyContent:'center', borderLeft:'1px solid #111' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.4em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:'2rem' }}>{role}</p>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(2.5rem,5vw,4.5rem)', letterSpacing:'0.02em', lineHeight:1.05, color:'#fff', marginBottom:'2.5rem' }}>
            {name.toUpperCase()}
          </h2>
          <p style={{ fontSize:'1.05rem', fontWeight:300, lineHeight:1.95, color:'rgba(255,255,255,0.75)', maxWidth:'520px' }}>
            {bio || defaultBio}
          </p>
          <div style={{ marginTop:'3rem' }}>
            <a href="#booking" className="nav-book-btn" style={{ fontSize:'0.85rem', padding:'0.9rem 2.5rem' }}>Book a Session</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Booking() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ firstName:'',lastName:'',email:'',phone:'',service:'',date:'',message:'' });
  useEffect(() => { api.get('/services').then(r => setServices(r.data)).catch(() => {}); }, []);
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.service) return toast('Fill in name, email and service.');
    setBusy(true);
    try {
      await api.post('/bookings', form);
      toast('Booking sent! I will be in touch within 24h.');
      setForm({ firstName:'',lastName:'',email:'',phone:'',service:'',date:'',message:'' });
    } catch { toast('Something went wrong. Try again.'); }
    finally { setBusy(false); }
  };
  const defaultServices = ['Wedding','Street','Speed and Steel','Abstract','Portrait','Events'];
  return (
    <section id="booking" style={{ padding:'5rem 2.5rem', borderTop:'1px solid #111' }}>
      <div style={{ marginBottom:'3rem' }}>
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
            <label className="form-label">Session Type *</label>
            <select name="service" value={form.service} onChange={set} className="form-input">
              <option value="">Select...</option>
              {(services.length ? services.map(s => s.name) : defaultServices).map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
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
      <div className="contact-hero">
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
      <Portfolio />
      <Collections />
      <About />
      <Booking />
      <Contact />
      <Footer />
    </main>
  );
}
