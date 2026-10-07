"""Verify source separation and report hosted access without following sign-in."""
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
HW = '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00'
MAIN = '712f4945faabd38e42f24bc50c7002baeadae47a'
BASELINE = '8aa4676e8f691b39e1e599c7335b9e70d628a2b9'
REPO = 'https://github.com/Aquarista01/24520039-DangHoaiAn-Lab1'
checks = []


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, timeout=55)


def check(name, passed, detail=None):
    checks.append({'name': name, 'passed': bool(passed), 'detail': detail})


heads = dict((ref.decode(), sha.decode()) for sha, ref in (line.split() for line in git('ls-remote', 'origin', 'refs/heads/main', 'refs/heads/hw-atomic-rebuild').splitlines()))
check('remote HW starting head is expected reviewed source', heads.get('refs/heads/hw-atomic-rebuild') == HW, heads)
check('remote main retains authorized Lab cleanup commit', heads.get('refs/heads/main') == MAIN)
check('local review starts from same HW head', git('rev-parse', 'HEAD').decode().strip() == HW)
paths = git('ls-tree', '-r', '--name-only', HW).decode().splitlines()
application = [p for p in paths if p in ['index.html', 'styles.css', 'app.js', 'events.js', 'vercel.json'] or p.startswith('assets/') or (p.startswith('homework/') and not p.endswith('README.md'))]
fingerprints = {}
for p in application:
    content = (ROOT / p).read_bytes()
    check('reviewed application unchanged: ' + p, content == git('show', HW + ':' + p))
    fingerprints[p] = hashlib.sha256(content).hexdigest()
for p in ['index.html', 'styles.css', 'app.js', 'events.js', 'assets/portrait.svg', 'assets/favicon.svg']:
    check('main Lab runtime equals original baseline: ' + p, git('show', MAIN + ':' + p) == git('show', BASELINE + ':' + p))
mainPaths = git('ls-tree', '-r', '--name-only', MAIN).decode().splitlines()
check('current main tree has no homework directory', not any(p.startswith('homework/') for p in mainPaths))
check('HW1 is on distinct branch; HW2/HW3 additionally have own directories', all(p in paths for p in ['homework/drum-kit/index.html', 'homework/event-hub/index.html']))
check('cleanup preserved previous main history', subprocess.run(['git', 'merge-base', '--is-ancestor', '66fe05a', MAIN], cwd=ROOT).returncode == 0)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def probe(url):
    try:
        response = urllib.request.build_opener(NoRedirect).open(url, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    except Exception as error:
        return {'url': url, 'error': str(error), 'applicationHeaderVerified': False}
    with response:
        location = response.headers.get('Location')
        target = urllib.parse.urlsplit(urllib.parse.urljoin(url, location)) if location else None
        redirected = bool(target)
        body = response.read() if not redirected else b''
        return {'url': url, 'status': response.status, 'redirectOriginAndPath': target.scheme + '://' + target.netloc + target.path if target else None, 'applicationHeaderVerified': False, 'applicationCsp': None, 'bodySha256': hashlib.sha256(body).hexdigest() if body else None, 'matchesOriginalLabHtml': bool(body) and body == git('show', BASELINE + ':index.html'), 'interpretation': 'Redirect response is not an app response; authentication headers are not HW CSP evidence.' if redirected else 'Production is the original Lab; it is not the separate Homework deployment.'}

preview = probe('https://24520039-8lc11t8jq-aquarista.vercel.app/')
production = probe('https://24520039.vercel.app/')
report = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'startingHomeworkHead': HW, 'mainHead': MAIN, 'labBaseline': BASELINE, 'repository': REPO, 'checks': checks, 'passed': all(c['passed'] for c in checks), 'applicationSha256': fingerprints, 'hosted': {'preview': preview, 'production': production}, 'studentReported': {'time': '2026-10-07 18:38 Asia/Ho_Chi_Minh', 'message': 'Ok rồi, bạn làm đi', 'scope': 'General OK after the final Preview check request; no raw listening, recorder/form capture, Lighthouse or response-header artifact supplied.'}, 'limits': ['This review preserves real history; the earlier one-shot commit can still be inspected in history.', 'Local enforced CSP tests do not certify Preview response headers.', 'Hosted access observations do not certify all interactive app behavior.']}
(ROOT / 'verification/final-review/branches-and-host.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'checks': len(checks), 'failures': [c for c in checks if not c['passed']], 'hosted': report['hosted']}, indent=2))
raise SystemExit(0 if report['passed'] else 1)
