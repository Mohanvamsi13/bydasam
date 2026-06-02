import { useCallback } from 'react';
let toastEl = null;
let hideTimer = null;
export function useToast() {
  const show = useCallback((msg, duration) => {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(hideTimer);
    const isError = msg.toLowerCase().includes('error') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('wrong') || msg.toLowerCase().includes('fill in') || msg.toLowerCase().includes('maximum') || msg.toLowerCase().includes('must be');
    const ms = duration || (isError ? 30000 : 3000);
    hideTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }, []);
  return show;
}
