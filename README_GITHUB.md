# Odoo MCP Server

A Model Context Protocol (MCP) server that provides seamless integration between MCP clients and Odoo instances via XML-RPC.

## 🚀 Features

- **5 MCP Tools** for complete Odoo interaction
- **2 MCP Resources** for connection status and model listing
- **Dual Authentication** support (API key + password fallback)
- **Comprehensive Error Handling** with detailed debugging
- **Easy Setup** with environment templates

## 🛠️ Available Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `odoo_test_connection` | Test Odoo connection | Verify connectivity |
| `odoo_search` | Search records in any model | Find customers, products, orders |
| `odoo_read` | Read specific records by ID | Get detailed record info |
| `odoo_create` | Create new records | Add customers, products, etc. |
| `odoo_write` | Update existing records | Modify data |

## 📋 Prerequisites

- Python 3.8+
- Odoo instance with XML-RPC access
- Valid Odoo user credentials

## ⚡ Quick Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd odoo_agent_mcp
```

### 2. Create Virtual Environment
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
# or
source .venv/bin/activate   # Linux/Mac
```

### 3. Install Dependencies
```bash
pip install -r odoo_mcp_server/requirements.txt
```

### 4. Configure Environment
```bash
# Copy template and fill in your Odoo credentials
cp .env.template .env
# Edit .env with your actual Odoo details
```

### 5. Test Connection
```bash
python test_connection.py
```

## 🔧 Configuration

Create a `.env` file with your Odoo credentials:

```env
ODOO_URL=https://your-instance.odoo.com/
ODOO_API_KEY=your_api_key_here
ODOO_DB=your_database_name
ODOO_USERNAME=your_username@example.com
ODOO_PASSWORD=your_password_here
```

## 🔌 MCP Client Integration

Add to your MCP client configuration:

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

## 📖 Usage Examples

### Search for Companies
```json
{
  "tool": "odoo_search",
  "arguments": {
    "model": "res.partner",
    "domain": [["is_company", "=", true]],
    "fields": ["name", "email", "phone"],
    "limit": 10
  }
}
```

### Create New Customer
```json
{
  "tool": "odoo_create",
  "arguments": {
    "model": "res.partner",
    "values": {
      "name": "New Customer Ltd",
      "email": "contact@newcustomer.com",
      "is_company": true
    }
  }
}
```

### Update Customer Phone
```json
{
  "tool": "odoo_write",
  "arguments": {
    "model": "res.partner",
    "ids": [123],
    "values": {
      "phone": "+1 234 567 8900"
    }
  }
}
```

## 🧪 Testing

### Connection Test
```bash
python test_connection.py
```

### Debug Authentication
```bash
python debug_auth.py
```

## 📁 Project Structure

```
odoo_agent_mcp/
├── .env.template          # Environment configuration template
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── SETUP_COMPLETE.md     # Detailed setup guide
├── mcp_config.json       # MCP client configuration
├── test_connection.py    # Connection testing script
├── debug_auth.py         # Authentication debugging
├── odoo_mcp_server/
│   ├── main.py          # MCP server implementation
│   └── requirements.txt # Python dependencies
```

## 🔒 Security

- **Credentials Protection**: `.env` file is excluded from Git
- **Template Provided**: Use `.env.template` for setup guidance
- **No Hardcoded Secrets**: All sensitive data in environment variables

## 🐛 Troubleshooting

### Authentication Issues
1. Verify your Odoo credentials in `.env`
2. Check if your user has XML-RPC permissions
3. Try regenerating your API key
4. Run `python debug_auth.py` for detailed diagnostics

### Connection Problems
1. Ensure Odoo URL is correct and accessible
2. Verify database name matches exactly
3. Check firewall/network restrictions
4. Test with `python test_connection.py`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol](https://modelcontextprotocol.io/)
- Integrates with [Odoo](https://www.odoo.com/) business applications
- Designed for use with MCP-compatible AI assistants

---

**Ready to connect your AI assistant to Odoo? Get started now!** 🚀
