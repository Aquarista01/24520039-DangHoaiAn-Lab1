"""Read-only checks of audit evidence/source; not an application test rerun."""
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
checks = []


def check(name, passed, detail=None):
    checks.append({'name': name, 'passed': bool(passed), 'detail': detail})


def read(path):
    return json.loads((ROOT / path).read_text())


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True)


def source(commit, path):
    return git('show', f'{commit}:{path}')


report = (ROOT / 'AI_FAILURE_AUDIT.md').read_text()
paths = re.findall(r'\]\(([^)]+)\)', report)
local = [p for p in paths if not p.startswith('https://')]
output = 'verification/hw3-audit/result.json'
sources = [p for p in local if p != output]
check('all report historical/source file links resolve', all((ROOT / p).is_file() for p in sources), sorted(set(sources)))
check('report integrity-result link targets this checker output', output in local)
commits = ['cdc93ec', '42bd2f6', 'a17b2d0', 'd976694']
for commit in commits:
    check(f'{commit}: fix is ancestor of starting application HEAD', subprocess.run(['git', 'merge-base', '--is-ancestor', commit, 'c9a30f2'], cwd=ROOT).returncode == 0)

before = read('verification/hw1-m1/before.json')
after = read('verification/hw1-m1/after.json')
check('A1: 16 before configurations each identify four label mismatch nodes', len(before['audits']) == 16 and all(sum(len(v['nodes']) for v in a['violations'] if v['id'] == 'label-content-name-mismatch') == 4 for a in before['audits']))
check('A1: 16 after configurations have zero violations', len(after['audits']) == 16 and all(not a['violations'] for a in after['audits']) and not after['errors'])
old, new = source('c62400a', 'index.html'), source('cdc93ec', 'index.html')
check('A1: failing planning HTML matches original baseline', old == source('8aa4676', 'index.html'))
check('A1: old overriding labels changed in HTML fix', 'aria-label="View responsive skills section"' in old and 'aria-label="View responsive skills section"' not in new and 'Explore' in new)

before2 = read('verification/hw1-m2/before.json')
after2 = read('verification/hw1-m2/after.json')
for label, data, failed in [('before', before2, 54), ('after', after2, 0)]:
    assertions = [c for case in data['cases'] for c in case['checks']]
    check(f'A2: {label} exact 20 configurations/160 assertions/{failed} failures', len(data['cases']) == 20 and len(assertions) == 160 and sum(not c['passed'] for c in assertions) == failed)
check('A2: after has no uncaught page errors', all(not case['errors'] for case in after2['cases']))
old, new = source('cdc93ec', 'app.js'), source('42bd2f6', 'app.js')
check('A2: old storage write precedes state update', old.index("localStorage.setItem('theme', nextTheme)") < old.index("updateThemeButton(nextTheme === 'dark')"))
check('A2: fixed state update precedes guarded optional write', new.index("updateThemeButton(nextTheme === 'dark')") < new.index("localStorage.setItem('theme', nextTheme)") and 'function readStoredTheme()' in new and new.count('catch') == 2)

before3 = read('verification/hw2-step4/before-feedback-fix.json')
after3 = read('verification/hw2-step4/result.json')
ratios = []
for case in before3['cases']:
    for audit in case['axeResults']:
        for violation in audit['violations']:
            for node in violation['nodes']:
                for rule in node['any']:
                    if violation['id'] == 'color-contrast':
                        ratios.append({'width': case['width'], 'theme': case['theme'], 'state': audit['name'], 'ratio': rule['data']['contrastRatio']})
check('A3: four Recording failures record exact theme ratios', len(ratios) == 4 and all(r['state'] == 'recording' and r['ratio'] == (1.2 if r['theme'] == 'light' else 1.48) for r in ratios), ratios)
old, new = source('18fc999', 'homework/drum-kit/styles.css'), source('a17b2d0', 'homework/drum-kit/styles.css')
check('A3: fix removes only background transition from feedback property', 'transition: transform 100ms ease, background-color 100ms ease;' in old and 'transition: transform 100ms ease;' in new and 'background-color 100ms ease' not in new)
check('A3: exact 92 native/6 integration assertions pass', sum(len(c['checks']) for c in after3['cases']) == 92 and len(after3['integrationChecks']) == 6 and after3['passed'] and all(c['passed'] for x in after3['cases'] for c in x['checks']) and all(x['passed'] for x in after3['integrationChecks']))
check('A3: 20 normal plus one capped-list audits have zero violations', sum(len(c['axeResults']) for c in after3['cases']) == 20 and all(not a['violations'] for c in after3['cases'] for a in c['axeResults']) and len([x for x in after3['integrationChecks'] if x['name'] == 'capped-list axe and error handling' and not x['violations']]) == 1)

before4 = read('verification/hw3-step2/before-boundary-fix.json')
after4 = read('verification/hw3-step2/model-result.json')
snapshot = before4['failingSource']
check('A4: saved failing source SHA-256 matches actual bytes', hashlib.sha256(snapshot['content'].encode()).hexdigest() == snapshot['sha256'] == '120b71a130c4e77e78976780009017e25516082791d8acb6f013a8e3a2aab2a6')
check('A4: before 45/46 and failed overhead delay 950', len(before4['checks']) == 46 and sum(c['passed'] for c in before4['checks']) == 45 and any(not c['passed'] and (c.get('detail', {}) if isinstance(c.get('detail', {}), dict) else {}).get('scheduledDelay') == 950 for c in before4['checks']))
check('A4: after 47/47 includes zero-delay and one-second correction', len(after4['checks']) == 47 and all(c['passed'] for c in after4['checks']) and any((c.get('detail', {}) if isinstance(c.get('detail', {}), dict) else {}).get('scheduledDelay') == 0 for c in after4['checks']) and any(c['name'] == 'immediate overhead correction emits current one-second value' and c['passed'] for c in after4['checks']))
new = source('d976694', snapshot['path'])
check('A4: saved faulty scheduler differs from committed corrected formula', 'Math.ceil(remaining / 1000)' in snapshot['content'] and 'remaining - (totalSeconds - 1) * 1000' in new and snapshot['content'] != new)
check('A4: static parent has no countdown module (not misattributed)', subprocess.run(['git', 'cat-file', '-e', '6b8a607:homework/event-hub/countdown.js'], cwd=ROOT, stderr=subprocess.DEVNULL).returncode != 0)

historical = [
    ('verification/hw1-m1/before.json', before, after),
    ('verification/hw1-m2/before.json', before2, after2),
    ('verification/hw2-step4/before-feedback-fix.json', before3, after3),
    ('verification/hw3-step2/before-boundary-fix.json', before4, after4),
]
for path, first, final in historical:
    check(f'{path}: historical dates preserved and before precedes after', first['date'] in report and final['date'] in report and datetime.fromisoformat(first['date'].replace('Z', '+00:00')) < datetime.fromisoformat(final['date'].replace('Z', '+00:00')))

latest = [read('verification/hw3-step5/' + p) for p in ['validation-result.json', 'browser-result.json', 'regression-result.json', 'lifecycle-result.json']]
count = sum(len(r.get('checks', [])) + sum(len(c['checks']) for c in r.get('cases', [])) for r in latest)
check('current cited Step 5 results total 429 passing assertions', count == 429 and all(r['passed'] for r in latest))
audits = latest[1]['audits'] + [a for c in latest[2]['cases'] for a in c['audits']]
check('current cited Step 5 results contain 40 zero-violation/incomplete audits', len(audits) == 40 and all(not a['violations'] and not a['incomplete'] for a in audits))

fingerprints = {}
for path in sorted(set(p for p in sources if p.endswith('.json'))):
    fingerprints[path] = hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
result = {'date': datetime.now(timezone.utc).isoformat(), 'tester': 'Assistant: fresh read-only report/evidence/source integrity check', 'startingCommit': git('rev-parse', 'c9a30f2').strip(), 'method': 'Read original JSON, Git blobs/ancestry and report links; no browser/application suite rerun and no historical evidence modification.', 'checks': checks, 'passed': all(c['passed'] for c in checks), 'evidenceSha256': fingerprints}
(ROOT / 'verification/hw3-audit/result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed': result['passed'], 'checks': len(checks), 'failures': [c for c in checks if not c['passed']]}, indent=2))
raise SystemExit(0 if result['passed'] else 1)
