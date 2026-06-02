import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

const TABS = [
  { id:'Photos', icon:'📷' },
  { id:'Folders', icon:'📁' },
  { id:'Featured', icon:'⭐' },
  { id:'Services', icon:'💼' },
  { id:'Bookings', icon:'📅' },
  { id:'About', icon:'👤' },
  { id:'Social', icon:'🔗' },
  { id:'Settings', icon:'⚙️' },
  { id:'Security', icon:'🔒' },
];

export default function AdminPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Photos');
  const [stats, setStats] = useState({ photos:0, bookings:0, featured:0, folders:0 });

  useEffect(() => {
    Promise.all([
      api.get('/photos').then(r => r.data.length).catch(() => 0),
      api.get('/bookings').then(r => r.data.length).catch(() => 0),
      api.get('/photos?featured=true').then(r => r.data.length).catch(() => 0),
      api.get('/categories/flat').then(r => r.data.length).catch(() => 0),
    ]).then(([photos, bookings, featured, folders]) => setStats({ photos, bookings, featured, folders }));
  }, [tab]);

  const doLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <span className="admin-brand">BYDASAM</span>
        <div style={{ display:'flex', gap:'0.8rem', alignItems:'center' }}>
          <a href="/" target="_blank" className="a-btn a-btn-ghost a-btn-sm">View Site ↗</a>
          <button onClick={doLogout} className="a-btn a-btn-ghost a-btn-sm">Sign Out</button>
        </div>
      </div>
      <div className="admin-body">
        <aside className="admin-side">
          <div style={{ padding:'1.2rem 1.5rem 1rem', borderBottom:'1px solid #1a1a1a', marginBottom:'0.5rem' }}>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>Admin Panel</p>
          </div>
          {TABS.map(t => (
            <button key={t.id} className={`atab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              <span style={{ fontSize:'0.9rem' }}>{t.icon}</span>
              {t.id}
            </button>
          ))}
          <div style={{ padding:'1.2rem 1.5rem', borderTop:'1px solid #1a1a1a', marginTop:'auto', position:'absolute', bottom:0, width:'100%' }}>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.15em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase' }}>Madhu Sai Pavan</p>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.6rem', letterSpacing:'0.1em', color:'rgba(255,255,255,0.12)', textTransform:'uppercase', marginTop:'2px' }}>Administrator</p>
          </div>
        </aside>
        <div className="admin-content">
          <div className="stat-grid">
            {[['Photos', stats.photos],['Featured', stats.featured],['Folders', stats.folders],['Bookings', stats.bookings]].map(([label, val]) => (
              <div key={label} className="stat-card">
                <p className="stat-val">{val}</p>
                <p className="stat-label">{label}</p>
              </div>
            ))}
          </div>
          {tab==='Photos'   && <PhotosTab />}
          {tab==='Folders'  && <FoldersTab />}
          {tab==='Featured' && <FeaturedTab />}
          {tab==='Services' && <ServicesTab />}
          {tab==='Bookings' && <BookingsTab />}
          {tab==='About'    && <AboutTab />}
          {tab==='Social'   && <SocialTab />}
          {tab==='Settings' && <SettingsTab />}
          {tab==='Security' && <SecurityTab />}
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
function SectionHeader({ title, sub }) {
  return (
    <div>
      <h2 className="admin-section-title">{title}</h2>
      {sub && <p className="admin-section-sub">{sub}</p>}
    </div>
  );
}

function PhotosTab() {
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([
    api.get('/photos').then(r => setPhotos(r.data)),
    api.get('/categories/flat').then(r => setFolders(r.data)),
  ]).catch(() => {});

  useEffect(() => { load(); }, []);

  const upload = async e => {
    const files = [...e.target.files];
    if (!files.length) return;
    setBusy(true);
    const fd = new FormData();
    files.forEach(f => fd.append('photos', f));
    if (folder) fd.append('folder', folder);
    if (title) fd.append('title', title);
    try {
      await api.post('/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast(files.length + ' photo(s) uploaded!');
      setTitle(''); e.target.value = '';
      load();
    } catch(err) { toast(err.response?.data?.error || 'Upload failed'); }
    finally { setBusy(false); }
  };

  const del = async id => {
    if (!confirm('Delete this photo?')) return;
    try { await api.delete('/photos/' + id); toast('Deleted'); load(); }
    catch { toast('Error deleting'); }
  };

  const toggleFeatured = async (id, featured) => {
    try { await api.patch('/photos/' + id, { featured: !featured }); load(); }
    catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Photos" sub="Upload and manage your portfolio photos" />
      <TwoCol>
        <Row label="Folder">
          <select className="a-input" value={folder} onChange={e => setFolder(e.target.value)}>
            <option value="">No folder</option>
            {folders.map(f => <option key={f._id} value={f._id}>{f.parent ? '└ ' : ''}{f.name}</option>)}
          </select>
        </Row>
        <Row label="Title (optional)">
          <input className="a-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Golden Hour" />
        </Row>
      </TwoCol>
      <label className="upload-zone">
        <input type="file" accept="image/*" multiple onChange={upload} />
        <div className="upload-icon">↑</div>
        <p style={{ fontSize:'0.9rem', marginBottom:'0.4rem', color:'rgba(255,255,255,0.5)' }}>{busy ? 'Uploading...' : 'Click or drag photos here'}</p>
        <p>JPG · PNG · WEBP · Multiple files · Up to 10GB each</p>
      </label>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
        <p className="a-label" style={{ margin:0 }}>All Photos ({photos.length})</p>
      </div>
      <div className="thumb-grid">
        {photos.map(p => (
          <div key={p._id} className="thumb">
            <img src={p.url} alt={p.title || ''} loading="lazy" />
            <div className="thumb-del" style={{ flexDirection:'column', gap:'6px' }}>
              <button className="a-btn a-btn-sm" style={{ fontSize:'0.55rem', background: p.featured ? '#fff' : 'transparent', color: p.featured ? '#000' : 'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.3)' }} onClick={() => toggleFeatured(p._id, p.featured)}>
                {p.featured ? '★ Featured' : '☆ Feature'}
              </button>
              <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.55rem' }} onClick={() => del(p._id)}>Delete</button>
            </div>
            {p.featured && <div style={{ position:'absolute', top:4, right:4, background:'#fff', color:'#000', fontSize:'0.5rem', padding:'2px 6px', fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em' }}>★</div>}
          </div>
        ))}
      </div>
      {photos.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No photos yet</p>
        </div>
      )}
    </>
  );
}

function FoldersTab() {
  const toast = useToast();
  const [folders, setFolders] = useState([]);
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');

  const load = () => api.get('/categories/flat').then(r => setFolders(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return toast('Enter a folder name');
    try {
      await api.post('/categories', { name: name.trim(), parent: parent || null });
      toast('Folder created!');
      setName(''); setParent('');
      load();
    } catch(e) { toast(e.response?.data?.error || 'Error'); }
  };

  const del = async id => {
    if (!confirm('Delete this folder and all its subfolders?')) return;
    try { await api.delete('/categories/' + id); toast('Deleted'); load(); }
    catch { toast('Error'); }
  };

  const getChildren = (parentId) => folders.filter(f => String(f.parent?._id || f.parent) === String(parentId));
  const getRoots = () => folders.filter(f => !f.parent);

  const renderFolder = (f, depth = 0) => (
    <div key={f._id}>
      <div className="folder-item" style={{ marginLeft: depth * 20 + 'px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.8rem' }}>{'└'.repeat(depth > 0 ? 1 : 0)}</span>
          <span style={{ fontSize:'0.9rem' }}>📁</span>
          <span className="folder-name">{f.name}</span>
          {f.parent && <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.1em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase' }}>in {f.parent.name}</span>}
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setParent(f._id)}>+ Subfolder</button>
          <button className="a-btn a-btn-red a-btn-sm" onClick={() => del(f._id)}>Delete</button>
        </div>
      </div>
      {getChildren(f._id).map(child => renderFolder(child, depth + 1))}
    </div>
  );

  return (
    <>
      <SectionHeader title="Folders" sub="Create folders and subfolders to organise your photos" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <p className="a-label" style={{ marginBottom:'1rem' }}>Create New Folder</p>
        <TwoCol>
          <Row label="Folder Name">
            <input className="a-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weddings 2026" onKeyDown={e => e.key==='Enter' && add()} />
          </Row>
          <Row label="Parent Folder (optional)">
            <select className="a-input" value={parent} onChange={e => setParent(e.target.value)}>
              <option value="">Root level</option>
              {folders.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </Row>
        </TwoCol>
        <button className="a-btn" onClick={add}>+ Create Folder</button>
      </div>
      {folders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No folders yet — create your first one above</p>
        </div>
      ) : (
        <div className="folder-tree">
          {getRoots().map(f => renderFolder(f, 0))}
        </div>
      )}
    </>
  );
}

function FeaturedTab() {
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [featured, setFeatured] = useState([]);

  const load = () => Promise.all([
    api.get('/photos').then(r => setPhotos(r.data)),
    api.get('/photos?featured=true').then(r => setFeatured(r.data)),
  ]).catch(() => {});

  useEffect(() => { load(); }, []);

  const toggle = async (id, isFeatured) => {
    if (!isFeatured && featured.length >= 20) return toast('Maximum 20 featured photos allowed!');
    try { await api.patch('/photos/' + id, { featured: !isFeatured }); load(); }
    catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Featured Photos" sub={`Select up to 20 photos to feature on your homepage — ${featured.length}/20 selected`} />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>
          {featured.length} of 20 photos featured
        </p>
        <div style={{ display:'flex', gap:'4px' }}>
          {Array(20).fill(null).map((_, i) => (
            <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background: i < featured.length ? '#fff' : '#222' }} />
          ))}
        </div>
      </div>
      <div className="thumb-grid">
        {photos.map(p => {
          const isFeatured = p.featured;
          return (
            <div key={p._id} className="thumb" onClick={() => toggle(p._id, isFeatured)} style={{ cursor:'pointer', outline: isFeatured ? '2px solid #fff' : 'none', outlineOffset:'2px' }}>
              <img src={p.url} alt={p.title || ''} loading="lazy" />
              {isFeatured && (
                <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', color:'#fff', letterSpacing:'0.05em' }}>★</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {photos.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>Upload photos first then feature them here</p>
        </div>
      )}
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
    catch(e) { toast(e.response?.data?.error || 'Error'); }
  };
  const del = async id => {
    try { await api.delete('/services/' + id); load(); }
    catch { toast('Error'); }
  };
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <>
      <SectionHeader title="Services" sub="Manage your photography services and pricing" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <Row label="Service Name"><input name="name" className="a-input" value={form.name} onChange={set} placeholder="e.g. Corporate Events" /></Row>
        <TwoCol>
          <Row label="Price"><input name="price" className="a-input" value={form.price} onChange={set} placeholder="From $400" /></Row>
          <div />
        </TwoCol>
        <Row label="Description"><textarea name="desc" className="a-textarea" value={form.desc} onChange={set} placeholder="What is included..." /></Row>
        <button className="a-btn" onClick={add}>+ Add Service</button>
      </div>
      {svcs.map(s => (
        <div key={s._id} className="list-row">
          <div>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1rem', letterSpacing:'0.08em', textTransform:'uppercase', color:'#fff' }}>{s.name}</p>
            <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.35)', fontWeight:300 }}>{s.price}</p>
          </div>
          <button className="a-btn a-btn-red a-btn-sm" onClick={() => del(s._id)}>Remove</button>
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
      <SectionHeader title="Bookings" sub={`${bookings.length} total bookings`} />
      {bookings.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No bookings yet</p>
        </div>
      )}
      {bookings.map(b => (
        <div key={b._id} className="booking-card">
          <div style={{ display:'flex', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
            <div>
              <p className="bk-name">{b.firstName} {b.lastName}</p>
              <p className="bk-meta">{b.service} — {b.date || 'Flexible'}</p>
              <p className="bk-meta">{b.email}{b.phone ? ' — ' + b.phone : ''}</p>
              {b.message && <p className="bk-msg">"{b.message}"</p>}
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.68rem', letterSpacing:'0.15em', color:'rgba(255,255,255,0.2)', marginTop:'0.5rem' }}>{new Date(b.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.6rem' }}>
              <span className={pillClass(b.status)}>{b.status}</span>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                {b.status !== 'confirmed' && <button onClick={() => patch(b._id,'confirmed')} className="a-btn a-btn-sm" style={{ background:'rgba(100,200,100,0.1)', color:'rgba(100,200,100,0.8)', border:'1px solid rgba(100,200,100,0.2)' }}>Confirm</button>}
                {b.status !== 'cancelled' && <button onClick={() => patch(b._id,'cancelled')} className="a-btn a-btn-ghost a-btn-sm">Cancel</button>}
                <button className="a-btn a-btn-red a-btn-sm" onClick={() => del(b._id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function AboutTab() {
  const toast = useToast();
  const [form, setForm] = useState({
    aboutName: 'Madhu Sai Pavan Dasam',
    aboutRole: 'Photographer · Storyteller · Visual Architect',
    aboutBio: '',
  });
  const [aboutPhoto, setAboutPhoto] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      if (r.data.aboutPhoto) setAboutPhoto(r.data.aboutPhoto);
      if (r.data.aboutName) setForm(f => ({ ...f, aboutName: r.data.aboutName }));
      if (r.data.aboutRole) setForm(f => ({ ...f, aboutRole: r.data.aboutRole }));
      if (r.data.aboutBio) setForm(f => ({ ...f, aboutBio: r.data.aboutBio }));
    }).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    try { await api.post('/settings', form); toast('About section saved!'); }
    catch { toast('Error saving'); }
  };

  const uploadPhoto = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const { data } = await api.post('/settings/about-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAboutPhoto(data.url);
      toast('Photo updated!');
    } catch { toast('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <>
      <SectionHeader title="About" sub="Edit your about section — changes reflect instantly on the website" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <p className="a-label" style={{ marginBottom:'1rem' }}>Your Photo</p>
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'flex-start', flexWrap:'wrap' }}>
          {aboutPhoto && (
            <img src={aboutPhoto} alt="About" style={{ width:'120px', height:'150px', objectFit:'cover', borderRadius:'6px', opacity:0.85 }} />
          )}
          <label className="upload-zone" style={{ flex:1, minWidth:'200px', padding:'1.5rem' }}>
            <input type="file" accept="image/*" onChange={uploadPhoto} />
            <div className="upload-icon" style={{ fontSize:'1.2rem' }}>↑</div>
            <p>{uploading ? 'Uploading...' : aboutPhoto ? 'Click to change photo' : 'Upload your photo'}</p>
            <p style={{ marginTop:'0.3rem', fontSize:'0.65rem' }}>Any dimension — auto-fitted to the about section</p>
          </label>
        </div>
      </div>
      <Row label="Your Name"><input name="aboutName" className="a-input" value={form.aboutName} onChange={handle} placeholder="Madhu Sai Pavan Dasam" /></Row>
      <Row label="Your Role"><input name="aboutRole" className="a-input" value={form.aboutRole} onChange={handle} placeholder="Photographer · Storyteller · Visual Architect" /></Row>
      <Row label="Your Bio">
        <textarea name="aboutBio" className="a-textarea" value={form.aboutBio} onChange={handle} style={{ height:'160px' }}
          placeholder="Write your bio here... This will appear on the website about section." />
      </Row>
      <button className="a-btn" onClick={save}>Save About Section</button>
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
    catch(e) { toast(e.response?.data?.error || 'Error'); }
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
      <SectionHeader title="Social Links" sub="Manage your social media and contact links" />
      {socials.map(s => (
        <div key={s._id} className="list-row">
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', minWidth:'100px', color:'rgba(255,255,255,0.5)' }}>{s.name}</span>
          <input defaultValue={s.url} onBlur={e => update(s._id, e.target.value)} style={{ flex:1, background:'transparent', border:'none', borderBottom:'1px solid #1a1a1a', color:'rgba(255,255,255,0.6)', fontFamily:"'Barlow',sans-serif", fontSize:'0.9rem', padding:'0.4rem 0', outline:'none' }} />
          <button className="a-btn a-btn-red a-btn-sm" onClick={() => del(s._id)}>Remove</button>
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
  const [heroMedia, setHeroMedia] = useState('');
  const [heroMediaType, setHeroMediaType] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      if (r.data.heroMedia) setHeroMedia(r.data.heroMedia);
      if (r.data.heroMediaType) setHeroMediaType(r.data.heroMediaType);
    }).catch(() => {});
  }, []);

  const uploadHeroMedia = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 300) {
          toast('Video must be maximum 5 minutes long!');
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
      <SectionHeader title="Settings" sub="Manage your hero background photo or video" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem' }}>
        <p className="a-label" style={{ marginBottom:'0.5rem' }}>Hero Background</p>
        <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.3)', marginBottom:'1.2rem', fontWeight:300, lineHeight:1.7 }}>
          This fills the full screen behind BYDASAM on the homepage. Photo or video — video plays silently and loops automatically. Maximum 5 minutes.
        </p>
        {heroMedia && (
          <div style={{ marginBottom:'1rem' }}>
            {heroMediaType === 'video' ? (
              <video src={heroMedia} style={{ width:'100%', maxWidth:'400px', height:'200px', objectFit:'cover', opacity:0.8, borderRadius:'6px' }} muted controls />
            ) : (
              <img src={heroMedia} alt="Hero" style={{ width:'100%', maxWidth:'400px', height:'200px', objectFit:'cover', opacity:0.8, borderRadius:'6px' }} />
            )}
          </div>
        )}
        <label className="upload-zone" style={{ maxWidth:'400px' }}>
          <input type="file" accept="image/*,video/*" onChange={uploadHeroMedia} />
          <div className="upload-icon">↑</div>
          <p style={{ fontSize:'0.9rem', marginBottom:'0.3rem', color:'rgba(255,255,255,0.5)' }}>{uploadingHero ? 'Uploading... this may take a while for videos' : heroMedia ? 'Click to change hero media' : 'Upload photo or video'}</p>
          <p>Photo: JPG PNG WEBP · Video: MP4 MOV (max 5 mins)</p>
        </label>
      </div>
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
      setMfaOn(true); setQrCode(''); setCode('');
    } catch { toast('Invalid code. Try again.'); }
  };

  const disableMfa = async () => {
    if (!confirm('Are you sure you want to disable MFA?')) return;
    try {
      await api.post('/auth/mfa/disable');
      toast('MFA disabled.');
      setMfaOn(false); setQrCode(''); setSecret('');
    } catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Security" sub="Set up two-factor authentication for your admin login" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem' }}>
        <p style={{ fontSize:'0.95rem', color:'rgba(255,255,255,0.5)', lineHeight:1.8, marginBottom:'1.5rem', fontWeight:300 }}>
          Multi-Factor Authentication adds an extra layer of security. After entering your password you will be asked for a 6-digit code from Google Authenticator on your phone.
        </p>
        {!mfaOn && !qrCode && (
          <button className="a-btn" onClick={setupMfa} disabled={loading}>
            {loading ? 'Setting up...' : 'Setup Google Authenticator'}
          </button>
        )}
        {qrCode && (
          <div>
            <p className="a-label" style={{ marginBottom:'1rem' }}>Step 1 — Scan this QR code with Google Authenticator</p>
            <img src={qrCode} alt="QR Code" style={{ width:'180px', height:'180px', background:'#fff', padding:'8px', borderRadius:'8px', marginBottom:'1rem' }} />
            <p style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.25)', marginBottom:'1.5rem', fontWeight:300 }}>
              Cannot scan? Enter this code manually: <span style={{ color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em' }}>{secret}</span>
            </p>
            <p className="a-label" style={{ marginBottom:'0.8rem' }}>Step 2 — Enter the 6-digit code from the app</p>
            <input className="a-input" value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} style={{ maxWidth:'200px', textAlign:'center', fontSize:'1.4rem', letterSpacing:'0.5em' }} />
            <div style={{ marginTop:'1rem' }}>
              <button className="a-btn" onClick={verifyMfa}>Verify and Enable MFA</button>
            </div>
          </div>
        )}
        {mfaOn && (
          <div>
            <p style={{ fontSize:'0.95rem', color:'rgba(100,200,100,0.8)', marginBottom:'1.5rem', fontWeight:300 }}>✓ MFA is active on your account.</p>
            <button className="a-btn a-btn-red" onClick={disableMfa}>Disable MFA</button>
          </div>
        )}
      </div>
    </>
  );
}
