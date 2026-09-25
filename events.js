const SAMPLE_EVENTS = [
  { title: 'Build for everyone', date: '12 October 2026', location: 'UIT Campus', type: 'Workshop' },
  { title: 'Design systems lab', date: '19 October 2026', location: 'Online', type: 'Community' },
  { title: 'Web foundations meetup', date: '28 October 2026', location: 'Ho Chi Minh City', type: 'Meetup' },
];

const panel = document.querySelector('#event-status');
const controls = document.querySelectorAll('.demo-controls [data-state]');
let requestToken = 0;

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value) element.textContent = value;
  return element;
}

function renderEvents(state, events = []) {
  panel.replaceChildren();
  panel.setAttribute('aria-busy', String(state === 'loading'));
  controls.forEach((control) => control.setAttribute('aria-pressed', String(control.dataset.state === state)));

  if (state === 'loading') {
    panel.append(node('h3', '', 'Finding upcoming events…'));
    const grid = node('section', 'skeleton-grid');
    grid.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 3; index += 1) grid.append(node('span', 'skeleton-item'));
    panel.append(grid);
    return;
  }

  if (state === 'ready') {
    panel.append(node('h3', '', `${events.length} upcoming events`));
    const list = node('ul', 'event-list');
    events.forEach((event) => {
      const item = node('li', 'event-item');
      const badge = node('span', 'badge', event.type);
      const title = node('h4', '', event.title);
      const meta = node('p', 'event-meta');
      meta.append(node('span', '', event.date), node('span', '', event.location));
      item.append(badge, title, meta);
      list.append(item);
    });
    panel.append(list);
    return;
  }

  if (state === 'empty') {
    panel.append(node('span', 'state-symbol', '○'));
    panel.append(node('h3', '', 'Nothing on the calendar yet'));
    panel.append(node('p', '', 'Check back later for new community events.'));
    return;
  }

  if (state === 'error') {
    panel.append(node('span', 'state-symbol', '!'));
    panel.append(node('h3', '', 'We could not load the events'));
    panel.append(node('p', '', 'The connection might be interrupted. Please try again.'));
    const retry = node('button', 'retry-button', 'Retry loading');
    retry.type = 'button';
    retry.addEventListener('click', showLoadingThenReady);
    panel.append(retry);
  }
}

function showLoadingThenReady() {
  const current = ++requestToken;
  renderEvents('loading');
  window.setTimeout(() => {
    if (current === requestToken) renderEvents('ready', SAMPLE_EVENTS);
  }, 850);
}

function initializeEventHub() {
  controls.forEach((control) => {
    control.addEventListener('click', () => {
      const state = control.dataset.state;
      if (state === 'loading') showLoadingThenReady();
      if (state === 'ready') { requestToken += 1; renderEvents('ready', SAMPLE_EVENTS); }
      if (state === 'empty' || state === 'error') { requestToken += 1; renderEvents(state); }
    });
  });
  showLoadingThenReady();
}

export { initializeEventHub, renderEvents };
