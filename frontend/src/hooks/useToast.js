import { useEffect, useRef } from 'react';

export function useToast() {
  const toastRef = useRef(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
    toastRef.current = el;
    return () => { if (el.parentNode) el.parentNode.removeChild(el); };
  }, []);

  return (msg) => {
    const el = toastRef.current;
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  };
}
