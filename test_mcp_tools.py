#!/usr/bin/env python3

import subprocess
import json
import sys
import time

def test_mcp_server():
    """Test the MCP server and show available tools"""
    
    print("🔧 Testing Odoo MCP Server Tools")
    print("=" * 50)
    
    # Start the MCP server
    try:
        process = subprocess.Popen(
            [sys.executable, 'odoo_mcp_server/main.py'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=0
        )
        
        # Initialize the MCP server
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "clientInfo": {"name": "test-client", "version": "1.0.0"}
            }
        }
        
        print("📡 Initializing MCP server...")
        process.stdin.write(json.dumps(init_request) + '\n')
        process.stdin.flush()
        
        # Read initialization response
        response_line = process.stdout.readline()
        if response_line:
            init_response = json.loads(response_line.strip())
            if 'result' in init_response:
                print("✅ MCP server initialized successfully")
                print(f"   Server capabilities: {init_response['result'].get('capabilities', {})}")
            else:
                print(f"❌ Initialization failed: {init_response}")
                return
        
        # Send initialized notification
        initialized_notification = {
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
            "params": {}
        }
        process.stdin.write(json.dumps(initialized_notification) + '\n')
        process.stdin.flush()
        
        # List available tools
        tools_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }
        
        print("\n🛠️  Listing available tools...")
        process.stdin.write(json.dumps(tools_request) + '\n')
        process.stdin.flush()
        
        # Read tools response
        response_line = process.stdout.readline()
        if response_line:
            tools_response = json.loads(response_line.strip())
            if 'result' in tools_response:
                tools = tools_response['result']['tools']
                print(f"✅ Found {len(tools)} available tools:")
                print()
                
                for i, tool in enumerate(tools, 1):
                    print(f"{i}. 🔧 {tool['name']}")
                    print(f"   📝 {tool['description']}")
                    
                    if 'inputSchema' in tool:
                        schema = tool['inputSchema']
                        if 'properties' in schema:
                            print("   📋 Parameters:")
                            for param_name, param_info in schema['properties'].items():
                                required = param_name in schema.get('required', [])
                                req_text = " (required)" if required else " (optional)"
                                param_type = param_info.get('type', 'unknown')
                                param_desc = param_info.get('description', 'No description')
                                print(f"      • {param_name} ({param_type}){req_text}: {param_desc}")
                    print()
            else:
                print(f"❌ Failed to list tools: {tools_response}")
        
        # Test connection tool
        print("🔍 Testing connection tool...")
        test_connection_request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "odoo_test_connection",
                "arguments": {}
            }
        }
        
        process.stdin.write(json.dumps(test_connection_request) + '\n')
        process.stdin.flush()
        
        # Read test response
        response_line = process.stdout.readline()
        if response_line:
            test_response = json.loads(response_line.strip())
            if 'result' in test_response:
                result = test_response['result']
                if result and len(result) > 0 and 'text' in result[0]:
                    connection_result = json.loads(result[0]['text'])
                    print("✅ Connection test successful!")
                    print(f"   Status: {connection_result.get('status', 'unknown')}")
                    print(f"   Message: {connection_result.get('message', 'No message')}")
                    if 'user_info' in connection_result:
                        user_info = connection_result['user_info']
                        print(f"   Connected as: {user_info.get('name', 'Unknown')} ({user_info.get('login', 'Unknown')})")
                else:
                    print(f"✅ Connection test result: {result}")
            else:
                print(f"❌ Connection test failed: {test_response}")
        
        # Test search tool with products
        print("\n🔍 Testing product search...")
        search_request = {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "odoo_search",
                "arguments": {
                    "model": "product.product",
                    "domain": [],
                    "fields": ["name", "default_code", "list_price"],
                    "limit": 5
                }
            }
        }
        
        process.stdin.write(json.dumps(search_request) + '\n')
        process.stdin.flush()
        
        # Read search response
        response_line = process.stdout.readline()
        if response_line:
            search_response = json.loads(response_line.strip())
            if 'result' in search_response:
                result = search_response['result']
                if result and len(result) > 0 and 'text' in result[0]:
                    products = json.loads(result[0]['text'])
                    print(f"✅ Found {len(products)} products:")
                    for product in products[:3]:  # Show first 3
                        name = product.get('name', 'No name')
                        code = product.get('default_code', 'No code')
                        price = product.get('list_price', 0)
                        print(f"   • {name} ({code}) - €{price}")
                    if len(products) > 3:
                        print(f"   ... and {len(products) - 3} more")
                else:
                    print(f"✅ Search result: {result}")
            else:
                print(f"❌ Product search failed: {search_response}")
        
        print("\n🎉 MCP Server Test Complete!")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error testing MCP server: {e}")
    finally:
        if 'process' in locals():
            process.terminate()
            process.wait()

if __name__ == "__main__":
    test_mcp_server()
