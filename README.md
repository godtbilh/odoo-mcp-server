# Odoo MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Odoo instances via XML-RPC.

## 🚨 Current Status: Authentication Issue

**The MCP server is properly configured, but there's an authentication issue with your Odoo instance.**

### What's Working ✅
- ✅ Connection to Odoo server (https://euromenager.odoo.com/)
- ✅ MCP server implementation with proper tools
- ✅ Environment configuration
- ✅ Dependencies installed

### What's Not Working ❌
- ❌ Authentication with API key fails
- ❌ All tested usernames ('admin', 'Administrator', 'user', 'demo') fail

## 🔧 How to Fix the Authentication Issue

### Option 1: Check Your API Key (Recommended)

1. **Log into your Odoo instance**: https://euromenager.odoo.com/
2. **Go to Settings** → **Users & Companies** → **Users**
3. **Find your user account** and click on it
4. **Check the Login field** - this should be your username
5. **Generate a new API key**:
   - Scroll down to the "API Keys" section
   - Delete the old API key
   - Create a new one
   - Copy the new API key

### Option 2: Update Your Credentials

Update your `.env` file with the correct information:

```env
ODOO_URL=https://euromenager.odoo.com/
ODOO_API_KEY=your_new_api_key_here
ODOO_DB=euromenager
ODOO_USERNAME=your_actual_username_here
```

### Option 3: Check User Permissions

Make sure your user has:
- **XML-RPC access** enabled
- **API access** permissions
- **Proper user rights** (not just portal user)

## 📁 Project Structure

```
odoo_agent_mcp/
├── .env                    # Environment variables (your Odoo credentials)
├── .venv/                  # Python virtual environment
├── odoo_mcp_server/
│   ├── main.py            # MCP server implementation
│   └── requirements.txt   # Python dependencies
├── test_connection.py     # Simple connection test
├── debug_auth.py          # Detailed authentication debugging
├── mcp_config.json        # MCP client configuration
└── README.md              # This file
```

## 🧪 Testing Your Connection

### 1. Activate Virtual Environment
```bash
.venv\Scripts\Activate.ps1
```

### 2. Test Connection
```bash
python test_connection.py
```

### 3. Debug Authentication (if needed)
```bash
python debug_auth.py
```

## 🔌 Using the MCP Server

Once authentication is working, you can use the MCP server with MCP clients.

### Available Tools

1. **odoo_test_connection** - Test connection to Odoo
2. **odoo_search** - Search for records in any Odoo model
3. **odoo_read** - Read specific records by ID
4. **odoo_create** - Create new records
5. **odoo_write** - Update existing records

### Available Resources

1. **odoo://connection** - Connection status
2. **odoo://models** - List of available Odoo models

### Example Usage (once working)

```python
# Search for customers
odoo_search(model="res.partner", domain=[["is_company", "=", True]], fields=["name", "email"], limit=5)

# Read specific customer
odoo_read(model="res.partner", ids=[1], fields=["name", "email", "phone"])

# Create new customer
odoo_create(model="res.partner", values={"name": "Test Company", "email": "test@example.com"})
```

## 🔧 MCP Client Configuration

To use this server with MCP clients like Cline, add this to your MCP configuration:

```json
{
  "mcpServers": {
    "odoo": {
      "command": "python",
      "args": ["odoo_mcp_server/main.py"],
      "env": {
        "PYTHONPATH": "."
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check your API key is correct and not expired
   - Verify your username matches the API key owner
   - Ensure your user has XML-RPC permissions

2. **"python odoo_mcp_server/main.py blocks the system"**
   - This is normal! MCP servers run as long-running processes
   - They wait for input from MCP clients
   - Use the test scripts instead for testing

3. **"Module not found" errors**
   - Make sure virtual environment is activated
   - Run: `pip install -r odoo_mcp_server/requirements.txt`

### Getting Help

1. **Check Odoo logs** in your instance
2. **Verify API key permissions** in Odoo user settings
3. **Test with a fresh API key**
4. **Contact your Odoo administrator** if you don't have proper access

## 📋 Next Steps

1. **Fix authentication** using the steps above
2. **Test connection** with `python test_connection.py`
3. **Configure MCP client** to use this server
4. **Start using Odoo tools** via MCP!

---

**Note**: This is an Odoo SaaS/trial instance, which may have additional restrictions on API access. Make sure your subscription includes API access rights.
