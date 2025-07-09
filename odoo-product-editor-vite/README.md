# Odoo Product Editor

A modern React web application for editing Odoo product templates with AI-powered text polishing capabilities.

## Features

- 🔍 **Product Search & Browse** - Search and filter through your Odoo products
- ✏️ **Real-time Editing** - Edit product details with instant validation
- 💰 **Price Management** - Easy price updates with currency formatting
- 🤖 **AI Text Polishing** - Improve product descriptions with AI assistance
- 🔄 **Auto-save** - Changes are tracked and can be saved with one click
- 🔗 **MCP Integration** - Connects to your Odoo MCP server for secure data access

## Architecture

```
React Frontend (Port 3001)
    ↓
Express Bridge Server (Port 8000)
    ↓
Odoo MCP Server
    ↓
Odoo Database
```

## Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- Working Odoo MCP server (configured in parent directory)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Ensure your Odoo MCP server is configured:**
   - Make sure your `.env` file in the parent directory has correct Odoo credentials
   - Test your MCP server with: `python ../test_connection.py`

## Running the Application

### Option 1: Run Everything Together (Recommended)
```bash
npm start
```
This will start both the bridge server and the React app simultaneously.

### Option 2: Run Separately
```bash
# Terminal 1: Start the bridge server
npm run server

# Terminal 2: Start the React app
npm run dev
```

## Usage

1. **Open your browser** to `http://localhost:3001`

2. **Check connection status** - The app will automatically test the connection to your Odoo MCP server

3. **Browse products** - Use the search bar to find products or browse the list

4. **Edit products** - Click on any product to open the editor:
   - Update name, price, description, and other fields
   - Use the "Polish Text" button to improve descriptions with AI
   - Save changes with the "Save Changes" button

5. **AI Text Polishing** - Click the "Polish Text" button next to the description field to:
   - Improve grammar and readability
   - Optimize for SEO
   - Enhance professional tone

## API Endpoints

### Bridge Server (Port 8000)

- `POST /api` - Proxy requests to MCP server
- `GET /health` - Health check and server status

### MCP Server Integration

The app communicates with your Odoo MCP server using these tools:
- `odoo_test_connection` - Test Odoo connectivity
- `odoo_search` - Search for products
- `odoo_read` - Read product details
- `odoo_write` - Update product information

## Configuration

### Vite Configuration
The React app is configured to proxy API requests to the bridge server:
```javascript
server: {
  port: 3001,
  proxy: {
    '/api': 'http://localhost:8000'
  }
}
```

### Bridge Server Configuration
The Express server automatically starts your MCP server and handles communication.

## Troubleshooting

### Connection Issues
1. **Check MCP server status:**
   ```bash
   python ../test_connection.py
   ```

2. **Verify environment variables:**
   - Ensure `.env` file exists in parent directory
   - Check Odoo URL, database, username, and password

3. **Check server logs:**
   - Bridge server logs appear in the terminal
   - React app logs appear in browser console

### Common Errors

**"Unable to connect to Odoo MCP server"**
- Verify your Odoo credentials in `.env`
- Test direct connection with `python ../test_connection.py`
- Check if Odoo instance is accessible

**"MCP server timeout"**
- Restart the application
- Check if Python dependencies are installed
- Verify MCP server path in `server.js`

## Development

### Project Structure
```
odoo-product-editor-vite/
├── src/
│   ├── components/          # React components
│   │   ├── ConnectionStatus.jsx
│   │   ├── ProductList.jsx
│   │   └── ProductEditor.jsx
│   ├── services/           # API services
│   │   └── mcpClient.js
│   ├── App.jsx            # Main app component
│   └── main.jsx           # App entry point
├── server.js              # Express bridge server
├── package.json           # Dependencies and scripts
└── vite.config.js         # Vite configuration
```

### Adding New Features

1. **New MCP Tools** - Add methods to `mcpClient.js`
2. **UI Components** - Create new components in `src/components/`
3. **API Endpoints** - Add routes to `server.js`

## Security Notes

- The bridge server handles MCP communication securely
- Odoo credentials are never exposed to the frontend
- All API requests are proxied through the bridge server

## License

This project is part of the Odoo MCP Server suite.
