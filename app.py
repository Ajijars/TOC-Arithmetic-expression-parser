import http.server
import socketserver
import webbrowser
import json
import urllib.parse
import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from parser import ArithmeticParser

DEFAULT_PORT = 5000


class ParserHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        directory = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=directory, **kwargs)

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """API endpoint to parse expression using parser.py."""
        if self.path == '/api/parse':
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length).decode('utf-8', errors='replace')
            try:
                data = json.loads(post_body) if post_body else {}
                expression = data.get('expression', '')
            except Exception:
                expression = ''

            self._process_and_respond(expression)
        else:
            super().do_POST()

    def do_GET(self):
        """Handle GET requests for both static files and /api/parse."""
        if self.path.startswith('/api/parse'):
            parsed = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed.query)
            expression = query.get('expr', [''])[0]
            self._process_and_respond(expression)
        else:
            super().do_GET()

    def _process_and_respond(self, expression: str):
        # Execute the Python ArithmeticParser from parser.py
        parser = ArithmeticParser(expression)
        is_valid = parser.parse()

        response_data = {
            "valid": is_valid,
            "expression": expression,
            "steps": parser.steps,
            "error": parser.error_message if not is_valid else None
        }

        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

    def log_message(self, format, *args):
        # Clean terminal output for server logs
        print(f"[Python Server] {self.address_string()} - {format % args}")


def start_server(port=DEFAULT_PORT, auto_open_browser=True):
    selected_port = port
    httpd = None
    for p in range(port, port + 25):
        try:
            httpd = socketserver.TCPServer(("", p), ParserHTTPRequestHandler)
            selected_port = p
            break
        except OSError:
            continue

    if not httpd:
        print("[ERROR] Unable to bind to an open port.")
        sys.exit(1)

    url = f"http://localhost:{selected_port}"
    print("=" * 60)
    print("Arithmetic Expression Parser Web Application")
    print("=" * 60)
    print(f"-> Local URL: {url}")
    print(f"-> Backend:   parser.py (Recursive-Descent CFG Parser)")
    print("Press Ctrl+C in this terminal to stop the server.")
    print("=" * 60)

    if auto_open_browser:
        print("-> Opening frontend in your default web browser...")
        webbrowser.open(url)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server stopped]")
        httpd.server_close()


if __name__ == "__main__":
    start_server()
