import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

const TABS = [
  { id:'Hero',        icon:'🎬', desc:'Background' },
  { id:'Carousel',    icon:'🎠', desc:'Sliding strip' },
  { id:'About',       icon:'👤', desc:'Your profile' },
  { id:'Portfolio',   icon:'🖼', desc:'Featured photos' },
  { id:'Weddings',    icon:'💒', desc:'Wedding albums' },
  { id:'Collections', icon:'📂', desc:'All collections' },
  { id:'Social',      icon:'🔗', desc:'Links' },
  { id:'Bookings',    icon:'📅', desc:'Inquiries' },
  { id:'Security',    icon:'🔒', desc:'2FA login' },
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
              <span style={{ flex:1, textAlign:'left' }}>{t.id}</span>
              <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.2)', letterSpacing:'0.08em' }}>{t.desc}</span>
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
          {tab==='Weddings'    && <WeddingsTab />}
          {tab==='Collections' && <CollectionsTab />}
          {tab==='Social'      && <SocialTab />}
          {tab==='Bookings'    && <BookingsTab />}
          {tab==='Security'    && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:'1.5rem' }}>
      <h2 className="admin-section-title">{title}</h2>
      {sub && <p className="admin-section-sub">{sub}</p>}
    </div>
  );
}

function Row({ label, children }) {
  return <div style={{ marginBottom:'1.4rem' }}><label className="a-label">{label}</label>{children}</div>;
}

function TwoCol({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 2rem' }}>{children}</div>;
}

async function uploadFilesOneByOne(files, uploadFn, onProgress) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    onProgress(i + 1, files.length);
    const result = await uploadFn(files[i], i);
    results.push(result);
  }
  return results;
}

function UploadZone({ onFiles, busy, status, accept='image/*', multiple=true, label='Click or drag photos here', hint='Auto compressed · Any size' }) {
  return (
    <label className="upload-zone">
      <input type="file" accept={accept} multiple={multiple} onChange={e => onFiles([...e.target.files])} />
      <div className="upload-icon">↑</div>
      <p style={{ fontSize:'0.9rem', marginBottom:'0.4rem', color:'rgba(255,255,255,0.5)' }}>{busy ? status : label}</p>
      <p>{hint}</p>
    </label>
  );
}

function PhotoThumb({ photo, selected, onSelect, onDelete, showSelect=false }) {
  return (
    <div className="thumb" style={{ outline: selected ? '2px solid #fff' : 'none', outlineOffset:'2px' }}>
      <img src={photo.url} alt="" loading="lazy" />
      {showSelect && (
        <div style={{ position:'absolute', top:4, left:4 }} onClick={e => { e.stopPropagation(); onSelect(); }}>
          <div style={{ width:'18px', height:'18px', borderRadius:'3px', background: selected ? '#fff' : 'rgba(0,0,0,0.6)', border:'1.5px solid rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            {selected && <span style={{ color:'#000', fontSize:'11px', fontWeight:'bold' }}>✓</span>}
          </div>
        </div>
      )}
      <div className="thumb-del">
        <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.55rem' }} onClick={onDelete}>Delete</button>
      </div>
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

  const upload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append('media', file);
    try {
      const { data } = await api.post('/settings/hero-media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: p => setProgress(Math.round(p.loaded * 100 / p.total)),
      });
      setHeroMedia(data.url); setHeroMediaType(data.type);
      toast('Hero updated!');
    } catch { toast('Upload failed'); }
    finally { setUploading(false); setProgress(0); e.target.value=''; }
  };

  const remove = async () => {
    if (!confirm('Remove hero?')) return;
    try { await api.post('/settings', { heroMedia:'', heroMediaType:'' }); setHeroMedia(''); toast('Removed'); }
    catch { toast('Error'); }
  };

  return (
    <>
      <SectionHeader title="Hero" sub="Full screen background — upload a photo or video" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <p style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.4)', marginBottom:'1.5rem', lineHeight:1.7, fontWeight:300 }}>
          This fills the entire first screen of your website. Use a high quality photo or a cinematic video (20 seconds minimum).
        </p>
        {heroMedia && (
          <div style={{ marginBottom:'1.5rem' }}>
            <p className="a-label" style={{ marginBottom:'0.8rem' }}>Current</p>
            {heroMediaType==='video' ? (
              <video src={heroMedia} style={{ width:'100%', maxWidth:'500px', height:'250px', objectFit:'cover', borderRadius:'8px' }} muted controls />
            ) : (
              <img src={heroMedia} alt="Hero" style={{ width:'100%', maxWidth:'500px', height:'250px', objectFit:'cover', borderRadius:'8px' }} />
            )}
            <div style={{ marginTop:'0.8rem' }}><button className="a-btn a-btn-red a-btn-sm" onClick={remove}>Remove</button></div>
          </div>
        )}
        {uploading && (
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
          <label style={{ background:'#0d0d0d', border:'1px dashed #333', borderRadius:'10px', padding:'2rem 1rem', textAlign:'center', cursor:'pointer', position:'relative' }}>
            <input type="file" accept="image/*" onChange={upload} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} />
            <div style={{ fontSize:'2rem', marginBottom:'0.8rem' }}>📸</div>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)' }}>Upload Photo</p>
          </label>
          <label style={{ background:'#0d0d0d', border:'1px dashed #333', borderRadius:'10px', padding:'2rem 1rem', textAlign:'center', cursor:'pointer', position:'relative' }}>
            <input type="file" accept="video/*" onChange={upload} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} />
            <div style={{ fontSize:'2rem', marginBottom:'0.8rem' }}>🎬</div>
            <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)' }}>Upload Video</p>
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
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(new Set());

  const load = () => api.get('/settings/carousel').then(r => setPhotos(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const upload = async files => {
    if (!files.length) return;
    if (photos.length + files.length > 30) return toast('Maximum 30 photos!');
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        setStatus(`Uploading ${i+1} of ${files.length}...`);
        const fd = new FormData();
        fd.append('photos', files[i]);
        await api.post('/settings/carousel', fd, { headers:{'Content-Type':'multipart/form-data'} });
      }
      toast(`${files.length} photo(s) added!`);
      load();
    } catch { toast('Upload failed'); }
    finally { setBusy(false); setStatus(''); }
  };

  const del = async publicId => {
    try { await api.delete('/settings/carousel/' + encodeURIComponent(publicId)); load(); }
    catch { toast('Error'); }
  };

  const toggleSelect = publicId => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(publicId) ? next.delete(publicId) : next.add(publicId);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} photo(s)?`)) return;
    for (const publicId of selected) {
      await api.delete('/settings/carousel/' + encodeURIComponent(publicId)).catch(() => {});
    }
    setSelected(new Set());
    toast(`${selected.size} photo(s) deleted!`);
    load();
  };

  return (
    <>
      <SectionHeader title="Carousel" sub={`Sliding strip on homepage — ${photos.length}/20 photos`} />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1rem 1.5rem', marginBottom:'1.5rem' }}>
        <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>
          {photos.length} of 30 · Select photos to delete multiple at once
        </p>
      </div>
      <UploadZone onFiles={upload} busy={busy} status={status} hint="Auto compressed · Up to 20 photos total" />
      {selected.size > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1rem', padding:'0.8rem 1rem', background:'#111', borderRadius:'8px', border:'1px solid #1a1a1a' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'#fff' }}>{selected.size} selected</p>
          <button className="a-btn a-btn-red a-btn-sm" onClick={deleteSelected}>Delete Selected</button>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}
      <div className="thumb-grid">
        {photos.map((p,i) => (
          <PhotoThumb key={i} photo={p} selected={selected.has(p.publicId)} onSelect={() => toggleSelect(p.publicId)} onDelete={() => del(p.publicId)} showSelect />
        ))}
      </div>
      {photos.length===0 && <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}><p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No photos yet</p></div>}
    </>
  );
}

function AboutTab() {
  const toast = useToast();
  const [form, setForm] = useState({ aboutName:'Madhu Sai Pavan Dasam', aboutRole:'Photographer · Storyteller · Visual Architect', aboutBio:'' });
  const [aboutPhoto, setAboutPhoto] = useState('');
  const [position, setPosition] = useState('center top');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      if (r.data.aboutPhoto) setAboutPhoto(r.data.aboutPhoto);
      if (r.data.aboutName) setForm(f=>({...f,aboutName:r.data.aboutName}));
      if (r.data.aboutRole) setForm(f=>({...f,aboutRole:r.data.aboutRole}));
      if (r.data.aboutBio)  setForm(f=>({...f,aboutBio:r.data.aboutBio}));
      if (r.data.aboutPhotoPosition) setPosition(r.data.aboutPhotoPosition);
    }).catch(() => {});
  }, []);

  const handle = e => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const savePosition = async pos => {
    setPosition(pos);
    try { await api.post('/settings', { aboutPhotoPosition: pos }); toast('Position saved!'); }
    catch { toast('Error'); }
  };

  const save = async () => {
    try { await api.post('/settings', { ...form, aboutPhotoPosition: position }); toast('Saved!'); }
    catch { toast('Error'); }
  };

  const uploadPhoto = async files => {
    if (!files[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('photo', files[0]);
    try {
      const { data } = await api.post('/settings/about-photo', fd, { headers:{'Content-Type':'multipart/form-data'} });
      setAboutPhoto(data.url); toast('Photo updated!');
    } catch { toast('Upload failed'); }
    finally { setUploading(false); }
  };

  const positions = [
    { label:'Top Left', value:'left top' },{ label:'Top Center', value:'center top' },{ label:'Top Right', value:'right top' },
    { label:'Mid Left', value:'left center' },{ label:'Center', value:'center center' },{ label:'Mid Right', value:'right center' },
    { label:'Bot Left', value:'left bottom' },{ label:'Bot Center', value:'center bottom' },{ label:'Bot Right', value:'right bottom' },
  ];

  return (
    <>
      <SectionHeader title="About" sub="Your photo, name, role and bio shown on the website" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <p className="a-label" style={{ marginBottom:'1rem' }}>Your Photo</p>
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'flex-start', flexWrap:'wrap' }}>
          {aboutPhoto && <img src={aboutPhoto} alt="About" style={{ width:'120px', height:'150px', objectFit:'cover', objectPosition:position, borderRadius:'6px' }} />}
          <UploadZone onFiles={uploadPhoto} busy={uploading} status="Uploading..." label={aboutPhoto?'Click to change photo':'Upload your photo'} hint="Any size — auto compressed" multiple={false} />
        </div>
        {aboutPhoto && (
          <div style={{ marginTop:'1.2rem' }}>
            <p className="a-label" style={{ marginBottom:'0.8rem' }}>Crop focus point</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'4px', maxWidth:'240px' }}>
              {positions.map(p => (
                <button key={p.value} onClick={() => savePosition(p.value)}
                  style={{ padding:'8px 4px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', background: position===p.value ? '#fff' : '#0d0d0d', color: position===p.value ? '#000' : 'rgba(255,255,255,0.35)', border: position===p.value ? '1px solid #fff' : '1px solid #222', borderRadius:'4px', cursor:'pointer' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <Row label="Your Name"><input name="aboutName" className="a-input" value={form.aboutName} onChange={handle} /></Row>
      <Row label="Your Role"><input name="aboutRole" className="a-input" value={form.aboutRole} onChange={handle} /></Row>
      <Row label="Your Bio"><textarea name="aboutBio" className="a-textarea" value={form.aboutBio} onChange={handle} style={{ height:'200px' }} placeholder="Write your bio here..." /></Row>
      <button className="a-btn" onClick={save}>Save About Section</button>
    </>
  );
}

function PortfolioTab() {
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [cropPhoto, setCropPhoto] = useState(null);

  const CROP_POSITIONS = [
    { label:'↖', value:'left top' },{ label:'↑', value:'center top' },{ label:'↗', value:'right top' },
    { label:'←', value:'left center' },{ label:'·', value:'center center' },{ label:'→', value:'right center' },
    { label:'↙', value:'left bottom' },{ label:'↓', value:'center bottom' },{ label:'↘', value:'right bottom' },
  ];

  const load = () => Promise.all([
    api.get('/photos').then(r => setPhotos(r.data)),
    api.get('/photos?featured=true').then(r => setFeatured(r.data)),
  ]).catch(() => {});
  useEffect(() => { load(); }, []);

  const upload = async files => {
    if (!files.length) return;
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        setStatus(`Uploading ${i+1} of ${files.length}...`);
        const fd = new FormData();
        fd.append('photos', files[i]);
        const res = await api.post('/photos', fd, { headers:{'Content-Type':'multipart/form-data'} });
        await Promise.all(res.data.map(p => api.patch('/photos/'+p._id, { featured:true })));
      }
      toast(`${files.length} photo(s) uploaded!`);
      load();
    } catch { toast('Upload failed'); }
    finally { setBusy(false); setStatus(''); }
  };

  const toggle = async (id, isFeatured) => {
    if (!isFeatured && featured.length>=50) return toast('Maximum 50 portfolio photos!');
    try { await api.patch('/photos/'+id, { featured:!isFeatured }); load(); }
    catch { toast('Error'); }
  };

  const saveCrop = async (id, position) => {
    try { await api.patch('/photos/'+id, { cropPosition: position }); toast('Crop saved!'); load(); setCropPhoto(null); }
    catch { toast('Error'); }
  };

  const toggleSelect = id => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} photo(s)?`)) return;
    for (const id of selected) await api.delete('/photos/'+id).catch(() => {});
    setSelected(new Set());
    toast(`${selected.size} deleted!`);
    load();
  };

  return (
    <>
      <SectionHeader title="Portfolio" sub={`Featured photos — ${featured.length}/50 · Click photo to feature · Click CROP to set focus`} />
      <UploadZone onFiles={upload} busy={busy} status={status} hint="Photos auto-added to portfolio · Click to feature/unfeature" />
      {selected.size > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1rem', padding:'0.8rem 1rem', background:'#111', borderRadius:'8px', border:'1px solid #1a1a1a' }}>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'#fff' }}>{selected.size} selected</p>
          <button className="a-btn a-btn-red a-btn-sm" onClick={deleteSelected}>Delete Selected</button>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}
      <div className="thumb-grid">
        {photos.map(p => (
          <div key={p._id} className="thumb" style={{ cursor:'pointer', outline: selected.has(p._id) ? '2px solid #e55' : p.featured ? '2px solid #fff' : 'none', outlineOffset:'2px' }}>
            <img src={p.url} alt="" loading="lazy" style={{ objectPosition: p.cropPosition||'center center' }} onClick={() => toggle(p._id, p.featured)} />
            {p.featured && <div style={{ position:'absolute', top:4, right:4, background:'#fff', color:'#000', fontSize:'0.5rem', padding:'2px 6px', fontFamily:"'Barlow Condensed',sans-serif" }}>★</div>}
            <div style={{ position:'absolute', top:4, left:4 }} onClick={e => { e.stopPropagation(); toggleSelect(p._id); }}>
              <div style={{ width:'18px', height:'18px', borderRadius:'3px', background: selected.has(p._id) ? '#e55' : 'rgba(0,0,0,0.6)', border:'1.5px solid rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                {selected.has(p._id) && <span style={{ color:'#fff', fontSize:'11px', fontWeight:'bold' }}>✓</span>}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setCropPhoto(cropPhoto===p._id ? null : p._id); }}
              style={{ position:'absolute', bottom:28, right:4, background:'rgba(0,0,0,0.8)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', fontSize:'0.55rem', padding:'2px 5px', borderRadius:'3px', cursor:'pointer', fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em' }}>
              CROP
            </button>
            {cropPhoto===p._id && (
              <div style={{ position:'absolute', bottom:50, right:4, zIndex:20, background:'rgba(0,0,0,0.9)', padding:'4px', borderRadius:'4px', border:'1px solid #333' }} onClick={e => e.stopPropagation()}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'2px' }}>
                  {CROP_POSITIONS.map(pos => (
                    <button key={pos.value} onClick={() => saveCrop(p._id, pos.value)}
                      style={{ padding:'5px', fontFamily:'monospace', fontSize:'0.75rem', background: (p.cropPosition||'center center')===pos.value ? '#fff' : 'rgba(255,255,255,0.1)', color: (p.cropPosition||'center center')===pos.value ? '#000' : '#fff', border:'none', borderRadius:'2px', cursor:'pointer' }}>
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="thumb-del">
              <button className="a-btn a-btn-red a-btn-sm" style={{ fontSize:'0.55rem' }} onClick={() => { if(confirm('Delete?')) api.delete('/photos/'+p._id).then(load); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {photos.length===0 && <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}><p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No photos yet</p></div>}
    </>
  );
}

function WeddingsTab() {
  return <FolderManager rootFolderName="Weddings" sectionTitle="Weddings" sectionSub="Create couple folders (e.g. Arun & Priya) → then add sub-folders (Wedding, Haldi, Mehendi) → upload photos" />;
}

function CollectionsTab() {
  return <FolderManager rootFolderName="Collections" sectionTitle="Collections" sectionSub="Create collections and upload photos — shown on the website with cover photos" isCollections={true} />;
}

function SocialTab() {
  const toast = useToast();
  const [socials, setSocials] = useState([]);
  const [form, setForm] = useState({ name:'', url:'' });
  const load = () => api.get('/social').then(r => setSocials(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.name||!form.url) return toast('Name and URL required');
    try { await api.post('/social', form); toast('Added!'); setForm({name:'',url:''}); load(); }
    catch(e) { toast(e.response?.data?.error||'Error'); }
  };
  const del = async id => { try { await api.delete('/social/'+id); load(); } catch { toast('Error'); } };
  const update = async (id, url) => { try { await api.patch('/social/'+id, { url }); toast('Saved!'); } catch { toast('Error'); } };
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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 2rem' }}>
          <div style={{ marginBottom:'1.4rem' }}><label className="a-label">Platform Name</label><input className="a-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Instagram" /></div>
          <div style={{ marginBottom:'1.4rem' }}><label className="a-label">URL</label><input className="a-input" value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://instagram.com/@handle" /></div>
        </div>
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
  const patch = async (id, status) => { try { await api.patch('/bookings/'+id, { status }); load(); toast('Updated!'); } catch { toast('Error'); } };
  const del = async id => { if (!confirm('Delete?')) return; try { await api.delete('/bookings/'+id); load(); } catch { toast('Error'); } };
  const pillClass = s => s==='confirmed'?'status-pill pill-confirmed':s==='cancelled'?'status-pill pill-cancelled':'status-pill pill-new';
  return (
    <>
      <SectionHeader title="Bookings" sub={`${bookings.length} total booking requests`} />
      {bookings.length===0 && <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.15)' }}><p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.8rem', letterSpacing:'0.2em', textTransform:'uppercase' }}>No bookings yet</p></div>}
      {bookings.map(b => (
        <div key={b._id} className="booking-card">
          <div style={{ display:'flex', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
            <div>
              <p className="bk-name">{b.firstName} {b.lastName}</p>
              <p className="bk-meta">{b.date||'Flexible date'}</p>
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
    try { const { data } = await api.post('/auth/mfa/setup'); setQrCode(data.qrCode); setSecret(data.secret); toast('Scan the QR code!'); }
    catch { toast('Error'); }
    finally { setLoading(false); }
  };
  const verifyMfa = async () => {
    if (code.length!==6) return toast('Enter 6-digit code');
    try { await api.post('/auth/mfa/verify', { token:code }); toast('MFA enabled!'); setMfaOn(true); setQrCode(''); setCode(''); }
    catch { toast('Invalid code'); }
  };
  const disableMfa = async () => {
    if (!confirm('Disable MFA?')) return;
    try { await api.post('/auth/mfa/disable'); toast('MFA disabled'); setMfaOn(false); }
    catch { toast('Error'); }
  };
  return (
    <>
      <SectionHeader title="Security" sub="Two-factor authentication — adds extra protection to your login" />
      <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'10px', padding:'1.5rem' }}>
        <p style={{ fontSize:'0.95rem', color:'rgba(255,255,255,0.5)', lineHeight:1.8, marginBottom:'1.5rem', fontWeight:300 }}>
          After enabling this, every login will ask for a 6-digit code from your Google Authenticator app — even if someone has your password.
        </p>
        {!mfaOn&&!qrCode&&<button className="a-btn" onClick={setupMfa} disabled={loading}>{loading?'Setting up...':'Setup Google Authenticator'}</button>}
        {qrCode&&(
          <div>
            <p className="a-label" style={{ marginBottom:'1rem' }}>Step 1 — Scan with Google Authenticator</p>
            <img src={qrCode} alt="QR" style={{ width:'180px', height:'180px', background:'#fff', padding:'8px', borderRadius:'8px', marginBottom:'1rem' }} />
            <p style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.25)', marginBottom:'1.5rem' }}>Manual code: <span style={{ color:'rgba(255,255,255,0.5)' }}>{secret}</span></p>
            <p className="a-label" style={{ marginBottom:'0.8rem' }}>Step 2 — Enter the 6-digit code</p>
            <input className="a-input" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} style={{ maxWidth:'200px', textAlign:'center', fontSize:'1.4rem', letterSpacing:'0.5em' }} />
            <div style={{ marginTop:'1rem' }}><button className="a-btn" onClick={verifyMfa}>Verify & Enable</button></div>
          </div>
        )}
        {mfaOn&&(
          <div>
            <p style={{ color:'rgba(100,200,100,0.8)', marginBottom:'1.5rem' }}>✓ MFA is active</p>
            <button className="a-btn a-btn-red" onClick={disableMfa}>Disable MFA</button>
          </div>
        )}
      </div>
    </>
  );
}
