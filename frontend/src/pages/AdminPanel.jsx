import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

const TABS = ['Photos','Categories','Services','Bookings','Social','Settings','Security'];

export default function AdminPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Photos');
  const doLogout = () => { logout(); navigate('/admin/login'); };
  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <span className="admin-brand">BYDASAM — Admin</span>
        <div style={{ display:'flex', gap:'0.8rem', alignItems:'center' }}>
          <a href="/" target="_blank" className="a-btn a-btn-ghost" style={{ fontSize:'0.62rem', padding:'0.5rem 1rem' }}>View Site</a>
          <button onClick={doLogout} className="a-btn a-btn-ghost" style={{ fontSize:'0.62rem', padding:'0.5rem 1rem' }}>Sign Out</button>
        </div>
      </div>
      <div className="admin-body">
        <aside className="admin-side">
          {TABS.map(t => <button key={t} className={`atab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
        </aside>
        <div className="admin-content">
          {tab==='Photos'     && <PhotosTab />}
          {tab==='Categories' && <CatsTab />}
          {tab==='Services'   && <ServicesTab />}
          {tab==='Bookings'   && <BookingsTab />}
          {tab==='Social'     && <SocialTab />}
          {tab==='Settings'   && <SettingsTab />}
          {tab==='Security'   && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return <div style={{ marginBottom:'1.4rem' }}><label className="a-label">{label}</label>{children}</div>;
}
function TwoCol({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 2rem' }}>{children}</div>;
}

function PhotosTab() {
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => Promise.all([
    api.get('/photos').then(r => setPhotos(r.data)),
    api.get('/categories').then(r => setCats(r.data)),
  ]).catch(() => {});
  useEffect(() => { load(); }, []);
  const upload = async e => {
    const files = [...e.target.files];
    if (!files.length) return;
    setBusy(true);
    const fd = new FormData();
    files.forEach(f => fd.append('photos', f));
    if (cat) fd.append('category', cat);
    if (title) fd.append('title', title);
    try {
      await api.post('/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast(files.length + ' photo(s) uploaded!');
      setTitle(''); e.target.value = '';
      load();
    } catch (err) { toast(err.response?.data?.error || 'Upload failed'); }
    finally { setBusy(false); }
  };
  const del = async id => {
    if (!confirm('Delete this photo?')) return;
    try { await api.delete('/photos/' + id); toast('Deleted'); load(); }
    catch { toast('Error'); }
  };
  return (
    <>
      <h2 className="admin-section-title">Upload Photos</h2>
      <TwoCol>
        <Row label="Category">
          <select className="a-input" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">No category</option>
            {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Row>
        <Row label="Title (optional)">
          <input className="a-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Golden Hour" />
        </Row>
      </TwoCol>
      <label className="upload-zone">
        <input type="file" accept="image/*" multiple onChange={upload} />
        <div className="upload-icon">↑</div>
        <p>{busy ? 'Uploading...' : 'Click or drag photos here'}</p>
        <p style={{ marginTop:'0.4rem', opacity:0.6 }}>JPG PNG WEBP up to 15MB each</p>
      </label>
      <p className="a-label" style={{ marginBottom:'0.8rem' }}>All Photos ({photos.length})</p>
      <div className="thumb-grid">
        {photos.map(p => (
          <div key={p._id} className="thumb">
            <img src={p.url} alt={p.title || ''} loading="lazy" />
            <div className="thumb-del">
              <button className="a-btn a-btn-red" style={{ fontSize:'0.6rem', padding:'0.4rem 0.8rem' }} onClick={() => del(p._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CatsTab() {
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [name, setName] = useState('');
  const load = () => api.get('/categories').then(r => setCats(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!name.trim()) return toast('Enter a name');
    try { await api.post('/categories', { name: name.trim() }); toast('Added'); setName(''); load(); }
    catch (e) { toast(e.response?.data?.error || 'Error'); }
  };
  const del = async id => {
    if (!confirm('Delete?')) return;
    try { await api.delete('/categories/' + id); load(); }
    catch { toast('Error'); }
  };
  return (
    <>
      <h2 className="admin-section-title">Categories</h2>
      <Row label="Category Name">
        <input className="a-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Landscape" onKeyDown={e => e.key==='Enter' && add()} />
      </Row>
      <button className="a-btn" onClick={add} style={{ marginBottom:'2rem' }}>+ Add Category</button>
      {cats.map(c => (
        <div key={c._id} className="list-row">
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase' }}>{c.name}</span>
          <button className="a-btn a-btn-red" style={{ fontSize:'0.6rem', padding:'0.4rem 1rem' }} onClick={() => del(c._id)}>Remove</button>
        </div>
      ))}
    </>
  );
}

function ServicesTab() {
  const toast = useToast();
  const [svcs, setSvcs] = useState([]);
  const [form, setForm] = useState({ name:'', price:'', desc:'' });
  const load = () => api.get('/services').then(r => setSvcs(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.name) return toast('Enter a name');
    try { await api.post('/services', form); toast('Added'); setForm({ name:'', price:'', desc:'' }); load(); }
    catch (e) { toast(e.response?.data?.error || 'Error'); }
  };
  const del = async id => {
    try { await api.delete('/services/' + id); load(); }
    catch { toast('Error'); }
  };
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <h2 className="admin-section-title">Services</h2>
      <Row label="Service Name"><input name="name" className="a-input" value={form.name} onChange={set} placeholder="e.g. Corporate Events" /></Row>
      <TwoCol>
        <Row label="Price"><input name="price" className="a-input" value={form.price} onChange={set} placeholder="From $400" /></Row>
        <div />
      </TwoCol>
      <Row label="Description"><textarea name="desc" className="a-textarea" value={form.desc} onChange={set} placeholder="What is included..." /></Row>
      <button className="a-btn" onClick={add} style={{ marginBottom:'2rem' }}>+ Add Service</button>
      {svcs.map(s => (
        <div key={s._id} className="list-row">
          <div>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.9rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>{s.name}</p>
            <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', fontWeight:300 }}>{s.price}</p>
          </div>
          <button className="a-btn a-btn-red" style={{ fontSize:'0.6rem', padding:'0.4rem 1rem' }} onClick={() => del(s._id)}>Remove</button>
        </div>
      ))}
    </>
  );
}

function BookingsTab() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const load = () => api.get('/bookings').then(r => setBookings(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const patch = async (id, status) => {
    try { await api.patch('/bookings/' + id, { status }); load(); toast('Updated'); }
    catch { toast('Error'); }
  };
  const del = async id => {
    if (!confirm('Delete?')) return;
    try { await api.delete('/bookings/' + id); load(); }
    catch { toast('Error'); }
  };
  const pillClass = s => s==='confirmed' ? 'status-pill pill-confirmed' : s==='cancelled' ? 'status-pill pill-cancelled' : 'status-pill pill-new';
  return (
    <>
      <h2 className="admin-section-title">Bookings ({bookings.length})</h2>
      {bookings.length === 0 && <p style={{ color:'rgba(255,255,255,0.15)', fontSize:'0.8rem' }}>No bookings yet.</p>}
      {bookings.map(b => (
        <div key={b._id} className="booking-card">
          <div style={{ display:'flex', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
            <div>
              <p className="bk-name">{b.firstName} {b.lastName}</p>
              <p className="bk-meta">{b.service} - {b.date || 'Flexible'}</p>
              <p className="bk-meta">{b.email}{b.phone ? ' - ' + b.phone : ''}</p>
              {b.message && <p className="bk-msg">{b.message}</p>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.6rem' }}>
              <span className={pillClass(b.status)}>{b.status}</span>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                {b.status !== 'confirmed' && <button onClick={() => patch(b._id,'confirmed')} style={{ fontSize:'0.6rem', color:'rgba(100,200,100,0.8)', border:'1px solid rgba(100,200,100,0.2)', background:'transparent', padding:'0.4rem 0.9rem', cursor:'pointer' }}>Confirm</button>}
                {b.status !== 'cancelled' && <button onClick={() => patch(b._id,'cancelled')} className="a-btn a-btn-ghost" style={{ fontSize:'0.6rem', padding:'0.4rem 0.9rem' }}>Cancel</button>}
                <button className="a-btn a-btn-red" style={{ fontSize:'0.6rem', padding:'0.4rem 0.9rem' }} onClick={() => del(b._id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function SocialTab() {
  const toast = useToast();
  const [socials, setSocials] = useState([]);
  const [form, setForm] = useState({ name:'', url:'' });
  const load = () => api.get('/social').then(r => setSocials(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.name || !form.url) return toast('Name and URL required');
    try { await api.post('/social', form); toast('Added'); setForm({ name:'', url:'' }); load(); }
    catch (e) { toast(e.response?.data?.error || 'Error'); }
  };
  const del = async id => {
    try { await api.delete('/social/' + id); load(); }
    catch { toast('Error'); }
  };
  const update = async (id, url) => {
    try { await api.patch('/social/' + id, { url }); toast('Saved'); }
    catch { toast('Error'); }
  };
  return (
    <>
      <h2 className="admin-section-title">Social Links</h2>
      {socials.map(s => (
        <div key={s._id} className="list-row">
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.72rem', letterSpacing:'0.18em', textTransform:'uppercase', minWidth:'90px', color:'rgba(255,255,255,0.4)' }}>{s.name}</span>
          <input defaultValue={s.url} onBlur={e => update(s._id, e.target.value)} style={{ flex:1, background:'transparent', border:'none', borderBottom:'1px solid #1a1a1a', color:'rgba(255,255,255,0.6)', fontFamily:"'Barlow',sans-serif", fontSize:'0.82rem', padding:'0.4rem 0', outline:'none' }} />
          <button className="a-btn a-btn-red" style={{ fontSize:'0.6rem', padding:'0.4rem 0.9rem' }} onClick={() => del(s._id)}>Remove</button>
        </div>
      ))}
      <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid #111' }}>
        <p className="a-label" style={{ marginBottom:'1rem' }}>Add New Platform</p>
        <TwoCol>
          <Row label="Platform Name"><input className="a-input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. TikTok" /></Row>
          <Row label="URL"><input className="a-input" value={form.url} onChange={e => setForm(f=>({...f,url:e.target.value}))} placeholder="https://tiktok.com/@handle" /></Row>
        </TwoCol>
        <button className="a-btn" onClick={add}>+ Add Platform</button>
      </div>
    </>
  );
}

function SettingsTab() {
  const toast = useToast();
  const [form, setForm] = useState({ heroTagline:'', aboutText:'', contactEmail:'', whatsapp:'' });
  const [aboutPhoto, setAboutPhoto] = useState('');
  const [heroMedia, setHeroMedia] = useState('');
  const [heroMediaType, setHeroMediaType] = useState('');
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      setForm(f => ({...f,...r.data}));
      if (r.data.aboutPhoto) setAboutPhoto(r.data.aboutPhoto);
      if (r.data.heroMedia) setHeroMedia(r.data.heroMedia);
      if (r.data.heroMediaType) setHeroMediaType(r.data.heroMediaType);
    }).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({...f, [e.target.name]: e.target.value}));

  const save = async () => {
    try { await api.post('/settings', form); toast('Settings saved!'); }
    catch { toast('Error saving'); }
  };

  const uploadAboutPhoto = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAbout(true);
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const { data } = await api.post('/settings/about-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAboutPhoto(data.url);
      toast('About photo updated!');
    } catch { toast('Upload failed'); }
    finally { setUploadingAbout(false); e.target.value = ''; }
  };

  const uploadHeroMedia = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration < 30) {
          toast('Video must be at least 30 seconds long!');
          e.target.value = '';
          return;
        }
        await doHeroUpload(file, e);
      };
      video.src = URL.createObjectURL(file);
    } else {
      await doHeroUpload(file, e);
    }
  };

  const doHeroUpload = async (file, e) => {
    setUploadingHero(true);
    const fd = new FormData();
    fd.append('media', file);
    try {
      const { data } = await api.post('/settings/hero-media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHeroMedia(data.url);
      setHeroMediaType(data.type);
      toast('Hero media updated!');
    } catch { toast('Upload failed'); }
    finally { setUploadingHero(false); e.target.value = ''; }
  };

  return (
    <>
      <h2 className="admin-section-title">Site Settings</h2>

      <div style={{ marginBottom:'2rem', paddingBottom:'2rem', borderBottom:'1px solid #111' }}>
        <p className="a-label" style={{ marginBottom:'0.5rem' }}>Hero Background (Photo or Video)</p>
        <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', marginBottom:'1rem', fontWeight:300 }}>Fills the full screen behind BYDASAM. Video must be minimum 30 seconds. Plays silently and loops automatically.</p>
        {heroMedia && (
          <div style={{ marginBottom:'1rem' }}>
            {heroMediaType === 'video' ? (
              <video src={heroMedia} style={{ width:'100%', maxWidth:'400px', height:'200px', objectFit:'cover', opacity:0.8 }} muted controls />
            ) : (
              <img src={heroMedia} alt="Hero" style={{ width:'100%', maxWidth:'400px', height:'200px', objectFit:'cover', opacity:0.8 }} />
            )}
          </div>
        )}
        <label className="upload-zone" style={{ maxWidth:'400px' }}>
          <input type="file" accept="image/*,video/*" onChange={uploadHeroMedia} />
          <div className="upload-icon">↑</div>
          <p>{uploadingHero ? 'Uploading... this may take a while for videos' : heroMedia ? 'Click to change hero media' : 'Upload photo or video'}</p>
          <p style={{ marginTop:'0.3rem', opacity:0.5 }}>Photo: JPG PNG WEBP · Video: MP4 MOV (min 30 sec)</p>
        </label>
      </div>

      <div style={{ marginBottom:'2rem', paddingBottom:'2rem', borderBottom:'1px solid #111' }}>
        <p className="a-label" style={{ marginBottom:'1rem' }}>About Section Photo</p>
        {aboutPhoto && (
          <img src={aboutPhoto} alt="About" style={{ width:'150px', height:'200px', objectFit:'cover', marginBottom:'1rem', opacity:0.8 }} />
        )}
        <label className="upload-zone" style={{ maxWidth:'400px' }}>
          <input type="file" accept="image/*" onChange={uploadAboutPhoto} />
          <div className="upload-icon">↑</div>
          <p>{uploadingAbout ? 'Uploading...' : aboutPhoto ? 'Click to change photo' : 'Upload your photo'}</p>
          <p style={{ marginTop:'0.3rem', opacity:0.5 }}>This appears next to your bio on the website</p>
        </label>
      </div>

      <Row label="Hero Tagline"><input name="heroTagline" className="a-input" value={form.heroTagline || ''} onChange={handle} placeholder="Street Wedding Speed and Steel Abstract Portrait" /></Row>
      <Row label="About Text"><textarea name="aboutText" className="a-textarea" value={form.aboutText || ''} onChange={handle} placeholder="A short bio..." style={{ height:'100px' }} /></Row>
      <TwoCol>
        <Row label="Contact Email"><input name="contactEmail" type="email" className="a-input" value={form.contactEmail || ''} onChange={handle} placeholder="hello@clicksbydasam.com" /></Row>
        <Row label="WhatsApp Number"><input name="whatsapp" className="a-input" value={form.whatsapp || ''} onChange={handle} placeholder="+1 (205) 218-9806" /></Row>
      </TwoCol>
      <button className="a-btn" onClick={save}>Save Settings</button>
    </>
  );
}

function SecurityTab() {
  const toast = useToast();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [mfaOn, setMfaOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const setupMfa = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/mfa/setup');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      toast('Scan the QR code with Google Authenticator');
    } catch { toast('Error setting up MFA'); }
    finally { setLoading(false); }
  };
  const verifyMfa = async () => {
    if (code.length !== 6) return toast('Enter a 6-digit code');
    try {
      await api.post('/auth/mfa/verify', { token: code });
      toast('MFA enabled successfully!');
      setMfaOn(true);
      setQrCode('');
      setCode('');
    } catch { toast('Invalid code. Try again.'); }
  };
  const disableMfa = async () => {
    if (!confirm('Are you sure you want to disable MFA?')) return;
    try {
      await api.post('/auth/mfa/disable');
      toast('MFA disabled.');
      setMfaOn(false);
      setQrCode('');
      setSecret('');
    } catch { toast('Error'); }
  };
  return (
    <>
      <h2 className="admin-section-title">Security</h2>
      <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.35)', lineHeight:1.8, marginBottom:'2rem', fontWeight:300 }}>
        Multi-Factor Authentication adds an extra layer of security. After entering your password you will be asked for a 6-digit code from Google Authenticator.
      </p>
      {!mfaOn && !qrCode && (
        <button className="a-btn" onClick={setupMfa} disabled={loading}>
          {loading ? 'Setting up...' : 'Setup Google Authenticator'}
        </button>
      )}
      {qrCode && (
        <div style={{ marginTop:'1.5rem' }}>
          <p className="a-label" style={{ marginBottom:'1rem' }}>Step 1 - Scan this QR code with Google Authenticator</p>
          <img src={qrCode} alt="QR Code" style={{ width:'200px', height:'200px', background:'#fff', padding:'8px', borderRadius:'4px' }} />
          <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', marginTop:'1rem', fontWeight:300 }}>
            Cannot scan? Enter this code manually: <span style={{ color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em' }}>{secret}</span>
          </p>
          <div style={{ marginTop:'2rem' }}>
            <p className="a-label" style={{ marginBottom:'0.8rem' }}>Step 2 - Enter the 6-digit code from the app</p>
            <input className="a-input" value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} style={{ maxWidth:'200px', textAlign:'center', fontSize:'1.2rem', letterSpacing:'0.4em' }} />
            <div style={{ marginTop:'1rem' }}>
              <button className="a-btn" onClick={verifyMfa}>Verify and Enable MFA</button>
            </div>
          </div>
        </div>
      )}
      {mfaOn && (
        <div>
          <p style={{ fontSize:'0.85rem', color:'rgba(100,200,100,0.8)', marginBottom:'1.5rem', fontWeight:300 }}>MFA is active on your account.</p>
          <button className="a-btn a-btn-red" onClick={disableMfa}>Disable MFA</button>
        </div>
      )}
    </>
  );
}
