"""Run final suites sequentially to avoid port collisions and timing contention."""
import datetime
import hashlib
import json
import os
import sys
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
node = os.environ['CODEX_PRIMARY_RUNTIME_NODE']
python = os.environ['CODEX_PRIMARY_RUNTIME_PYTHON']
files = [
    'audio-assets.py', 'recorder-model.mjs', 'countdown-model.mjs',
    'form-service.mjs', 'form-validator.mjs', 'audit-evidence.py',
    'portfolio-a11y.mjs', 'portfolio-keyboard.mjs', 'portfolio-csp.mjs',
    'audio-browser.mjs', 'drum-keyboard.mjs', 'recorder-browser.mjs',
    'countdown-browser.mjs', 'form-input.mjs', 'form-native.mjs',
    'form-lifecycle.mjs', 'navigation.mjs', 'portfolio-lighthouse.mjs',
]
results = []
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
remaining = files
if '--resume' in sys.argv:
    previous = json.loads((HERE / 'run-manifest.json').read_text())
    started = previous['started']
    for r in previous['results']:
        if r['exitCode']:
            break
        assert r['scriptSha256'] == hashlib.sha256((HERE / r['script']).read_bytes()).hexdigest()
        results.append(r)
    remaining = files[len(results):]
for file in remaining:
    print('RUN ' + file, flush=True)
    now = datetime.datetime.now(datetime.timezone.utc)
    result = subprocess.run([python if file.endswith('.py') else node, str(HERE / file)], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=240)
    print(result.stdout, flush=True)
    results.append({'script': file, 'scriptSha256': hashlib.sha256((HERE / file).read_bytes()).hexdigest(), 'started': now.isoformat(), 'elapsedSeconds': (datetime.datetime.now(datetime.timezone.utc)-now).total_seconds(), 'exitCode': result.returncode, 'console': result.stdout})
    (HERE / 'run-manifest.json').write_text(json.dumps({'started': started, 'results': results, 'complete': len(results) == len(files), 'passed': len(results) == len(files) and all(r['exitCode'] == 0 for r in results)}, indent=2) + '\n')
    if result.returncode:
        print('Stopped at failed suite; recorded output is preserved.', flush=True)
        raise SystemExit(result.returncode)
