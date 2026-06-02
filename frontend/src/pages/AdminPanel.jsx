import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

const TABS = [
  { id:'Photos', icon:'📷' },
  { id:'Carousel', icon:'🎠' },
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
          <div style={{ padding:'1.2rem 1.5rem', borderTop:'1px solid #1a1a1a', marginTop:'1rem' }}>
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
          {tab==='Carousel' && <CarouselTab />}
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
    <div style={{ marginBottom:'1.5rem' }}>
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
            {folders.map(f => <option key={f._id} value={f._id}>{f.parent ? '↳ ' : ''}{f.name}</option>)}
          </select>
        </Row>
        <Row label="Title (optional)">
          <input className="a-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Golden Hour" />
        </Row>
      </TwoCol>
      <label className="upload-zone">
        <input type="file" accept="image/*" multiple onChange={upload} />
        <div className="upload-icon">↑</div>
        <p style={{ fontSize:'0.9rem', marginBottom:'0.4rem', color:'rgba(255,255,255,0.5)' }}>{busy ? 'Uploading & compressing...' : 'Click or drag photos here'}</p>
        <p>JPG · PNG · WEBP · Multiple files · Auto compressed</p>
      </label>
      <p className="a-label" style={{ marginBottom:'0.8rem' }}>All Photos ({photos.length})</p>
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

function CarouselTab() {
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/settings/carousel').then(r => setPhotos(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const upload = async e => {
    const files = [...e.target.files];
    if (!files.length) return;
    if (photos.length + files.length > 20) return toast('Maximum 20 photos in carousel!');
    setBusy(true);
    const fd = new FormData();
    files.forEach(f => fd.append('photos', f));
    try {
      await api.post('/settings/carousel', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast(files.length + ' photo(s) added to carousel!');
      e.target.value = '';
      load();
    } catch(err) { toast(err.response?.data?.error || 'Upload failed'); }
    finally { setBusy(false); }
  };

  const del = async publicId => {
    if (!confirm('Remove from carousel?')) return;
    try {
      await api.delete('/settings/carousel/' + encodeURIComponent(publicId));
      toast('Removed');
      load();
    } catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Carousel" sub={`Manage sliding photos on homepage — ${photos.length}/20 photos`} />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>
          {photos.length} of 20 carousel photos
        </p>
        <div style={{ display:'flex', gap:'4px' }}>
          {Array(20).fill(null).map((_, i) => (
            <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background: i < photos.length ? '#fff' : '#222' }} />
          ))}
        </div>
      </div>
      <label className="upload-zone">
        <input type="file" accept="image/*" multiple onChange={upload} />
        <div className="upload-icon">↑</div>
        <p style={{ fontSize:'0.9rem', marginBottom:'0.4rem', color:'rgba(255,255,255,0.5)' }}>{busy ? 'Uploading & compressing...' : 'Click or drag carousel photos here'}</p>
        <p>Full width display · Auto compressed · Up to 20 photos</p>
      </label>
      <div className="thumb-grid">
        {photos.map((p, i) => (
          <div key={i} className="thumb">
            <img src={p.url} alt="" loading="lazy" />
            <div className="thumb-del">
              <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.55rem' }} onClick={() => del(p.publicId)}>Remove</button>
            </div>
            <div style={{ position:'absolute', top:4, left:4, background:'rgba(0,0,0,0.7)', color:'rgba(255,255,255,0.6)', fontSize:'0.55rem', padding:'2px 6px', fontFamily:"'Barlow Condensed',sans-serif" }}>{i+1}</div>
          </div>
        ))}
      </div>
      {photos.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No carousel photos yet</p>
        </div>
      )}
    </>
  );
}

function FoldersTab() {
  const toast = useToast();
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const load = () => api.get('/categories/flat').then(r => setFolders(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const getChildren = (parentId) => {
    if (!parentId) return folders.filter(f => !f.parent);
    return folders.filter(f => String(f.parent?._id || f.parent) === String(parentId));
  };

  const openFolder = (folder) => {
    setCurrentFolder(folder);
    setBreadcrumb(prev => [...prev, folder]);
    setShowNew(false);
  };

  const goTo = (idx) => {
    if (idx === -1) { setCurrentFolder(null); setBreadcrumb([]); }
    else { setCurrentFolder(breadcrumb[idx]); setBreadcrumb(breadcrumb.slice(0, idx + 1)); }
    setShowNew(false);
  };

  const create = async () => {
    if (!newName.trim()) return toast('Enter a folder name');
    try {
      await api.post('/categories', { name: newName.trim(), parent: currentFolder?._id || null });
      toast('Folder created!');
      setNewName(''); setShowNew(false); load();
    } catch(e) { toast(e.response?.data?.error || 'Error'); }
  };

  const del = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this folder and all its subfolders?')) return;
    try { await api.delete('/categories/' + id); toast('Deleted'); load(); }
    catch { toast('Error'); }
  };

  const currentChildren = getChildren(currentFolder?._id);

  return (
    <>
      <SectionHeader title="Folders" sub="Organise your photos into folders and subfolders" />
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1.5rem', padding:'0.8rem 1rem', background:'#111', borderRadius:'8px', border:'1px solid #1a1a1a' }}>
        <span onClick={() => goTo(-1)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.78rem', letterSpacing:'0.15em', textTransform:'uppercase', color: currentFolder ? 'rgba(255,255,255,0.4)' : '#fff', cursor:'pointer' }}>All Folders</span>
        {breadcrumb.map((b, i) => (
          <span key={b._id} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.7rem' }}>›</span>
            <span onClick={() => goTo(i)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.78rem', letterSpacing:'0.15em', textTransform:'uppercase', color: i===breadcrumb.length-1 ? '#fff' : 'rgba(255,255,255,0.4)', cursor:'pointer' }}>{b.name}</span>
          </span>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'10px', marginBottom:'1.5rem' }}>
        {currentChildren.map(f => (
          <div key={f._id} onClick={() => openFolder(f)} style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#333'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#1a1a1a'}
          >
            <div style={{ height:'90px', background:'linear-gradient(135deg,#151515,#0d0d0d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>📁</div>
            <div style={{ padding:'10px 12px' }}>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.08em', textTransform:'uppercase', color:'#fff', marginBottom:'3px' }}>{f.name}</p>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.1em', color:'rgba(255,255,255,0.3)' }}>{getChildren(f._id).length} subfolders</p>
            </div>
            <div style={{ padding:'0 10px 10px', display:'flex', justifyContent:'flex-end' }}>
              <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.6rem' }} onClick={(e) => del(f._id, e)}>Delete</button>
            </div>
          </div>
        ))}
        <div onClick={() => setShowNew(true)} style={{ background:'transparent', border:'1px dashed #222', borderRadius:'10px', minHeight:'160px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'8px' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='#444'}
          onMouseLeave={e => e.currentTarget.style.borderColor='#222'}
        >
          <span style={{ fontSize:'1.5rem', color:'rgba(255,255,255,0.15)' }}>+</span>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.7rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>New Folder</p>
        </div>
      </div>
      {showNew && (
        <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem' }}>
          <p className="a-label" style={{ marginBottom:'1rem' }}>New folder {currentFolder ? `inside ${currentFolder.name}` : 'at root level'}</p>
          <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <input className="a-input" style={{ marginBottom:0 }} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Folder name..." onKeyDown={e => e.key==='Enter' && create()} autoFocus />
            </div>
            <button className="a-btn" onClick={create}>Create</button>
            <button className="a-btn a-btn-ghost" onClick={() => { setShowNew(false); setNewName(''); }}>Cancel</button>
          </div>
        </div>
      )}
      {currentChildren.length === 0 && !showNew && (
        <div style={{ textAlign:'center', padding:'2rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>
            {currentFolder ? `No subfolders in ${currentFolder.name}` : 'No folders yet — click + New Folder'}
          </p>
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
    if (!isFeatured && featured.length >= 20) return toast('Maximum 20 featured photos!');
    try { await api.patch('/photos/' + id, { featured: !isFeatured }); load(); }
    catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Featured Photos" sub={`Select up to 20 photos for your portfolio — ${featured.length}/20 selected`} />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>{featured.length} of 20 selected</p>
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
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', color:'#fff' }}>★</span>
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
  const [form, setForm] = useState({ aboutName:'Madhu Sai Pavan Dasam', aboutRole:'Photographer · Storyteller · Visual Architect', aboutBio:'' });
  const [aboutPhoto, setAboutPhoto] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      if (r.data.aboutPhoto) setAboutPhoto(r.data.aboutPhoto);
      if (r.data.aboutName) setForm(f => ({ ...f, aboutName: r.data.aboutName }));
      if (r.data.aboutRole) setForm(f => ({ ...f, aboutRole: r.data.aboutRole }));
      if (r.data.aboutBio)  setForm(f => ({ ...f, aboutBio:  r.data.aboutBio  }));
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
      <SectionHeader title="About" sub="Edit your about section — updates instantly on the website" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <p className="a-label" style={{ marginBottom:'1rem' }}>Your Photo</p>
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'flex-start', flexWrap:'wrap' }}>
          {aboutPhoto && (
            <img src={aboutPhoto} alt="About" style={{ width:'100px', height:'130px', objectFit:'cover', borderRadius:'6px', opacity:0.85 }} />
          )}
          <label className="upload-zone" style={{ flex:1, minWidth:'200px', padding:'1.5rem' }}>
            <input type="file" accept="image/*" onChange={uploadPhoto} />
            <div className="upload-icon" style={{ fontSize:'1.2rem' }}>↑</div>
            <p>{uploading ? 'Uploading...' : aboutPhoto ? 'Click to change photo' : 'Upload your photo'}</p>
            <p style={{ marginTop:'0.3rem', fontSize:'0.65rem' }}>Any dimension — auto compressed & fitted</p>
          </label>
        </div>
      </div>
      <Row label="Your Name"><input name="aboutName" className="a-input" value={form.aboutName} onChange={handle} placeholder="Madhu Sai Pavan Dasam" /></Row>
      <Row label="Your Role"><input name="aboutRole" className="a-input" value={form.aboutRole} onChange={handle} placeholder="Photographer · Storyteller · Visual Architect" /></Row>
      <Row label="Your Bio">
        <textarea name="aboutBio" className="a-textarea" value={form.aboutBio} onChange={handle} style={{ height:'200px' }}
          placeholder="Write your bio here. This appears on the website about section." />
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
  const [progress, setProgress] = useState(0);

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
        if (video.duration > 5000) { toast('Video must be maximum 5000 seconds!'); e.target.value = ''; return; }
        await doHeroUpload(file, e);
      };
      video.src = URL.createObjectURL(file);
    } else {
      await doHeroUpload(file, e);
    }
  };

  const doHeroUpload = async (file, e) => {
    setUploadingHero(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('media', file);
    try {
      const { data } = await api.post('/settings/hero-media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: p => setProgress(Math.round(p.loaded * 100 / p.total)),
      });
      setHeroMedia(data.url);
      setHeroMediaType(data.type);
      toast('Hero media updated!');
    } catch { toast('Upload failed'); }
    finally { setUploadingHero(false); setProgress(0); e.target.value = ''; }
  };

  return (
    <>
      <SectionHeader title="Settings" sub="Manage your hero background photo or video" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem' }}>
        <p className="a-label" style={{ marginBottom:'0.5rem' }}>Hero Background</p>
        <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.3)', marginBottom:'1.2rem', fontWeight:300, lineHeight:1.7 }}>
          Fills the full screen behind BYDASAM. Photo or video — video plays silently and loops. Supports MP4, MOV, AVI, WebM. 20 seconds to 5000 seconds.
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
        {uploadingHero && progress > 0 && (
          <div style={{ marginBottom:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.7rem', letterSpacing:'0.15em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Uploading & compressing...</p>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.7rem', color:'rgba(255,255,255,0.4)' }}>{progress}%</p>
            </div>
            <div style={{ height:'2px', background:'#1a1a1a', borderRadius:'1px' }}>
              <div style={{ height:'100%', background:'#fff', borderRadius:'1px', width:`${progress}%`, transition:'width 0.3s' }} />
            </div>
          </div>
        )}
        <label className="upload-zone" style={{ maxWidth:'400px' }}>
          <input type="file" accept="image/*,video/mp4,video/mov,video/avi,video/webm" onChange={uploadHeroMedia} />
          <div className="upload-icon">↑</div>
          <p style={{ fontSize:'0.9rem', marginBottom:'0.3rem', color:'rgba(255,255,255,0.5)' }}>{uploadingHero ? 'Uploading...' : heroMedia ? 'Click to change' : 'Upload photo or video'}</p>
          <p>Photo: JPG PNG WEBP · Video: MP4 MOV AVI WebM</p>
          <p style={{ marginTop:'0.3rem' }}>Auto compressed for best quality</p>
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
      setQrCode(data.qrCode); setSecret(data.secret);
      toast('Scan the QR code with Google Authenticator');
    } catch { toast('Error setting up MFA'); }
    finally { setLoading(false); }
  };

  const verifyMfa = async () => {
    if (code.length !== 6) return toast('Enter a 6-digit code');
    try {
      await api.post('/auth/mfa/verify', { token: code });
      toast('MFA enabled!');
      setMfaOn(true); setQrCode(''); setCode('');
    } catch { toast('Invalid code. Try again.'); }
  };

  const disableMfa = async () => {
    if (!confirm('Disable MFA?')) return;
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
          After entering your password you will be asked for a 6-digit code from Google Authenticator on your phone. This prevents anyone from logging in even if they know your password.
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
              Cannot scan? Enter manually: <span style={{ color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em' }}>{secret}</span>
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
