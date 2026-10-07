// Bindings belong to HTML; this adapter only chooses which pad to activate.
export function bindKeyboard(pads, activatePad) {
  const bindings = new Map(Array.from(pads, pad => [pad.dataset.key, pad]));
  const handleKeydown = event => {
    if (event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey || event.altKey || event.metaKey) return;

    const target = event.target;
    if (target instanceof Element && (target.isContentEditable ||
        target.closest('input, textarea, select, [role="textbox"]'))) return;

    const pad = bindings.get(event.key.toLowerCase());
    if (!pad) return;
    event.preventDefault();
    void activatePad(pad);
  };
  document.addEventListener('keydown', handleKeydown);
  return () => document.removeEventListener('keydown', handleKeydown);
}
