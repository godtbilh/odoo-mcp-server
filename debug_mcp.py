import requests
import json

# Test different MCP method names
test_requests = [
    {
        "name": "tools/call",
        "request": {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "odoo_test_connection",
                "arguments": {}
            }
        }
    },
    {
        "name": "call_tool",
        "request": {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "call_tool",
            "params": {
                "name": "odoo_test_connection",
                "arguments": {}
            }
        }
    },
    {
        "name": "tools/list",
        "request": {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/list",
            "params": {}
        }
    }
]

for test in test_requests:
    try:
        print(f"\nTesting {test['name']}...")
        response = requests.post('http://localhost:8000/api', json=test['request'], timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if 'result' in data:
                print(f"✅ Success with {test['name']}")
                break
            elif 'error' in data:
                print(f"❌ Error: {data['error']}")
        
    except Exception as e:
        print(f"Request failed: {e}")
