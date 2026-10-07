// Coursework adapter: no fetch, remote service or persistence is involved.
export function previewRegistration(data, { fail = false, signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      if (fail) reject(new Error('The preview service is temporarily unavailable.'));
      else resolve({ name: data.name, event: 'Build for Everyone' });
    }, 850);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
