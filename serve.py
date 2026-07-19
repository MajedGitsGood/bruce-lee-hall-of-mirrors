#!/usr/bin/env python3
"""Dev server with no-cache headers (so edits show up on every reload)."""
import http.server

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    http.server.test(HandlerClass=NoCacheHandler, port=8642)
