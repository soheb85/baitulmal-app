from http.server import BaseHTTPRequestHandler
import json
from pyaadhaar.utils import AadhaarQrAuto

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. Read the incoming request from Next.js
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        
        qr_data = body.get('qr_data', '')
        
        # 2. Set headers for JSON response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # 3. Decrypt the Aadhaar Data
        try:
            obj = AadhaarQrAuto(qr_data)
            decoded = obj.decodeddata()
            response = {"success": True, "data": decoded}
        except Exception as e:
            response = {"success": False, "error": str(e)}
            
        # 4. Send it back to the frontend
        self.wfile.write(json.dumps(response).encode('utf-8'))
        return