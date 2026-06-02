import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function AdminLogin() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [mfaStep, setMfaStep]   = useState(false);
  const [mfaCode, setMfaCode]   = useState('');
  const [busy, setBusy]         = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const toast                   = useToast();

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password, mfaStep ? mfaCode : undefined);
      toast('Welcome back!');
      navigate('/admin');
    } catch (err) {
      const msg = err.response?.data?.error;
      if (msg === 'MFA_REQUIRED') {
        setMfaStep(true);
        toast('Enter your Google Authenticator code.');
      } else {
        toast(msg || 'Invalid credentials.');
      }
    } finally { setBusy(false); }
  };

  const EyeIcon = ({ open }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      )}
    </svg>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ width:'100%', maxWidth:'360px' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2.5rem', letterSpacing:'0.1em', color:'#fff' }}>BYDASAM</h1>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)', marginTop:'0.3rem' }}>Admin Panel</p>
        </div>

        <form onSubmit={submit}>
          {!mfaStep ? (
            <>
              <div style={{ marginBottom:'1.5rem' }}>
                <label className="a-label">Email</label>
                <input type="email" className="a-input" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
              </div>
              <div style={{ marginBottom:'2rem' }}>
                <label className="a-label">Password</label>
                <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="a-input"
                    value={form.password}
                    onChange={e => setForm(f=>({...f,password:e.target.value}))}
                    style={{ paddingRight:'2.5rem', width:'100%', marginBottom:0 }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position:'absolute', right:'0.5rem', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:'0.2rem', display:'flex', alignItems:'center' }}>
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ marginBottom:'2rem', textAlign:'center' }}>
              <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:'1.5rem' }}>
                Open Google Authenticator and enter the 6-digit code
              </p>
              <input
                type="text"
                className="a-input"
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                maxLength={6}
                style={{ textAlign:'center', fontSize:'1.5rem', letterSpacing:'0.5em' }}
                autoFocus
              />
            </div>
          )}

          <button type="submit" className="a-btn" style={{ width:'100%', padding:'1rem', fontSize:'0.8rem' }} disabled={busy}>
            {busy ? 'Checking...' : mfaStep ? 'Verify Code' : 'Sign In'}
          </button>

          {mfaStep && (
            <button type="button" onClick={() => { setMfaStep(false); setMfaCode(''); }}
              style={{ width:'100%', marginTop:'0.8rem', background:'transparent', border:'none', color:'rgba(255,255,255,0.2)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.2em', textTransform:'uppercase', cursor:'pointer' }}>
              Back to login
            </button>
          )}
        </form>

        <p style={{ textAlign:'center', marginTop:'2rem' }}>
          <a href="/" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.62rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>Back to site</a>
        </p>
      </div>
    </div>
  );
}
