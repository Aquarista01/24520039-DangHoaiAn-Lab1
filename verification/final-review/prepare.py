"""Create fresh, reviewable copies of milestone suites; never overwrite evidence."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'verification/final-review'
BASELINE = '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00'
SOURCES = [
    ('hw1-m1/audit.mjs', 'portfolio-a11y.mjs'),
    ('hw1-m2/audit.mjs', 'portfolio-keyboard.mjs'),
    ('hw1-m3/audit.mjs', 'portfolio-csp.mjs'),
    ('hw1-m4/audit.mjs', 'portfolio-lighthouse.mjs'),
    ('hw2-step2/assets.py', 'audio-assets.py'),
    ('hw2-step2/audit.mjs', 'audio-browser.mjs'),
    ('hw2-step3/audit.mjs', 'drum-keyboard.mjs'),
    ('hw2-step4/model-check.mjs', 'recorder-model.mjs'),
    ('hw2-step4/audit.mjs', 'recorder-browser.mjs'),
    ('hw3-step2/model-check.mjs', 'countdown-model.mjs'),
    ('hw3-step2/audit.mjs', 'countdown-browser.mjs'),
    ('hw3-step3/service-check.mjs', 'form-service.mjs'),
    ('hw3-step5/validation-check.mjs', 'form-validator.mjs'),
    ('hw3-step5/browser-check.mjs', 'form-input.mjs'),
    ('hw3-step5/regression.mjs', 'form-native.mjs'),
    ('hw3-step5/lifecycle-check.mjs', 'form-lifecycle.mjs'),
    ('hw3-audit/check-evidence.py', 'audit-evidence.py'),
    ('homework-navigation/audit.mjs', 'navigation.mjs'),
]


def replace(source, old, new):
    assert old in source, old
    return source.replace(old, new)


manifest = []
for relative, target in SOURCES:
    original = (ROOT / 'verification' / relative).read_text()
    source = original
    if relative.startswith('hw1-m1/'):
        source = source.replace("root+'/verification/hw1-m1'", "root+'/verification/final-review'")
        source = replace(source, '${root}/verification/hw1-m1/${phase}.json', '${root}/verification/final-review/portfolio-a11y.json')
    elif relative.startswith('hw1-m2/'):
        source = source.replace("'verification/hw1-m2'", "'verification/final-review'")
        source = replace(source, 'verification/hw1-m2/${phase}.json', 'verification/final-review/portfolio-keyboard.json')
        source = replace(source, "['about','skills','projects','events','contact']", "['about','skills','projects','homework','events','contact']")
        source = replace(source, "...['loading','ready','empty','error'].map", "'#homework a[href=\"homework/drum-kit/\"]','#homework a[href=\"homework/event-hub/\"]',...['loading','ready','empty','error'].map")
        source = replace(source, 'all 22 targets', 'all 25 targets')
        source = replace(source, 'i<8;i++', 'i<9;i++')
        source = replace(source, 'i<7;i++', 'i<8;i++')
        source = replace(source, 'i<17;i++', 'i<20;i++')
    elif relative.startswith('hw1-m3/'):
        source = source.replace("'verification/hw1-m3'", "'verification/final-review'")
        source = replace(source, 'verification/hw1-m3/${phase}.json', 'verification/final-review/portfolio-csp.json')
    elif relative.startswith('hw1-m4/'):
        source = replace(source, "'verification/hw1-m4'", "'verification/final-review'")
        source = source.replace('JSON.stringify(result.lhr,null,2)', 'JSON.stringify(result.lhr)')
    elif relative == 'hw3-step2/audit.mjs':
        source = replace(source, "'form remains idle/disabled and receipt hidden', dom.formState === 'idle' && dom.buttons.every(Boolean)", "'completed form initializes idle with Submit/Reset enabled, Cancel disabled and receipt hidden', dom.formState === 'idle' && !dom.buttons[0] && dom.buttons[1] && !dom.buttons[2]")
        source = replace(source, "await badPage.locator('#submit-btn').isDisabled());", "await badPage.locator('#submit-btn').isEnabled());")
        source = replace(source, 'Form controller/registration remains a later package.', 'Completed form behavior is checked by the separate final form suites.')
    if relative == 'hw2-step2/audit.mjs':
        source = replace(source, "check('letter key has no adapter at this stage', await page.evaluate(() => window.__voices.length) === keyStart);", "check('completed letter-key adapter adds exactly one native voice', await page.evaluate(() => window.__voices.length) === keyStart + 1);\n    const nativeStart = keyStart + 1;")
        source = replace(source, 'start + 1, keyStart)', 'start + 1, nativeStart)')
        source = replace(source, 'start + 2, keyStart)', 'start + 2, nativeStart)')
        source = replace(source, '.slice(keyStart).length === 2', '.slice(nativeStart).length === 2')
        source = replace(source, "check('recorder contract remains static', await page.evaluate(() => document.querySelector('#tape-state').textContent === 'Idle' && document.querySelector('#beat-count').textContent === '0' && document.querySelector('#beat-list').children.length === 0 && ['stop-btn', 'replay-btn', 'clear-btn'].every(id => document.getElementById(id).disabled)));", "const recording = await page.evaluate(() => document.querySelector('#tape-state').textContent === 'Recording' && document.querySelector('#beat-count').textContent === '0' && document.querySelector('#beat-list').children.length === 0 && !document.getElementById('stop-btn').disabled && ['replay-btn', 'clear-btn'].every(id => document.getElementById(id).disabled));\n    await page.locator('#stop-btn').click();\n    check('completed recorder starts/stops an empty take without adding audio hits', recording && await page.evaluate(() => document.querySelector('#tape-state').textContent === 'Idle' && ['stop-btn', 'replay-btn', 'clear-btn'].every(id => document.getElementById(id).disabled)));")
    if relative == 'hw2-step3/audit.mjs':
        source = replace(source, "'recorder is still static; semantic structure and width preserved', state.tape === 'Idle'", "'completed recorder enters Recording; semantic structure and width preserved', state.tape === 'Recording'")
    if relative == 'hw3-step5/browser-check.mjs':
        source = replace(source, "'./browser-fixture.mjs'", "'../hw3-step5/browser-fixture.mjs'")
    if relative == 'hw3-step2/model-check.mjs':
        source = replace(source, "'model-result.json'", "'countdown-model.json'")
    if relative == 'hw3-step3/service-check.mjs':
        source = replace(source, "'service-result.json'", "'form-service.json'")
    if relative == 'hw3-step5/validation-check.mjs':
        source = replace(source, "'./validation-result.json'", "'./form-validator.json'")
    if relative == 'hw3-audit/check-evidence.py':
        source = replace(source, "(ROOT / 'verification/hw3-audit/result.json').write_text", "(ROOT / 'verification/final-review/audit-evidence.json').write_text")
        source = source.replace("commit, 'c9a30f2'", "commit, '" + BASELINE + "'")
        source = source.replace("git('rev-parse', 'c9a30f2')", "git('rev-parse', '" + BASELINE + "')")
    else:
        outputs = {
            'hw2-step2/assets.json': 'audio-assets.json',
            'hw2-step2/result.json': 'audio-browser.json',
            'hw2-step3/result.json': 'drum-keyboard.json',
            'hw2-step4/model-result.json': 'recorder-model.json',
            'hw2-step4/result.json': 'recorder-browser.json',
            'hw3-step2/result.json': 'countdown-browser.json',
            'hw3-step5/browser-result.json': 'form-input.json',
            'hw3-step5/regression-result.json': 'form-native.json',
            'hw3-step5/lifecycle-result.json': 'form-lifecycle.json',
            'homework-navigation/result.json': 'navigation.json',
        }
        for old, new in outputs.items():
            source = source.replace('verification/' + old, 'verification/final-review/' + new)
    # Production audio is observed; the separate manual OK is not machine evidence.
    source = source.replace('Student listening remains pending.', 'Student reported Preview OK on 7 October; no raw listening capture was supplied.')
    source = source.replace('real laptop listening remains pending.', 'student reported Preview OK; no raw listening capture was supplied.')
    source = source.replace('Step 2 student Kick/Low tom listening remains pending.', 'student reported Preview OK; no raw listening capture was supplied.')
    source = source.replace('No letter-key adapter or recorder behavior is implemented.', 'Keyboard and recorder behavior are checked by separate final suites.')
    source = source.replace('No recorder behavior is implemented.', 'Recorder behavior is checked by separate final suites.')
    source = source.replace('Student reported prior Preview checks OK; no student recorder test or timed live defense is claimed.', 'Student reported the final Preview OK on 7 October; no raw recorder capture or timed live defense was supplied.')
    source = re.sub(r"baseline(Commit)?:\s*'[a-f0-9]{7,40}'", lambda m: "baseline" + (m.group(1) or '') + ": '" + BASELINE + "'", source)
    banner = ('# ' if target.endswith('.py') else '// ') + f'Final review copy of verification/{relative}; adaptations documented in prepare.py.\n'
    source = banner + source
    (OUT / target).write_text(source)
    manifest.append({'source': 'verification/' + relative, 'target': target, 'originalSha256': hashlib.sha256(original.encode()).hexdigest(), 'derivedSha256': hashlib.sha256(source.encode()).hexdigest()})
(OUT / 'suite-sources.json').write_text(json.dumps({'baseline': BASELINE, 'suites': manifest}, indent=2) + '\n')
print(f'Prepared {len(manifest)} suites; original evidence unchanged.')
