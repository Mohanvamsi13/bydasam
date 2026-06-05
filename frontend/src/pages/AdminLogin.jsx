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

  return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ width:'100%', maxWidth:'360px' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2.5rem', letterSpacing:'0.1em', color:'#fff' }}>BYDASAM</h1>
          <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginTop:'0.3rem' }}>Admin Panel</p>
        </div>

        <form onSubmit={submit}>
          {!mfaStep ? (
            <>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.75rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:'0.5rem' }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f=>({...f,email:e.target.value}))}
                  placeholder="madhusaipavan02@gmail.com"
                  style={{ width:'100%', background:'#111', border:'1px solid #2a2a2a', color:'#fff', fontFamily:"'Barlow',sans-serif", fontSize:'1rem', fontWeight:300, padding:'0.8rem 1rem', outline:'none', borderRadius:'6px', boxSizing:'border-box' }}
                  autoComplete="email"
                />
              </div>
              <div style={{ marginBottom:'2rem' }}>
                <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.75rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:'0.5rem' }}>Password</label>
                <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f=>({...f,password:e.target.value}))}
                    placeholder="••••••••"
                    style={{ width:'100%', background:'#111', border:'1px solid #2a2a2a', color:'#fff', fontFamily:"'Barlow',sans-serif", fontSize:'1rem', fontWeight:300, padding:'0.8rem 1rem', paddingRight:'3rem', outline:'none', borderRadius:'6px', boxSizing:'border-box' }}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position:'absolute', right:'0.8rem', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:'0.2rem', fontSize:'0.75rem', fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em' }}>
                    {showPass ? 'Hide' : 'Show'}
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
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                maxLength={6}
                placeholder="000000"
                style={{ width:'100%', background:'#111', border:'1px solid #2a2a2a', color:'#fff', fontFamily:"'Barlow',sans-serif", fontSize:'1.5rem', fontWeight:300, padding:'0.8rem 1rem', outline:'none', borderRadius:'6px', textAlign:'center', letterSpacing:'0.5em', boxSizing:'border-box' }}
                autoFocus
              />
            </div>
          )}

          <button type="submit"
            style={{ width:'100%', padding:'1rem', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.85rem', letterSpacing:'0.25em', textTransform:'uppercase', background:'#fff', color:'#000', border:'none', borderRadius:'6px', cursor:'pointer', opacity: busy ? 0.6 : 1 }}
            disabled={busy}>
            {busy ? 'Checking...' : mfaStep ? 'Verify Code' : 'Sign In'}
          </button>

          {mfaStep && (
            <button type="button" onClick={() => { setMfaStep(false); setMfaCode(''); }}
              style={{ width:'100%', marginTop:'0.8rem', background:'transparent', border:'none', color:'rgba(255,255,255,0.2)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'0.65rem', letterSpacing:'0.2em', textTransform:'uppercase', cursor:'pointer', padding:'0.5rem' }}>
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
