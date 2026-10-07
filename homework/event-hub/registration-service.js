export function submitRegistration(payload, {simulateError = false, signal} = {}) {
  const keys = ['name', 'email', 'interest', 'note'];
  if (!payload || keys.some(key => typeof payload[key] !== 'string')) {
    return Promise.reject(new TypeError('Invalid registration data.'));
  }
  const receipt = Object.freeze(Object.fromEntries(keys.map(key => [key, payload[key]])));
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('Demo registration cancelled.', 'AbortError');
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      if (simulateError) reject(new Error('Simulated registration failure.'));
      else resolve(receipt);
    }, 600);
    signal?.addEventListener('abort', onAbort, {once: true});
  });
}
