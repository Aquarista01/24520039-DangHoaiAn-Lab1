// Browser-only QA observers, used before the production modules load.
export async function instrument(page) {
  await page.addInitScript(() => {
    window.__ownedTimers = new Map(); window.__timerHistory = [];
    window.__serviceCalls = 0; window.__serviceSignals = [];
    window.__unhandled = []; window.__violations = [];
    const schedule = setTimeout.bind(window), cancel = clearTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => {
      const owned = /\/registration(?:-service)?\.js:/.test(new Error().stack);
      const id = schedule(() => {window.__ownedTimers.delete(id); callback(...args);}, delay);
      if (owned) {const task = {id, delay, callback}; window.__ownedTimers.set(id, task); window.__timerHistory.push(task);}
      return id;
    };
    window.clearTimeout = id => {window.__ownedTimers.delete(id); cancel(id);};
    const formRecords = new Map(), abortRecords = new Map();
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    const record = (target, type, listener, options, adding) => {
      const records = target instanceof AbortSignal && type === 'abort' ? abortRecords :
        target instanceof HTMLElement && ['registration-form', 'cancel-btn'].includes(target.id) ? formRecords : null;
      if (!records) return;
      if (!records.has(target)) records.set(target, new Map());
      const key = `${type}:${Boolean(options === true || options?.capture)}`;
      if (!records.get(target).has(key)) records.get(target).set(key, new Set());
      const listeners = records.get(target).get(key);
      if (adding) listeners.add(listener); else listeners.delete(listener);
    };
    EventTarget.prototype.addEventListener = function(type, listener, options) {record(this, type, listener, options, true); return add.call(this, type, listener, options);};
    EventTarget.prototype.removeEventListener = function(type, listener, options) {record(this, type, listener, options, false); return remove.call(this, type, listener, options);};
    const count = records => [...records.values()].reduce((sum, types) => sum + [...types.values()].reduce((total, listeners) => total + listeners.size, 0), 0);
    window.__formListenerCount = () => count(formRecords);
    window.__abortListenerCount = () => count(abortRecords);
    document.addEventListener('securitypolicyviolation', event => window.__violations.push(event.effectiveDirective));
    window.addEventListener('unhandledrejection', event => window.__unhandled.push(String(event.reason)));
  });
}
