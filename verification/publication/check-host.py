"""Anonymous HTTPS source/header check of the student-supplied HW deployment."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
BASE = 'https://24520039-8lc11t8jq-aquarista.vercel.app'
DEPLOYED = '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00'
REVIEW = 'a0396d4dd5111595e593f14c4a3e994f653bcc4d'
MAIN = '712f4945faabd38e42f24bc50c7002baeadae47a'
checks = []


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, timeout=55)


def check(name, passed, detail=None):
    checks.append({'name': name, 'passed': bool(passed), 'detail': detail})


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


policy = next(h['value'] for rule in json.loads((ROOT / 'vercel.json').read_text())['headers'] for h in rule['headers'] if h['key'].lower() == 'content-security-policy')
paths = git('ls-tree', '-r', '--name-only', DEPLOYED).decode().splitlines()
runtime = [p for p in paths if p in ['index.html', 'styles.css', 'app.js', 'events.js'] or p.startswith('assets/') or (p.startswith('homework/') and Path(p).suffix in ['.html', '.css', '.js', '.wav'])]
items = [(('/' if p == 'index.html' else '/' + p), p) for p in runtime]
items += [('/index.html', 'index.html'), ('/homework/drum-kit/', 'homework/drum-kit/index.html'), ('/homework/event-hub/', 'homework/event-hub/index.html')]


def fetch(item):
    route, source = item
    url = BASE + route
    started = datetime.datetime.now(datetime.timezone.utc)
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'HW-publication-verification/1.0'})
        try:
            response = urllib.request.build_opener(NoRedirect).open(request, timeout=20)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read()
            location = response.headers.get('Location')
            target = urllib.parse.urlsplit(urllib.parse.urljoin(url, location)) if location else None
            return {'route': route, 'source': source, 'requestedAt': started.isoformat(), 'status': response.status, 'redirectOriginAndPath': target.scheme + '://' + target.netloc + target.path if target else None, 'contentType': response.headers.get('Content-Type'), 'csp': response.headers.get('Content-Security-Policy'), 'xContentTypeOptions': response.headers.get('X-Content-Type-Options'), 'bodyBytes': len(body), 'bodySha256': hashlib.sha256(body).hexdigest(), 'sourceSha256': hashlib.sha256((ROOT / source).read_bytes()).hexdigest(), 'matchesSource': body == (ROOT / source).read_bytes(), 'cookieOrAuthenticationSent': False}
    except Exception as error:
        return {'route': route, 'source': source, 'requestedAt': started.isoformat(), 'error': str(error), 'cookieOrAuthenticationSent': False}


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    responses = list(pool.map(fetch, items))
for r in responses:
    check(r['route'] + ': HTTP 200 without sign-in redirect', r.get('status') == 200 and r.get('redirectOriginAndPath') is None, r.get('error'))
    check(r['route'] + ': exact application CSP response header', r.get('csp') == policy)
    check(r['route'] + ': deployed bytes match reviewed application', r.get('matchesSource') is True)
check('runtime source unchanged between deployment and final review', all(git('show', DEPLOYED + ':' + p) == git('show', REVIEW + ':' + p) for p in runtime))
check('current local application matches final review source', all((ROOT / p).read_bytes() == git('show', REVIEW + ':' + p) for p in runtime))

api = 'https://api.github.com/repos/Aquarista01/24520039-DangHoaiAn-Lab1/deployments?sha=' + DEPLOYED
metadata = []
try:
    with urllib.request.urlopen(api, timeout=20) as response:
        deployments = json.load(response)
    for deployment in deployments:
        with urllib.request.urlopen(deployment['statuses_url'], timeout=20) as response:
            statuses = json.load(response)
        status = next((s for s in statuses if s.get('environment_url', '').rstrip('/') == BASE), None)
        if status:
            metadata.append({'deploymentId': deployment['id'], 'sha': deployment['sha'], 'ref': deployment.get('ref'), 'environment': deployment.get('environment'), 'deploymentCreatedAt': deployment['created_at'], 'status': status['state'], 'statusCreatedAt': status['created_at'], 'environmentUrl': status['environment_url']})
    check('GitHub deployment metadata identifies this Preview at reviewed app commit', any(m['sha'] == DEPLOYED and m['status'] == 'success' for m in metadata), metadata)
except Exception as error:
    metadata = [{'error': str(error)}]
    check('GitHub deployment metadata readable', False, str(error))

heads = dict((ref.decode(), sha.decode()) for sha, ref in (line.split() for line in git('ls-remote', 'origin', 'refs/heads/main', 'refs/heads/hw-atomic-rebuild').splitlines()))
check('Homework starting remote head is final review commit', heads.get('refs/heads/hw-atomic-rebuild') == REVIEW, heads)
check('main still retains separate Lab cleanup head', heads.get('refs/heads/main') == MAIN)
report = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'tester': 'Assistant: fresh anonymous HTTPS GET checks using system TLS verification, no session/cookies/authentication and no redirects followed', 'deploymentBase': BASE, 'deployedApplicationCommit': DEPLOYED, 'finalReviewCommit': REVIEW, 'startingRemoteHeads': heads, 'expectedCsp': policy, 'runtimeFiles': runtime, 'responses': responses, 'deploymentMetadata': metadata, 'checks': checks, 'passed': all(c['passed'] for c in checks), 'studentReported': {'time': '2026-10-07 19:25 Asia/Ho_Chi_Minh', 'message': 'Ok, mình tắt rồi, mở xem được rồi', 'scope': 'Student reports disabling protection and opening the page; no raw screenshot/header artifact supplied.'}, 'limits': ['This is HTTP source/header and deployment-provenance verification, not a fresh hosted browser interaction, Lighthouse, axe or audio-listening run.', 'Final local application tests remain separately timestamped in verification/final-review; no previous result is relabeled as a hosted test.', 'This URL is a specific deployment, not a promise that it automatically tracks future branch commits.', 'Shared AI conversation URL and required student submission captures are still missing.']}
(ROOT / 'verification/publication/result.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'assertions': len(checks), 'httpResponses': len(responses), 'runtimeFiles': len(runtime), 'deploymentMetadata': metadata, 'failures': [c for c in checks if not c['passed']]}, indent=2))
raise SystemExit(0 if report['passed'] else 1)
