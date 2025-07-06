import os
import asyncio
import xmlrpc.client
import requests
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import Resource, Tool, TextContent, ImageContent, EmbeddedResource
from pydantic import AnyUrl
import mcp.types as types

# Load environment variables from the root .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Odoo configuration
ODOO_URL = os.getenv("ODOO_URL")
ODOO_API_KEY = os.getenv("ODOO_API_KEY")
ODOO_DB = os.getenv("ODOO_DB")
ODOO_USERNAME = os.getenv("ODOO_USERNAME", "admin")
ODOO_PASSWORD = os.getenv("ODOO_PASSWORD")

class OdooMCPServer:
    def __init__(self):
        self.server = Server("odoo-mcp-server")
        self.odoo_url = ODOO_URL
        self.odoo_db = ODOO_DB
        self.odoo_api_key = ODOO_API_KEY
        
        # Setup MCP server handlers
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.server.list_resources()
        async def handle_list_resources() -> list[Resource]:
            """List available Odoo resources."""
            return [
                Resource(
                    uri=AnyUrl("odoo://connection"),
                    name="Odoo Connection Status",
                    description="Current connection status to Odoo instance",
                    mimeType="text/plain",
                ),
                Resource(
                    uri=AnyUrl("odoo://models"),
                    name="Odoo Models",
                    description="List of available Odoo models",
                    mimeType="application/json",
                ),
            ]

        @self.server.read_resource()
        async def handle_read_resource(uri: AnyUrl) -> str:
            """Read a specific Odoo resource."""
            if uri.scheme != "odoo":
                raise ValueError(f"Unsupported URI scheme: {uri.scheme}")
            
            path = str(uri).replace("odoo://", "")
            
            if path == "connection":
                return await self._check_connection()
            elif path == "models":
                return await self._get_models()
            else:
                raise ValueError(f"Unknown resource path: {path}")

        @self.server.list_tools()
        async def handle_list_tools() -> list[Tool]:
            """List available Odoo tools."""
            return [
                Tool(
                    name="odoo_search",
                    description="Search for records in an Odoo model",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "model": {
                                "type": "string",
                                "description": "The Odoo model to search (e.g., 'res.partner', 'sale.order')"
                            },
                            "domain": {
                                "type": "array",
                                "description": "Search domain as list of tuples (e.g., [['name', 'ilike', 'test']])",
                                "default": []
                            },
                            "fields": {
                                "type": "array",
                                "description": "Fields to retrieve (e.g., ['name', 'email'])",
                                "items": {"type": "string"},
                                "default": []
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of records to return",
                                "default": 10
                            }
                        },
                        "required": ["model"]
                    }
                ),
                Tool(
                    name="odoo_read",
                    description="Read specific records from an Odoo model by IDs",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "model": {
                                "type": "string",
                                "description": "The Odoo model to read from"
                            },
                            "ids": {
                                "type": "array",
                                "description": "List of record IDs to read",
                                "items": {"type": "integer"}
                            },
                            "fields": {
                                "type": "array",
                                "description": "Fields to retrieve",
                                "items": {"type": "string"},
                                "default": []
                            }
                        },
                        "required": ["model", "ids"]
                    }
                ),
                Tool(
                    name="odoo_create",
                    description="Create a new record in an Odoo model",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "model": {
                                "type": "string",
                                "description": "The Odoo model to create record in"
                            },
                            "values": {
                                "type": "object",
                                "description": "Field values for the new record"
                            }
                        },
                        "required": ["model", "values"]
                    }
                ),
                Tool(
                    name="odoo_write",
                    description="Update existing records in an Odoo model",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "model": {
                                "type": "string",
                                "description": "The Odoo model to update"
                            },
                            "ids": {
                                "type": "array",
                                "description": "List of record IDs to update",
                                "items": {"type": "integer"}
                            },
                            "values": {
                                "type": "object",
                                "description": "Field values to update"
                            }
                        },
                        "required": ["model", "ids", "values"]
                    }
                ),
                Tool(
                    name="odoo_test_connection",
                    description="Test the connection to Odoo instance",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                )
            ]

        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
            """Handle tool calls."""
            try:
                if name == "odoo_search":
                    result = await self._search_records(
                        arguments["model"],
                        arguments.get("domain", []),
                        arguments.get("fields", []),
                        arguments.get("limit", 10)
                    )
                elif name == "odoo_read":
                    result = await self._read_records(
                        arguments["model"],
                        arguments["ids"],
                        arguments.get("fields", [])
                    )
                elif name == "odoo_create":
                    result = await self._create_record(
                        arguments["model"],
                        arguments["values"]
                    )
                elif name == "odoo_write":
                    result = await self._write_records(
                        arguments["model"],
                        arguments["ids"],
                        arguments["values"]
                    )
                elif name == "odoo_test_connection":
                    result = await self._test_connection()
                else:
                    raise ValueError(f"Unknown tool: {name}")
                
                return [types.TextContent(type="text", text=str(result))]
            
            except Exception as e:
                return [types.TextContent(type="text", text=f"Error: {str(e)}")]

    async def _get_odoo_connection(self):
        """Get Odoo XML-RPC connection."""
        try:
            # Test connection with common endpoint
            common = xmlrpc.client.ServerProxy(f'{self.odoo_url}/xmlrpc/2/common')
            version = common.version()
            
            # Authenticate - try API key first, then password
            uid = None
            auth_credential = None
            
            if self.odoo_api_key:
                uid = common.authenticate(self.odoo_db, ODOO_USERNAME, self.odoo_api_key, {})
                if uid:
                    auth_credential = self.odoo_api_key
            
            if not uid and ODOO_PASSWORD:
                uid = common.authenticate(self.odoo_db, ODOO_USERNAME, ODOO_PASSWORD, {})
                if uid:
                    auth_credential = ODOO_PASSWORD
            
            if not uid:
                raise Exception("Authentication failed with both API key and password")
            
            # Get models proxy
            models = xmlrpc.client.ServerProxy(f'{self.odoo_url}/xmlrpc/2/object')
            
            return models, uid, auth_credential
        except Exception as e:
            raise Exception(f"Failed to connect to Odoo: {str(e)}")

    async def _check_connection(self) -> str:
        """Check Odoo connection status."""
        try:
            models, uid, auth_credential = await self._get_odoo_connection()
            return f"✅ Connected to Odoo successfully!\nDatabase: {self.odoo_db}\nUser ID: {uid}\nURL: {self.odoo_url}"
        except Exception as e:
            return f"❌ Connection failed: {str(e)}"

    async def _get_models(self) -> str:
        """Get list of available Odoo models."""
        try:
            models, uid, auth_credential = await self._get_odoo_connection()
            model_list = models.execute_kw(
                self.odoo_db, uid, auth_credential,
                'ir.model', 'search_read',
                [[]],
                {'fields': ['model', 'name'], 'limit': 50}
            )
            return str(model_list)
        except Exception as e:
            return f"Error getting models: {str(e)}"

    async def _search_records(self, model: str, domain: list, fields: list, limit: int) -> dict:
        """Search for records in Odoo model."""
        try:
            models, uid, auth_credential = await self._get_odoo_connection()
            
            # Search for record IDs
            record_ids = models.execute_kw(
                self.odoo_db, uid, auth_credential,
                model, 'search',
                [domain],
                {'limit': limit}
            )
            
            if not record_ids:
                return {"message": "No records found", "records": []}
            
            # Read the records
            records = models.execute_kw(
                self.odoo_db, uid, auth_credential,
                model, 'read',
                [record_ids],
                {'fields': fields} if fields else {}
            )
            
            return {"message": f"Found {len(records)} records", "records": records}
        
        except Exception as e:
            return {"error": str(e)}

    async def _read_records(self, model: str, ids: list, fields: list) -> dict:
        """Read specific records by IDs."""
        try:
            models, uid, auth_credential = await self._get_odoo_connection()
            
            records = models.execute_kw(
                self.odoo_db, uid, auth_credential,
                model, 'read',
                [ids],
                {'fields': fields} if fields else {}
            )
            
            return {"message": f"Read {len(records)} records", "records": records}
        
        except Exception as e:
            return {"error": str(e)}

    async def _create_record(self, model: str, values: dict) -> dict:
        """Create a new record."""
        try:
            models, uid, auth_credential = await self._get_odoo_connection()
            
            record_id = models.execute_kw(
                self.odoo_db, uid, auth_credential,
                model, 'create',
                [values]
            )
            
            return {"message": f"Created record with ID: {record_id}", "id": record_id}
        
        except Exception as e:
            return {"error": str(e)}

    async def _write_records(self, model: str, ids: list, values: dict) -> dict:
        """Update existing records."""
        try:
            models, uid, auth_credential = await self._get_odoo_connection()
            
            success = models.execute_kw(
                self.odoo_db, uid, auth_credential,
                model, 'write',
                [ids, values]
            )
            
            return {"message": f"Updated {len(ids)} records", "success": success}
        
        except Exception as e:
            return {"error": str(e)}

    async def _test_connection(self) -> dict:
        """Test connection to Odoo."""
        try:
            models, uid, auth_credential = await self._get_odoo_connection()
            
            # Try to read user info
            user_info = models.execute_kw(
                self.odoo_db, uid, auth_credential,
                'res.users', 'read',
                [uid],
                {'fields': ['name', 'login']}
            )
            
            return {
                "status": "success",
                "message": "Connection test successful!",
                "user_info": user_info[0] if user_info else None,
                "database": self.odoo_db,
                "url": self.odoo_url
            }
        
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection test failed: {str(e)}"
            }

    async def run(self):
        """Run the MCP server."""
        # Import here to avoid issues with event loop
        from mcp.server.stdio import stdio_server
        
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="odoo-mcp-server",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )

def main():
    """Main entry point."""
    server = OdooMCPServer()
    asyncio.run(server.run())

if __name__ == "__main__":
    main()
