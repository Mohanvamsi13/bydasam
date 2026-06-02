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
    const lower = msg.toLowerCase();
    const isError = lower.includes('error') || lower.includes('invalid') || lower.includes('failed') || lower.includes('wrong') || lower.includes('fill in') || lower.includes('maximum') || lower.includes('must be') || lower.includes('required') || lower.includes('try again');
    const ms = duration || (isError ? 30000 : 3000);
    hideTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }, []);
  return show;
}
