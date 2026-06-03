import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

const TABS = [
  { id:'Hero',        icon:'🎬' },
  { id:'Carousel',    icon:'🎠' },
  { id:'About',       icon:'👤' },
  { id:'Portfolio',   icon:'🖼' },
  { id:'Collections', icon:'📂' },
  { id:'Social',      icon:'🔗' },
  { id:'Bookings',    icon:'📅' },
  { id:'Security',    icon:'🔒' },
];

export default function AdminPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Hero');
  const [stats, setStats] = useState({ photos:0, bookings:0, portfolio:0, collections:0 });

  useEffect(() => {
    Promise.all([
      api.get('/photos').then(r => r.data.length).catch(() => 0),
      api.get('/bookings').then(r => r.data.length).catch(() => 0),
      api.get('/photos?featured=true').then(r => r.data.length).catch(() => 0),
      api.get('/categories/flat').then(r => r.data.length).catch(() => 0),
    ]).then(([photos, bookings, portfolio, collections]) => setStats({ photos, bookings, portfolio, collections }));
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
            {[['Photos', stats.photos],['Portfolio', stats.portfolio],['Collections', stats.collections],['Bookings', stats.bookings]].map(([label, val]) => (
              <div key={label} className="stat-card">
                <p className="stat-val">{val}</p>
                <p className="stat-label">{label}</p>
              </div>
            ))}
          </div>
          {tab==='Hero'        && <HeroTab />}
          {tab==='Carousel'    && <CarouselTab />}
          {tab==='About'       && <AboutTab />}
          {tab==='Portfolio'   && <PortfolioTab />}
          {tab==='Collections' && <CollectionsTab />}
          {tab==='Social'      && <SocialTab />}
          {tab==='Bookings'    && <BookingsTab />}
          {tab==='Security'    && <SecurityTab />}
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

function HeroTab() {
  const toast = useToast();
  const [heroMedia, setHeroMedia] = useState('');
  const [heroMediaType, setHeroMediaType] = useState('');
  const [uploading, setUploading] = useState(false);
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
        if (video.duration > 5000) { toast('Video must be maximum 5000 seconds!'); e.target.value=''; return; }
        if (video.duration < 20) { toast('Video must be at least 20 seconds!'); e.target.value=''; return; }
        await doUpload(file, e);
      };
      video.src = URL.createObjectURL(file);
    } else { await doUpload(file, e); }
  };

  const doUpload = async (file, e) => {
    setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append('media', file);
    try {
      const { data } = await api.post('/settings/hero-media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: p => setProgress(Math.round(p.loaded * 100 / p.total)),
      });
      setHeroMedia(data.url); setHeroMediaType(data.type);
      toast('Hero media updated!');
    } catch { toast('Upload failed'); }
    finally { setUploading(false); setProgress(0); e.target.value=''; }
  };

  const remove = async () => {
    if (!confirm('Remove hero media?')) return;
    try { await api.post('/settings', { heroMedia:'', heroMediaType:'' }); setHeroMedia(''); setHeroMediaType(''); toast('Removed'); }
    catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Hero" sub="Upload the full-screen background for your homepage" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem' }}>
        <p style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.4)', marginBottom:'1.5rem', lineHeight:1.7, fontWeight:300 }}>
          Fills the entire screen behind BYDASAM. Upload a photo for a still background or a video for a cinematic effect. Videos play silently and loop automatically.
        </p>
        {heroMedia && (
          <div style={{ marginBottom:'1.5rem' }}>
            <p className="a-label" style={{ marginBottom:'0.8rem' }}>Current Hero {heroMediaType==='video'?'Video':'Photo'}</p>
            {heroMediaType==='video' ? (
              <video src={heroMedia} style={{ width:'100%', maxWidth:'500px', height:'250px', objectFit:'cover', borderRadius:'8px' }} muted controls />
            ) : (
              <img src={heroMedia} alt="Hero" style={{ width:'100%', maxWidth:'500px', height:'250px', objectFit:'cover', borderRadius:'8px' }} />
            )}
            <div style={{ marginTop:'0.8rem' }}><button className="a-btn a-btn-red a-btn-sm" onClick={remove}>Remove</button></div>
          </div>
        )}
        {uploading && progress > 0 && (
          <div style={{ marginBottom:'1.2rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.75rem', letterSpacing:'0.15em', color:'rgba(255,255,255,0.5)', textTransform:'uppercase' }}>Uploading & compressing...</p>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.75rem', color:'rgba(255,255,255,0.5)' }}>{progress}%</p>
            </div>
            <div style={{ height:'3px', background:'#1a1a1a', borderRadius:'2px' }}>
              <div style={{ height:'100%', background:'#fff', borderRadius:'2px', width:`${progress}%`, transition:'width 0.3s' }} />
            </div>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <label style={{ background:'#0d0d0d', border:'1px dashed #333', borderRadius:'10px', padding:'2rem 1rem', textAlign:'center', cursor:'pointer', position:'relative' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#555'} onMouseLeave={e=>e.currentTarget.style.borderColor='#333'}>
            <input type="file" accept="image/*" onChange={uploadHeroMedia} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} />
            <div style={{ fontSize:'2rem', marginBottom:'0.8rem' }}>📸</div>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:'0.4rem' }}>Upload Photo</p>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.1em', color:'rgba(255,255,255,0.25)' }}>JPG · PNG · WEBP</p>
          </label>
          <label style={{ background:'#0d0d0d', border:'1px dashed #333', borderRadius:'10px', padding:'2rem 1rem', textAlign:'center', cursor:'pointer', position:'relative' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#555'} onMouseLeave={e=>e.currentTarget.style.borderColor='#333'}>
            <input type="file" accept="video/mp4,video/mov,video/avi,video/webm" onChange={uploadHeroMedia} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} />
            <div style={{ fontSize:'2rem', marginBottom:'0.8rem' }}>🎬</div>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:'0.4rem' }}>Upload Video</p>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.1em', color:'rgba(255,255,255,0.25)' }}>MP4 · MOV · AVI · WebM · 20s–5000s</p>
          </label>
        </div>
      </div>
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
      toast(files.length + ' photo(s) added!');
      e.target.value=''; load();
    } catch(err) { toast(err.response?.data?.error || 'Upload failed'); }
    finally { setBusy(false); }
  };

  const del = async publicId => {
    if (!confirm('Remove from carousel?')) return;
    try { await api.delete('/settings/carousel/' + encodeURIComponent(publicId)); toast('Removed'); load(); }
    catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Carousel" sub={`Sliding strip on your homepage — ${photos.length}/20`} />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>{photos.length} of 20 photos</p>
        <div style={{ display:'flex', gap:'4px' }}>
          {Array(20).fill(null).map((_,i) => (
            <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background: i<photos.length?'#fff':'#222' }} />
          ))}
        </div>
      </div>
      <label className="upload-zone">
        <input type="file" accept="image/*" multiple onChange={upload} />
        <div className="upload-icon">↑</div>
        <p style={{ fontSize:'0.9rem', marginBottom:'0.4rem', color:'rgba(255,255,255,0.5)' }}>{busy?'Uploading & compressing...':'Click or drag photos here'}</p>
        <p>Auto compressed · Up to 20 photos</p>
      </label>
      <div className="thumb-grid">
        {photos.map((p,i) => (
          <div key={i} className="thumb">
            <img src={p.url} alt="" loading="lazy" />
            <div className="thumb-del">
              <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.55rem' }} onClick={() => del(p.publicId)}>Remove</button>
            </div>
            <div style={{ position:'absolute', top:4, left:4, background:'rgba(0,0,0,0.7)', color:'rgba(255,255,255,0.6)', fontSize:'0.55rem', padding:'2px 6px', fontFamily:"'Barlow Condensed',sans-serif" }}>{i+1}</div>
          </div>
        ))}
      </div>
      {photos.length===0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No carousel photos yet</p>
        </div>
      )}
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
      if (r.data.aboutName) setForm(f=>({...f,aboutName:r.data.aboutName}));
      if (r.data.aboutRole) setForm(f=>({...f,aboutRole:r.data.aboutRole}));
      if (r.data.aboutBio)  setForm(f=>({...f,aboutBio:r.data.aboutBio}));
    }).catch(() => {});
  }, []);

  const handle = e => setForm(f=>({...f,[e.target.name]:e.target.value}));
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
      const { data } = await api.post('/settings/about-photo', fd, { headers:{'Content-Type':'multipart/form-data'} });
      setAboutPhoto(data.url); toast('Photo updated!');
    } catch { toast('Upload failed'); }
    finally { setUploading(false); e.target.value=''; }
  };

  return (
    <>
      <SectionHeader title="About" sub="Edit your about section — updates instantly on the website" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <p className="a-label" style={{ marginBottom:'1rem' }}>Your Photo</p>
        {aboutPhoto && (
          <div style={{ marginBottom:'1.2rem', border:'1px solid #1a1a1a', borderRadius:'8px', overflow:'hidden', maxWidth:'320px' }}>
            <img src={aboutPhoto} alt="About preview" style={{ width:'100%', height:'auto', display:'block' }} />
          </div>
        )}
        <label className="upload-zone" style={{ maxWidth:'320px' }}>
          <input type="file" accept="image/*" onChange={uploadPhoto} />
          <div className="upload-icon" style={{ fontSize:'1.2rem' }}>↑</div>
          <p>{uploading?'Uploading...':aboutPhoto?'Click to change photo':'Upload your photo'}</p>
          <p style={{ marginTop:'0.3rem', fontSize:'0.65rem' }}>Any dimension — auto compressed</p>
        </label>
      </div>
      <Row label="Your Name"><input name="aboutName" className="a-input" value={form.aboutName} onChange={handle} /></Row>
      <Row label="Your Role"><input name="aboutRole" className="a-input" value={form.aboutRole} onChange={handle} /></Row>
      <Row label="Your Bio">
        <textarea name="aboutBio" className="a-textarea" value={form.aboutBio} onChange={handle} style={{ height:'200px' }} placeholder="Write your bio here..." />
      </Row>
      <button className="a-btn" onClick={save}>Save About Section</button>
    </>
  );
}

function PortfolioTab() {
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([
    api.get('/photos').then(r => setPhotos(r.data)),
    api.get('/photos?featured=true').then(r => setFeatured(r.data)),
  ]).catch(() => {});

  useEffect(() => { load(); }, []);

  const upload = async e => {
    const files = [...e.target.files];
    if (!files.length) return;
    setBusy(true);
    const fd = new FormData();
    files.forEach(f => fd.append('photos', f));
    try {
      const saved = await api.post('/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await Promise.all(saved.data.map(p => api.patch('/photos/'+p._id, { featured:true })));
      toast(files.length+' photo(s) uploaded!');
      e.target.value=''; load();
    } catch(err) { toast(err.response?.data?.error || 'Upload failed'); }
    finally { setBusy(false); }
  };

  const toggle = async (id, isFeatured) => {
    if (!isFeatured && featured.length>=20) return toast('Maximum 20 portfolio photos!');
    try { await api.patch('/photos/'+id, { featured:!isFeatured }); load(); }
    catch { toast('Error'); }
  };

  const del = async id => {
    if (!confirm('Delete this photo?')) return;
    try { await api.delete('/photos/'+id); toast('Deleted'); load(); }
    catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Portfolio" sub={`Your best 20 photos shown on homepage — ${featured.length}/20 selected`} />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>{featured.length} of 20 selected</p>
        <div style={{ display:'flex', gap:'4px' }}>
          {Array(20).fill(null).map((_,i) => (
            <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background: i<featured.length?'#fff':'#222' }} />
          ))}
        </div>
      </div>
      <label className="upload-zone" style={{ marginBottom:'1.5rem' }}>
        <input type="file" accept="image/*" multiple onChange={upload} />
        <div className="upload-icon">↑</div>
        <p style={{ fontSize:'0.9rem', marginBottom:'0.4rem', color:'rgba(255,255,255,0.5)' }}>{busy?'Uploading & compressing...':'Upload portfolio photos'}</p>
        <p>Photos auto-added · Click to feature/unfeature</p>
      </label>
      <p className="a-label" style={{ marginBottom:'0.8rem' }}>Click any photo to add/remove from portfolio</p>
      <div className="thumb-grid">
        {photos.map(p => (
          <div key={p._id} className="thumb" style={{ cursor:'pointer', outline:p.featured?'2px solid #fff':'none', outlineOffset:'2px' }}>
            <img src={p.url} alt={p.title||''} loading="lazy" onClick={() => toggle(p._id, p.featured)} />
            {p.featured && <div style={{ position:'absolute', top:4, right:4, background:'#fff', color:'#000', fontSize:'0.5rem', padding:'2px 6px', fontFamily:"'Barlow Condensed',sans-serif" }}>★</div>}
            <div className="thumb-del">
              <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.55rem' }} onClick={() => del(p._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {photos.length===0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No photos yet — upload above</p>
        </div>
      )}
    </>
  );
}

function CollectionsTab() {
  const toast = useToast();
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [folderPhotos, setFolderPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const loadFolders = () => api.get('/categories/flat').then(r => setFolders(r.data)).catch(() => {});
  const loadPhotos = folderId => {
    if (!folderId) { setFolderPhotos([]); return; }
    api.get('/photos?folder='+folderId).then(r => setFolderPhotos(r.data)).catch(() => {});
  };

  useEffect(() => { loadFolders(); }, []);
  useEffect(() => { loadPhotos(currentFolder?._id); }, [currentFolder]);

  const getChildren = parentId => {
    if (!parentId) return folders.filter(f => !f.parent);
    return folders.filter(f => String(f.parent?._id||f.parent) === String(parentId));
  };

  const openFolder = folder => {
    setCurrentFolder(folder);
    setBreadcrumb(prev => [...prev, folder]);
    setShowNew(false);
  };

  const goToCrumb = idx => {
    if (idx===-1) { setCurrentFolder(null); setBreadcrumb([]); setFolderPhotos([]); }
    else {
      const target = breadcrumb[idx];
      setCurrentFolder(target);
      setBreadcrumb(breadcrumb.slice(0, idx+1));
      loadPhotos(target._id);
    }
    setShowNew(false);
  };

  const create = async () => {
    if (!newName.trim()) return toast('Enter a collection name');
    try {
      await api.post('/categories', { name:newName.trim(), parent:currentFolder?._id||null });
      toast('Collection created!');
      setNewName(''); setShowNew(false); loadFolders();
    } catch(e) { toast(e.response?.data?.error||'Error'); }
  };

  const del = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this collection?')) return;
    try { await api.delete('/categories/'+id); toast('Deleted'); loadFolders(); }
    catch { toast('Error'); }
  };

  const uploadToFolder = async (e, folderId) => {
    const files = [...e.target.files];
    if (!files.length) return;
    setBusy(true);
    const fd = new FormData();
    files.forEach(f => fd.append('photos', f));
    fd.append('folder', folderId);
    try {
      await api.post('/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast(files.length+' photo(s) uploaded!');
      e.target.value=''; loadPhotos(folderId); loadFolders();
    } catch(err) { toast(err.response?.data?.error||'Upload failed'); }
    finally { setBusy(false); }
  };

  const delPhoto = async id => {
    if (!confirm('Delete photo?')) return;
    try { await api.delete('/photos/'+id); toast('Deleted'); loadPhotos(currentFolder?._id); }
    catch { toast('Error'); }
  };

  const currentChildren = getChildren(currentFolder?._id);

  return (
    <>
      <SectionHeader title="Collections" sub="Create collections and upload photos — displayed on website with cover photos" />
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1.5rem', padding:'0.8rem 1rem', background:'#111', borderRadius:'8px', border:'1px solid #1a1a1a', flexWrap:'wrap' }}>
        <span onClick={() => goToCrumb(-1)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.78rem', letterSpacing:'0.15em', textTransform:'uppercase', color:currentFolder?'rgba(255,255,255,0.4)':'#fff', cursor:'pointer' }}>All Collections</span>
        {breadcrumb.map((b, i) => (
          <span key={b._id} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.7rem' }}>›</span>
            <span onClick={() => goToCrumb(i)} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.78rem', letterSpacing:'0.15em', textTransform:'uppercase', color:i===breadcrumb.length-1?'#fff':'rgba(255,255,255,0.4)', cursor:'pointer' }}>{b.name}</span>
          </span>
        ))}
      </div>

      {currentFolder && (
        <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <p className="a-label" style={{ marginBottom:'1rem' }}>Upload photos to {currentFolder.name}</p>
          <label className="upload-zone" style={{ marginBottom:'1rem' }}>
            <input type="file" accept="image/*" multiple onChange={e => uploadToFolder(e, currentFolder._id)} />
            <div className="upload-icon">↑</div>
            <p style={{ fontSize:'0.9rem', marginBottom:'0.4rem', color:'rgba(255,255,255,0.5)' }}>{busy?'Uploading & compressing...':'Click or drag photos here'}</p>
            <p>Auto compressed · Any size · Multiple files</p>
          </label>
          {folderPhotos.length > 0 && (
            <>
              <p className="a-label" style={{ marginBottom:'0.8rem' }}>Photos in {currentFolder.name} ({folderPhotos.length})</p>
              <div className="thumb-grid">
                {folderPhotos.map(p => (
                  <div key={p._id} className="thumb">
                    <img src={p.url} alt={p.title||''} loading="lazy" />
                    <div className="thumb-del">
                      <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.55rem' }} onClick={() => delPhoto(p._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {folderPhotos.length===0 && !busy && (
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.75rem', letterSpacing:'0.15em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase', textAlign:'center', padding:'1rem' }}>No photos yet — upload above</p>
          )}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'10px', marginBottom:'1.5rem' }}>
        {currentChildren.map(f => (
          <div key={f._id} onClick={() => openFolder(f)} style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#333'} onMouseLeave={e=>e.currentTarget.style.borderColor='#1a1a1a'}>
            <div style={{ height:'90px', overflow:'hidden', position:'relative' }}>
              {f.coverPhoto ? (
                <img src={f.coverPhoto} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#151515,#0d0d0d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>📂</div>
              )}
            </div>
            <div style={{ padding:'10px 12px' }}>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.08em', textTransform:'uppercase', color:'#fff', marginBottom:'3px' }}>{f.name}</p>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.1em', color:'rgba(255,255,255,0.3)' }}>{getChildren(f._id).length} sub-collections</p>
            </div>
            <div style={{ padding:'0 10px 10px', display:'flex', gap:'6px', justifyContent:'flex-end' }}>
              <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.6rem' }} onClick={e=>del(f._id,e)}>Delete</button>
            </div>
          </div>
        ))}
        <div onClick={() => setShowNew(true)} style={{ background:'transparent', border:'1px dashed #222', borderRadius:'10px', minHeight:'160px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'8px' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='#444'} onMouseLeave={e=>e.currentTarget.style.borderColor='#222'}>
          <span style={{ fontSize:'1.5rem', color:'rgba(255,255,255,0.15)' }}>+</span>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.7rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>New Collection</p>
        </div>
      </div>

      {showNew && (
        <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem' }}>
          <p className="a-label" style={{ marginBottom:'1rem' }}>New collection {currentFolder?`inside ${currentFolder.name}`:'at root level'}</p>
          <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
            <div style={{ flex:1 }}><input className="a-input" style={{ marginBottom:0 }} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Wedding, Street, Portraits..." onKeyDown={e=>e.key==='Enter'&&create()} autoFocus /></div>
            <button className="a-btn" onClick={create}>Create</button>
            <button className="a-btn a-btn-ghost" onClick={()=>{setShowNew(false);setNewName('');}}>Cancel</button>
          </div>
        </div>
      )}

      {currentChildren.length===0 && !showNew && !currentFolder && (
        <div style={{ textAlign:'center', padding:'2rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No collections yet — click + New Collection to start</p>
        </div>
      )}
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
    if (!form.name||!form.url) return toast('Name and URL required');
    try { await api.post('/social', form); toast('Added'); setForm({name:'',url:''}); load(); }
    catch(e) { toast(e.response?.data?.error||'Error'); }
  };
  const del = async id => {
    try { await api.delete('/social/'+id); load(); }
    catch { toast('Error'); }
  };
  const update = async (id, url) => {
    try { await api.patch('/social/'+id, { url }); toast('Saved'); }
    catch { toast('Error'); }
  };
  return (
    <>
      <SectionHeader title="Social Links" sub="Manage your contact and social media links" />
      {socials.map(s => (
        <div key={s._id} className="list-row">
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', minWidth:'100px', color:'rgba(255,255,255,0.5)' }}>{s.name}</span>
          <input defaultValue={s.url} onBlur={e=>update(s._id,e.target.value)} style={{ flex:1, background:'transparent', border:'none', borderBottom:'1px solid #1a1a1a', color:'rgba(255,255,255,0.6)', fontFamily:"'Barlow',sans-serif", fontSize:'0.9rem', padding:'0.4rem 0', outline:'none' }} />
          <button className="a-btn a-btn-red a-btn-sm" onClick={()=>del(s._id)}>Remove</button>
        </div>
      ))}
      <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid #111' }}>
        <p className="a-label" style={{ marginBottom:'1rem' }}>Add New Platform</p>
        <TwoCol>
          <Row label="Platform Name"><input className="a-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Instagram" /></Row>
          <Row label="URL"><input className="a-input" value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://instagram.com/@handle" /></Row>
        </TwoCol>
        <button className="a-btn" onClick={add}>+ Add Platform</button>
      </div>
    </>
  );
}

function BookingsTab() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const load = () => api.get('/bookings').then(r => setBookings(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const patch = async (id, status) => {
    try { await api.patch('/bookings/'+id, { status }); load(); toast('Updated'); }
    catch { toast('Error'); }
  };
  const del = async id => {
    if (!confirm('Delete?')) return;
    try { await api.delete('/bookings/'+id); load(); }
    catch { toast('Error'); }
  };
  const pillClass = s => s==='confirmed'?'status-pill pill-confirmed':s==='cancelled'?'status-pill pill-cancelled':'status-pill pill-new';
  return (
    <>
      <SectionHeader title="Bookings" sub={`${bookings.length} total bookings`} />
      {bookings.length===0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No bookings yet</p>
        </div>
      )}
      {bookings.map(b => (
        <div key={b._id} className="booking-card">
          <div style={{ display:'flex', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
            <div>
              <p className="bk-name">{b.firstName} {b.lastName}</p>
              <p className="bk-meta">{b.date||'Flexible'}</p>
              <p className="bk-meta">{b.email}{b.phone?' — '+b.phone:''}</p>
              {b.message&&<p className="bk-msg">"{b.message}"</p>}
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.68rem', letterSpacing:'0.15em', color:'rgba(255,255,255,0.2)', marginTop:'0.5rem' }}>{new Date(b.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.6rem' }}>
              <span className={pillClass(b.status)}>{b.status}</span>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                {b.status!=='confirmed'&&<button onClick={()=>patch(b._id,'confirmed')} className="a-btn a-btn-sm" style={{ background:'rgba(100,200,100,0.1)', color:'rgba(100,200,100,0.8)', border:'1px solid rgba(100,200,100,0.2)' }}>Confirm</button>}
                {b.status!=='cancelled'&&<button onClick={()=>patch(b._id,'cancelled')} className="a-btn a-btn-ghost a-btn-sm">Cancel</button>}
                <button className="a-btn a-btn-red a-btn-sm" onClick={()=>del(b._id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      ))}
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
    if (code.length!==6) return toast('Enter a 6-digit code');
    try {
      await api.post('/auth/mfa/verify', { token:code });
      toast('MFA enabled!');
      setMfaOn(true); setQrCode(''); setCode('');
    } catch { toast('Invalid code. Try again.'); }
  };

  const disableMfa = async () => {
    if (!confirm('Disable MFA?')) return;
    try { await api.post('/auth/mfa/disable'); toast('MFA disabled.'); setMfaOn(false); setQrCode(''); setSecret(''); }
    catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Security" sub="Set up two-factor authentication for your admin login" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem' }}>
        <p style={{ fontSize:'0.95rem', color:'rgba(255,255,255,0.5)', lineHeight:1.8, marginBottom:'1.5rem', fontWeight:300 }}>
          After entering your password you will be asked for a 6-digit code from Google Authenticator. This prevents anyone from logging in even if they know your password.
        </p>
        {!mfaOn&&!qrCode&&<button className="a-btn" onClick={setupMfa} disabled={loading}>{loading?'Setting up...':'Setup Google Authenticator'}</button>}
        {qrCode&&(
          <div>
            <p className="a-label" style={{ marginBottom:'1rem' }}>Step 1 — Scan this QR code with Google Authenticator</p>
            <img src={qrCode} alt="QR Code" style={{ width:'180px', height:'180px', background:'#fff', padding:'8px', borderRadius:'8px', marginBottom:'1rem' }} />
            <p style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.25)', marginBottom:'1.5rem', fontWeight:300 }}>Cannot scan? Enter manually: <span style={{ color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em' }}>{secret}</span></p>
            <p className="a-label" style={{ marginBottom:'0.8rem' }}>Step 2 — Enter the 6-digit code from the app</p>
            <input className="a-input" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} style={{ maxWidth:'200px', textAlign:'center', fontSize:'1.4rem', letterSpacing:'0.5em' }} />
            <div style={{ marginTop:'1rem' }}><button className="a-btn" onClick={verifyMfa}>Verify and Enable MFA</button></div>
          </div>
        )}
        {mfaOn&&(
          <div>
            <p style={{ fontSize:'0.95rem', color:'rgba(100,200,100,0.8)', marginBottom:'1.5rem', fontWeight:300 }}>✓ MFA is active on your account.</p>
            <button className="a-btn a-btn-red" onClick={disableMfa}>Disable MFA</button>
          </div>
        )}
      </div>
    </>
  );
}
