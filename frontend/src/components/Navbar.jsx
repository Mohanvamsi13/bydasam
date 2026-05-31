import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Work',     href: '#portfolio' },
    { label: 'Services', href: '#services' },
    { label: 'About',    href: '#about' },
    { label: 'Connect',  href: '#contact' },
  ];

  return (
    <>
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="/" className="nav-brand">BYDASAM</a>

        <ul className="nav-links">
          {links.map(l => <li key={l.label}><a href={l.href}>{l.label}</a></li>)}
        </ul>

        <div className="nav-right">
          <a href="#booking" className="nav-book-btn">Book a Session</a>
          <Link to="/admin/login" className="nav-admin-btn">Admin</Link>
          <button className={`hamburger${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {links.map(l => (
          <a key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a href="#booking" onClick={() => setOpen(false)}>Book</a>
        <Link to="/admin/login" onClick={() => setOpen(false)} style={{ fontSize: '1.2rem', opacity: 0.3 }}>Admin</Link>
      </div>
    </>
  );
}
