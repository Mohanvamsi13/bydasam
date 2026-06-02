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
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % photos.length), 4000);
    return () => clearInterval(timerRef.current);
  }, [photos]);

  const go = (idx) => {
    clearInterval(timerRef.current);
    setCurrent((idx + photos.length) % photos.length);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % photos.length), 4000);
  };

  if (photos.length === 0) {
    const items = ['Street','Wedding','Speed & Steel','Abstract','Portrait','Events','Fine Art','Urban','Documentary','Fashion'];
    const all = [...items, ...items];
    return (
      <div className="marquee-strip">
        <div className="marquee-inner">
          {all.map((item, i) => (
            <span key={i} className="marquee-item">
              {item}
              {i < all.length - 1 && <span className="marquee-dot" />}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'relative', width:'100%', overflow:'hidden', background:'#000', borderTop:'1px solid #111', borderBottom:'1px solid #111' }}>
      <div style={{ display:'flex', transition:'transform 0.6s cubic-bezier(0.77,0,0.175,1)', transform:`translateX(-${current * 100}%)` }}>
        {photos.map((p, i) => (
          <div key={i} style={{ minWidth:'100%', height:'70vh', flexShrink:0, position:'relative' }}>
            <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.85 }} />
          </div>
        ))}
      </div>
      <button onClick={() => go(current - 1)} style={{ position:'absolute', left:'1.5rem', top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:'44px', height:'44px', borderRadius:'50%', fontSize:'1.1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
      <button onClick={() => go(current + 1)} style={{ position:'absolute', right:'1.5rem', top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:'44px', height:'44px', borderRadius:'50%', fontSize:'1.1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>→</button>
      <div style={{ position:'absolute', bottom:'1.2rem', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'6px' }}>
        {photos.map((_, i) => (
          <button key={i} onClick={() => go(i)} style={{ width: i===current ? '20px' : '6px', height:'6px', borderRadius:'3px', background: i===current ? '#fff' : 'rgba(255,255,255,0.3)', border:'none', cursor:'pointer', transition:'all 0.3s', padding:0 }} />
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
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'3px', padding:'3px' }}>
          {filtered.map((p, i) => (
            <div key={p._id} onClick={() => openLb(i)} style={{ position:'relative', overflow:'hidden', aspectRatio:'3/4', cursor:'pointer', background:'#111' }}>
              <img src={p.url} alt={p.title || 'Photo'} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' }}
                onMouseEnter={e => e.target.style.transform='scale(1.04)'}
                onMouseLeave={e => e.target.style.transform='scale(1)'}
              />
              {p.title && (
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'1rem', background:'linear-gradient(transparent, rgba(0,0,0,0.7))', opacity:0, transition:'opacity 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity='1'}
                  onMouseLeave={e => e.currentTarget.style.opacity='0'}
                >
                  <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'#fff' }}>{p.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={`lightbox${lb.open?' open':''}`} onClick={closeLb}>
        {lb.open && filtered[lb.idx] && (
          <>
            <img src={filtered[lb.idx].url} alt={filtered[lb.idx].title || ''} onClick={e => e.stopPropagation()} />
            <button className="lb-close" onClick={closeLb}>Close ✕</button>
            {filtered.length > 1 && <>
              <button className="lb-prev" onClick={e => { e.stopPropagation(); prev(); }}>← Prev</button>
              <button className="lb-next" onClick={e => { e.stopPropagation(); next(); }}>Next →</button>
            </>}
            {filtered[lb.idx].title && <div className="lb-caption"><p>{filtered[lb.idx].title}</p></div>}
          </>
        )}
      </div>
    </section>
  );
}

function Services() {
  const [services, setServices] = useState([]);
  useEffect(() => { api.get('/services').then(r => setServices(r.data)).catch(() => {}); }, []);
  const defaults = [
    { _id:'1', name:'Wedding', desc:'Full-day coverage of your wedding. Every candid moment, every tear, every laugh beautifully preserved forever.', price:'From $800' },
    { _id:'2', name:'Street', desc:'Raw urban life caught in motion. I walk the city and photograph life as it unfolds honest and unposed.', price:'From $250' },
    { _id:'3', name:'Speed and Steel', desc:'Dynamic car and bike shoots at stunning locations. Perfect for owners, dealerships, and automotive brands.', price:'From $400' },
    { _id:'4', name:'Abstract', desc:'Experimental fine art photography. Conceptual images that challenge how you see the ordinary world.', price:'From $300' },
    { _id:'5', name:'Portrait', desc:'Professional or creative portraits studio or on-location. Headshots, family, personal branding.', price:'From $200' },
    { _id:'6', name:'Events', desc:'Corporate events, launches, exhibitions, private parties every moment documented with precision.', price:'From $500' },
  ];
  const list = services.length ? services : defaults;
  return (
    <section id="services" style={{ background:'#000', paddingTop:'4rem' }}>
      <div className="section-header" style={{ paddingBottom:'1rem' }}>
        <div>
          <p className="section-label">What I Do</p>
          <h2 className="section-title">SERVICES</h2>
        </div>
        <a href="#booking" className="nav-book-btn" style={{ alignSelf:'flex-end' }}>Book Now</a>
      </div>
      <div className="services-grid">
        {list.map(s => (
          <a key={s._id} href="#booking" className="service-card">
            <h3>{s.name}</h3>
            <p>{s.desc}</p>
            <div className="service-price">{s.price}</div>
            <div className="service-arrow">→</div>
          </a>
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
      <About />
      <Services />
      <Contact />
      <Booking />
      <Footer />
    </main>
  );
}
