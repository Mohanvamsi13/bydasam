import { useCallback } from 'react';
let toastEl = null;
let hideTimer = null;
export function useToast() {
  const show = useCallback((msg) => {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toastEl.classList.remove('show'), 30000);
  }, []);
  return show;
}
