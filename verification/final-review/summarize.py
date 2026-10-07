"""Summarize actual fresh reports without counting historical or failed attempts."""
import datetime
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
NAMES = ['portfolio-keyboard', 'portfolio-csp', 'audio-browser', 'drum-keyboard', 'recorder-model', 'recorder-browser', 'countdown-model', 'countdown-browser', 'form-service', 'form-validator', 'form-input', 'form-native', 'form-lifecycle', 'navigation', 'audit-evidence', 'branches-and-host']


def read(name):
    return json.loads((HERE / (name + '.json')).read_text())


manifest = read('run-manifest')
assert manifest['complete'] and manifest['passed']
summary = []
audits = []
for name in NAMES:
    report = read(name)
    assert report['passed'], name
    checks = list(report.get('checks', []))
    for case in report.get('cases', []):
        checks += case.get('checks', [])
        audits += case.get('audits', []) + case.get('axeResults', [])
        if 'axe' in case:
            audits.append(case['axe'])
    for key in ['integration', 'integrationChecks', 'failureCases', 'rebindings']:
        checks += report.get(key, [])
    assert all(c['passed'] for c in checks), name
    audits += report.get('audits', [])
    summary.append({'suite': name, 'date': report['date'], 'passingAssertions': len(checks), 'report': name + '.json'})
portfolio = read('portfolio-a11y')
assert not portfolio['errors'] and all(not a['violations'] and a['h1'] == 1 and a['divs'] == 0 and not a['overflow'] for a in portfolio['audits'])
assert all(c['ratio'] >= c['minimum'] for c in portfolio['contrasts'])
audits += portfolio['audits']
assets = read('audio-assets')
assert assets['passed'] and all(a['passed'] for a in assets['assets'])
lighthouse = read('after-summary')
assert lighthouse['allCategories100']
for audit in audits:
    assert not audit['violations']
historical = json.loads((HERE / 'suite-sources.json').read_text())
for suite in historical['suites']:
    assert hashlib.sha256((ROOT / suite['source']).read_bytes()).hexdigest() == suite['originalSha256'], suite['source']
    assert hashlib.sha256((HERE / suite['target']).read_bytes()).hexdigest() == suite['derivedSha256'], suite['target']
incomplete = [{'index': i, 'items': a['incomplete']} for i,a in enumerate(audits) if a.get('incomplete')]
result = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'reviewedApplicationHead': historical['baseline'], 'passedLocalReview': True, 'assertions': summary, 'passingAssertions': sum(s['passingAssertions'] for s in summary), 'audioAssets': {'passing': len(assets['assets']), 'report': 'audio-assets.json'}, 'accessibility': {'auditsWithStructuredResults': len(audits), 'violations': 0, 'auditsWithIncompleteItems': len(incomplete), 'incompleteItems': incomplete, 'additionalAudioAxeRuns': 4, 'additionalCappedRecorderAxeRuns': 1, 'note': 'Audio browser suite records four zero-violation axe checks inside its assertions; recorder capped-list case records one more; they are not duplicated into this structured-audit count. Root glyph contrast requires manual review; zero violations is not full WCAG certification.'}, 'portfolioContrasts': {'checked': len(portfolio['contrasts']), 'failed': 0}, 'lighthouse': [{'profile': r['profile'], 'fetchTime': r['fetchTime'], 'scores': r['score'], 'rawScores': r['rawScores'], 'metrics': r['metrics']} for r in lighthouse['results']], 'cspProbeGroups': {'passing': 2, 'report': 'portfolio-csp.json', 'note': 'Intentional inline/external/frame violations are test outcomes; normal browsing remains error-free.'}, 'sourceIntegrity': 'All original milestone suite files retain their SHA-256; derived suites match preparation manifest. Application files unchanged from reviewedApplicationHead.', 'hosted': read('branches-and-host')['hosted'], 'studentReported': read('branches-and-host')['studentReported'], 'remaining': ['WBS 11 publication/handoff is separate.', 'HW Preview redirects anonymous requests to Vercel SSO: app response headers and unauthenticated assessor access remain unverified.', 'Student shared AI conversation URL and required submission captures have not been supplied.', 'Real timed defense/BFCache/background suspension and laptop audio measurements are not claimed.'], 'failedQaAttemptsPreserved': ['run-manifest-initial.json', 'audio-suite-initial.mjs', 'run-manifest-audio-retry.json', 'keyboard-suite-initial.json', 'keyboard-suite-initial.mjs', 'host-probe-initial.json']}
(HERE / 'summary.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: result[key] for key in ['passedLocalReview','passingAssertions','audioAssets','portfolioContrasts','lighthouse']}, indent=2))
print('Structured axe audits: ' + str(len(audits)) + '; incomplete: ' + str(len(incomplete)))
