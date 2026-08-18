import json
from http.server import HTTPServer, BaseHTTPRequestHandler

HOST = "127.0.0.1"
PORT = 8000

class RequestHandler(BaseHTTPRequestHandler):
    
    def _send_json(self, status_code, data):
        """Envia respuestas estructuradas en formato JSON."""
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def log_message(self, format, *args):
        """Logs básicos en consola de las solicitudes entrantes."""
        print(f"[LOG RECURSO] {self.address_string()} - [{self.log_date_time_string()}] {format % args}")

    def do_GET(self):
        """Manejador de peticiones HTTP GET."""
        if self.path == "/":
            self._send_json(200, {
                "status": "success",
                "message": "Servidor HTTP funcional activo",
                "available_routes": ["/", "/health", "/api/info"]
            })
        elif self.path == "/health":
            self._send_json(200, {
                "status": "ok",
                "message": "Servidor sencillo activo"
            })
        elif self.path == "/api/info":
            self._send_json(200, {
                "app": "Curso Desarrollo Backend",
                "version": "1.0.0",
                "environment": "development"
            })
        else:
            self._send_json(404, {
                "error": "Ruta no encontrada",
                "requested_path": self.path
            })

def run():
    server = HTTPServer((HOST, PORT), RequestHandler)
    print(f"Servidor ejecutándose en http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario.")
        server.server_close()

if __name__ == "__main__":
    run()