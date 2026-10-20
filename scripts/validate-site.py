"""Smoke-test the published bundle at a GitHub Pages project subpath."""
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen
import json

ROOT = Path(__file__).resolve().parent.parent / 'dist'
PREFIX = '/bitcoin-biz-map/'

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith(PREFIX):
            self.send_error(404)
            return
        self.path = '/' + self.path[len(PREFIX):]
        super().do_GET()

    def log_message(self, *args):
        pass

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        field = 'src' if tag == 'script' else 'href' if tag == 'link' else None
        value = attrs.get(field, '') if field else ''
        if value and not urlparse(value).scheme and not value.startswith('//'):
            assert not value.startswith('/'), f'Asset escapes Pages subpath: {value}'
            self.paths.append(value)

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    home = f'http://127.0.0.1:{server.server_port}{PREFIX}'
    with urlopen(home) as response:
        assert response.status == 200
        html = response.read().decode()
    assert 'Sats in the Sun' in html
    assert 'signin-with-chatgpt' not in html
    parser = Assets()
    parser.feed(html)
    assert len(parser.paths) >= 6, 'Expected local script and stylesheet assets'
    for asset in parser.paths + ['merchants.json', 'vendor/Leaflet-LICENSE.txt', 'vendor/MarkerCluster-LICENSE.txt']:
        with urlopen(urljoin(home, asset)) as response:
            assert response.status == 200
            assert len(response.read()) > 100, f'Empty asset: {asset}'
    with urlopen(urljoin(home, 'merchants.json')) as response:
        merchants = json.load(response)['merchants']
        assert merchants == json.loads((ROOT / 'merchants.json').read_text())['merchants']
    assert not (ROOT / '.openai').exists(), 'Hosting metadata must not be public'
    assert not any(p.is_symlink() for p in ROOT.rglob('*')), 'Pages bundle cannot contain symlinks'
    print(f'Pages smoke test passed: home, relative assets, licenses, and all {len(merchants)} listings work at /bitcoin-biz-map/.')
finally:
    server.shutdown()
    server.server_close()
