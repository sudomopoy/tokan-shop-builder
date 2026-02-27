"""
اجرای Celery worker همراه با HTTP health check برای Kubernetes.
Health endpoint: GET /health روی پورت 8080 (یا CELERY_HEALTH_PORT)
"""
import os
import subprocess
import sys
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/health", "/health/"):
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # سکوت برای کاهش لاگ


def run_health_server(port: int):
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    server.serve_forever()


def main():
    port = int(os.environ.get("CELERY_HEALTH_PORT", "8080"))
    t = threading.Thread(target=run_health_server, args=(port,), daemon=True)
    t.start()

    cmd = ["celery", "-A", "core", "worker", "-l", "info"] + sys.argv[1:]
    sys.exit(subprocess.run(cmd).returncode)


if __name__ == "__main__":
    main()
