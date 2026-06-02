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
  useEffect(() => {
    api.get('/settings/carousel').then(r => setPhotos(r.data)).catch(() => {});
  }, []);

  const items = ['Street','Wedding','Speed & Steel','Abstract','Portrait','Events','Fine Art','Urban','Documentary','Fashion'];

  if (photos.length === 0) {
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

  const doubled = [...photos, ...photos];

  return (
    <div style={{ overflow:'hidden', background:'#000', borderTop:'1px solid #111', borderBottom:'1px solid #111', height:'38vw', maxHeight:'420px', minHeight:'200px', position:'relative' }}>
      <div style={{
        display:'flex',
        height:'100%',
        width:`${doubled.length * 100}%`,
        animation:`carouselScroll ${photos.length * 3}s linear infinite`,
      }}>
        {doubled.map((p, i) => (
          <div key={i} style={{ width:`${100 / doubled.length}%`, height:'100%', flexShrink:0 }}>
            <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes carouselScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
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
    <section id="portfolio" style={{ background:'#000', paddingBottom:'3px' }}>
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

function Collections() {
  const [folders, setFolders] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [folderPhotos, setFolderPhotos] = useState([]);
  const [lb, setLb] = useState({ open: false, idx: 0 });

  useEffect(() => {
    api.get('/categories/flat').then(r => setFolders(r.data)).catch(() => {});
    api.get('/photos').then(r => setPhotos(r.data)).catch(() => {});
  }, []);

  const currentFolder = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null;

  const getChildren = parentId => {
    if (!parentId) return folders.filter(f => !f.parent);
    return folders.filter(f => String(f.parent?._id || f.parent) === String(parentId));
  };

  const getCover = folderId => {
    const direct = photos.find(p => String(p.folder?._id || p.folder) === String(folderId));
    if (direct) return direct.url;
    const children = getChildren(folderId);
    for (const child of children) {
      const cover = getCover(child._id);
      if (cover) return cover;
    }
    return null;
  };

  const openFolder = folder => {
    const newCrumb = [...breadcrumb, folder];
    setBreadcrumb(newCrumb);
    api.get('/photos?folder=' + folder._id).then(r => setFolderPhotos(r.data)).catch(() => {});
  };

  const goToCrumb = idx => {
    if (idx === -1) {
      setBreadcrumb([]);
      setFolderPhotos([]);
    } else {
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
    <section id="collections" style={{ background:'#000', borderTop:'1px solid #111', paddingBottom:'4rem' }}>
      <div className="section-header">
        <div>
          <p className="section-label">Browse Work</p>
          <h2 className="section-title">COLLECTIONS</h2>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0 2.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <span onClick={() => goToCrumb(-1)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color: breadcrumb.length === 0 ? '#fff' : 'rgba(255,255,255,0.35)', cursor:'pointer', transition:'color 0.2s' }}>All Collections</span>
        {breadcrumb.map((b, i) => (
          <span key={b._id} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.7rem' }}>›</span>
            <span onClick={() => goToCrumb(i)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color: i===breadcrumb.length-1 ? '#fff' : 'rgba(255,255,255,0.35)', cursor:'pointer', transition:'color 0.2s' }}>{b.name}</span>
          </span>
        ))}
      </div>

      {currentChildren.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'3px', padding:'0 3px', marginBottom: folderPhotos.length > 0 ? '3px' : 0 }}>
          {currentChildren.map(f => {
            const cover = getCover(f._id);
            return (
              <div key={f._id} onClick={() => openFolder(f)} style={{ position:'relative', aspectRatio:'3/2', overflow:'hidden', cursor:'pointer', background:'#111' }}>
                {cover ? (
                  <img src={cover} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s', display:'block' }}
                    onMouseEnter={e => e.target.style.transform='scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform='scale(1)'}
                  />
                ) : (
                  <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#161616,#0d0d0d)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(1rem,3vw,2rem)', color:'rgba(255,255,255,0.05)', letterSpacing:'0.06em' }}>{f.name}</span>
                  </div>
                )}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0.8rem 1rem', background:'linear-gradient(transparent, rgba(0,0,0,0.75))' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'0.7rem' }}>📁</span>
                    <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#fff' }}>{f.name}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {folderPhotos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'3px', padding:'0 3px' }}>
          {folderPhotos.map((p, i) => (
            <div key={p._id} onClick={() => openLb(i)} style={{ position:'relative', aspectRatio:'3/2', overflow:'hidden', cursor:'pointer', background:'#111' }}>
              <img src={p.url} alt={p.title||''} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s', display:'block' }}
                onMouseEnter={e => e.target.style.transform='scale(1.05)'}
                onMouseLeave={e => e.target.style.transform='scale(1)'}
              />
              {p.title && (
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0.8rem 1rem', background:'linear-gradient(transparent,rgba(0,0,0,0.7))' }}>
                  <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.78rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#fff' }}>{p.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {currentChildren.length === 0 && folderPhotos.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.25em', textTransform:'uppercase' }}>No photos in this collection yet</p>
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
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(2.5rem,5vw,4.5rem)', letterSpacing:'0.02em', lineHeight:1.05, color:'#fff', marginBottom:'2.5rem' }}>{name.toUpperCase()}</h2>
          <p style={{ fontSize:'1.05rem', fontWeight:300, lineHeight:1.95, color:'rgba(255,255,255,0.75)', maxWidth:'520px' }}>{bio || defaultBio}</p>
          <div style={{ marginTop:'3rem' }}>
            <a href="#booking" className="nav-book-btn" style={{ fontSize:'0.85rem', padding:'0.9rem 2.5rem' }}>Book a Session</a>
          </div>
        </div>
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
      <Contact />
      <Booking />
      <Footer />
    </main>
  );
}
