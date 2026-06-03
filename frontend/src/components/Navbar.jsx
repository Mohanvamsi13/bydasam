import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ['portfolio','collections','about','contact','booking'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom > 100) {
            setActive(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Portfolio', href: '#portfolio', id: 'portfolio' },
    { label: 'Collections', href: '#collections', id: 'collections' },
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  return (
    <>
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="/" className="nav-brand">BYDASAM</a>
        <ul className="nav-links">
          {links.map(l => (
            <li key={l.label}>
              <a href={l.href} style={{
                color: active === l.id ? '#fff' : 'rgba(255,255,255,0.65)',
                fontWeight: active === l.id ? '700' : '400',
                borderBottom: active === l.id ? '1px solid #fff' : '1px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s',
              }}>{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <a href="#booking" className="nav-book-btn">Book Now</a>
          <button className={`hamburger${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {links.map(l => (
          <a key={l.label} href={l.href} onClick={() => setOpen(false)}
            style={{ fontWeight: active === l.id ? '700' : '400' }}>
            {l.label}
          </a>
        ))}
        <a href="#booking" onClick={() => setOpen(false)} style={{ fontSize:'1.8rem' }}>Book Now</a>
      </div>
    </>
  );
}
