from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def test_workflow_builds_and_deploys_github_pages_without_vps_runtime():
    text = (ROOT / '.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
    for needle in [
        'push:',
        'branches: [main]',
        'pull_request:',
        'workflow_dispatch:',
        'cron: "15 3 */3 * *"',
        'actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803',
        'actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97',
        'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
        'actions/upload-pages-artifact@7b1f4a764d45c48632c6b24a0339c27f5614fb0b',
        'actions/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745b',
        'actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e',
        'revision=$((GITHUB_RUN_NUMBER * 100 + GITHUB_RUN_ATTEMPT))',
        'letopis-map-export --config exporter/config.example.yml build --output build/map --revision "$revision"',
        'npm run test:run',
        'npm run build',
        'verify-pages.py',
        'Verify deployed CORS for Owlbear images',
        'access-control-allow-origin',
        'base="${{ steps.deployment.outputs.page_url }}"',
        'url="${base%/}/map/tiles/x_0_z_0.png"',
    ]:
        assert needle in text
    for forbidden in ['systemctl', '/var/www', 'sudo -u letopis-map', 'User=letopis-map']:
        assert forbidden not in text


def test_scheduled_workflow_keeps_public_repository_active_monthly():
    text = (ROOT / '.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
    for needle in [
        'name: Keep scheduled workflow active',
        "if: github.event_name == 'schedule'",
        'contents: write',
        '.map-sync-last-success',
        'git push origin HEAD:main',
    ]:
        assert needle in text


def test_repository_has_no_vps_deploy_directory():
    assert not (ROOT / 'deploy').exists()
    deploy = (ROOT / 'DEPLOY.md').read_text(encoding='utf-8')
    assert 'На VPS ничего устанавливать не нужно' in deploy


def test_extension_release_version_is_consistent():
    package = json.loads((ROOT / 'extension/package.json').read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'extension/public/manifest.json').read_text(encoding='utf-8'))
    assert package['version'] == manifest['version'] == '1.0.0'
