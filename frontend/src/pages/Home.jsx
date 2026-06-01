import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-placeholder" />
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

function Marquee() {
  const [photos, setPhotos] = useState([]);
  useEffect(() => { api.get('/photos').then(r => setPhotos(r.data)).catch(() => {}); }, []);
  const items = ['Street','Wedding','Speed & Steel','Abstract','Portrait','Events','Fine Art','Urban','Documentary','Fashion'];
  return (
    <div className="marquee-strip">
      <div className="marquee-inner">
        {photos.length > 0
          ? [...photos, ...photos].map((p, i) => (
              <img key={i} src={p.url} alt={p.title || ''} style={{ height:'80px', width:'120px', objectFit:'cover', flexShrink:0, opacity:0.7 }} />
            ))
          : [...items, ...items].map((item, i) => (
              <span key={i} className="marquee-item">
                {item}
                {i < items.length * 2 - 1 && <span className="marquee-dot" />}
              </span>
            ))
        }
      </div>
    </div>
  );
}

function Portfolio() {
  const [photos, setPhotos] = useState([]);
  const [cats, setCats] = useState([]);
  const [active, setActive] = useState('all');
  const [lb, setLb] = useState({ open: false, idx: 0 });
  useEffect(() => {
    api.get('/categories').then(r => setCats(r.data)).catch(() => {});
    api.get('/photos').then(r => setPhotos(r.data)).catch(() => {});
  }, []);
  const filtered = active === 'all' ? photos : photos.filter(p => p.category?._id === active);
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
    <section id="portfolio" style={{ background: '#000', paddingBottom: '3px' }}>
      <div className="section-header">
        <div>
          <p className="section-label">Selected Work</p>
          <h2 className="section-title">PORTFOLIO</h2>
        </div>
        <div className="cat-tabs" style={{ border: 'none' }}>
          <button className={`cat-tab${active === 'all' ? ' active' : ''}`} onClick={() => setActive('all')}>All</button>
          {cats.map(c => (
            <button key={c._id} className={`cat-tab${active === c._id ? ' active' : ''}`} onClick={() => setActive(c._id)}>{c.name}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <div style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.06)' }}>◻</div>
          <p>No photos yet — upload via admin panel</p>
        </div>
      ) : (
        <div className="masonry">
          {filtered.map((p, i) => (
            <div key={p._id} className="masonry-item" onClick={() => openLb(i)}>
              <img src={p.url} alt={p.title || 'Photo'} loading="lazy" />
              <div className="masonry-overlay">
                <div className="masonry-info">
                  {p.title && <h3>{p.title}</h3>}
                  {p.category?.name && <p>{p.category.name}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={`lightbox${lb.open ? ' open' : ''}`} onClick={closeLb}>
        {lb.open && filtered[lb.idx] && (
          <>
            <img src={filtered[lb.idx].url} alt={filtered[lb.idx].title || ''} onClick={e => e.stopPropagation()} />
            <button className="lb-close" onClick={closeLb}>Close X</button>
            {filtered.length > 1 && <>
              <button className="lb-prev" onClick={e => { e.stopPropagation(); prev(); }}>Prev</button>
              <button className="lb-next" onClick={e => { e.stopPropagation(); next(); }}>Next</button>
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
    <section id="services" style={{ background: '#000', paddingTop: '4rem' }}>
      <div className="section-header" style={{ paddingBottom: '1rem' }}>
        <div>
          <p className="section-label">What I Do</p>
          <h2 className="section-title">SERVICES</h2>
        </div>
        <a href="#booking" className="nav-book-btn" style={{ alignSelf: 'flex-end' }}>Book Now</a>
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
    <section id="booking" style={{ padding: '5rem 2.5rem', borderTop: '1px solid #111' }}>
      <div style={{ marginBottom: '3rem' }}>
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
            <input type="date" name="date" value={form.date} onChange={set} className="form-input" />
          </div>
          <div className="form-group full">
            <label className="form-label">Tell Me About Your Vision</label>
            <textarea name="message" value={form.message} onChange={set} className="form-input" rows={4} placeholder="Location, number of people, style references, anything you have in mind..." style={{ resize: 'none', height: '80px' }} />
          </div>
        </div>
        <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Sending...' : 'Send Request'}</button>
      </form>
    </section>
  );
}

function About() {
  const [aboutPhoto, setAboutPhoto] = useState('');
  useEffect(() => {
    api.get('/settings').then(r => {
      if (r.data.aboutPhoto) setAboutPhoto(r.data.aboutPhoto);
    }).catch(() => {});
  }, []);

  return (
    <section id="about" style={{ borderTop: '1px solid #111' }}>
      <div className="about-grid">
        <div className="about-visual" style={{ position:'relative', overflow:'hidden' }}>
          {aboutPhoto ? (
            <img src={aboutPhoto} alt="Madhu Sai Pavan Dasam" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.85 }} />
          ) : (
            <div className="about-visual-inner">
              <span className="about-visual-name">BYDASAM</span>
            </div>
          )}
        </div>
        <div className="about-text">
          <p className="about-role">Photographer · Storyteller · Visual Architect</p>
          <p>I am <strong>Madhu Sai Pavan Dasam</strong> — a photographer obsessed with finding beauty in unexpected places. From the chaos of street life to the stillness of a wedding moment, every frame tells a story worth keeping.</p>
          <p>Trained at the legendary <strong>Annapurna Studios</strong> in Film and Photography, pursued a <strong>Masters in Photography at Dartmouth University, Massachusetts</strong> and an <strong>MBA from Lindsey Wilson College, Kentucky</strong> — bringing a rare blend of artistic mastery and business sharpness to every project.</p>
          <p>Based in <strong>Alabama</strong> and available across the entire United States, I specialize in capturing the moments that words simply cannot describe. Weddings that make you cry rewatching them. Streets that feel alive. Cars that look like they are moving standing still. Abstract work that makes you stop and stare.</p>
          <p>My unique combination of artistic training and business acumen means I do not just understand photography — <strong>I understand you, your brand, and what you need.</strong></p>
          <p>I do not just photograph your moments — <strong>I preserve them forever.</strong></p>
          <p style={{ marginTop: '2rem' }}>
            <a href="#booking" className="nav-book-btn">Work with me</a>
          </p>
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
    <section id="contact" style={{ borderTop: '1px solid #111' }}>
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
      <span className="footer-copy">2026 clicksbydasam.com All rights reserved</span>
      <a href="/admin/login" className="footer-copy" style={{ opacity: 0.5 }}>Admin</a>
    </footer>
  );
}

export default function Home() {
  return (
    <main style={{ background: '#000', minHeight: '100vh' }}>
      <Navbar />
      <Hero />
      <Marquee />
      <Portfolio />
      <About />
      <Services />
      <Contact />
      <Booking />
      <Footer />
    </main>
  );
}
