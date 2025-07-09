import express from 'express'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 8000

app.use(express.json())

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// MCP Server communication
let mcpProcess = null
let isInitialized = false

const startMCPServer = () => {
  const mcpServerPath = path.join(__dirname, '..', 'odoo_mcp_server', 'main.py')
  
  mcpProcess = spawn('python', [mcpServerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, '..')
  })

  mcpProcess.on('error', (error) => {
    console.error('Failed to start MCP server:', error)
  })

  mcpProcess.on('exit', (code) => {
    console.log(`MCP server exited with code ${code}`)
    mcpProcess = null
    isInitialized = false
  })

  console.log('MCP server started')
}

const initializeMCP = async () => {
  if (isInitialized) return true
  
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'odoo-product-editor',
        version: '1.0.0'
      }
    }
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('MCP initialization timeout'))
    }, 5000)

    let responseData = ''
    let initComplete = false
    
    const onData = (data) => {
      responseData += data.toString()
      
      try {
        const lines = responseData.split('\n').filter(line => line.trim())
        for (const line of lines) {
          const response = JSON.parse(line)
          if (response.id === 1 && response.result && !initComplete) {
            initComplete = true
            // Send initialized notification
            const initializedNotification = {
              jsonrpc: '2.0',
              method: 'notifications/initialized',
              params: {}
            }
            mcpProcess.stdin.write(JSON.stringify(initializedNotification) + '\n')
            
            clearTimeout(timeout)
            mcpProcess.stdout.removeListener('data', onData)
            isInitialized = true
            resolve(true)
            return
          }
        }
      } catch (e) {
        // Not complete JSON yet, continue listening
      }
    }

    mcpProcess.stdout.on('data', onData)
    mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n')
  })
}

// Proxy requests to MCP server
app.post('/api', async (req, res) => {
  try {
    if (!mcpProcess) {
      startMCPServer()
      // Give the server a moment to start
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    if (!isInitialized) {
      await initializeMCP()
    }

    const request = req.body
    
    // Send request to MCP server
    mcpProcess.stdin.write(JSON.stringify(request) + '\n')
    
    // Listen for response
    let responseData = ''
    
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP server timeout'))
      }, 15000)

      const onData = (data) => {
        responseData += data.toString()
        
        try {
          const lines = responseData.split('\n').filter(line => line.trim())
          for (const line of lines) {
            const response = JSON.parse(line)
            if (response.id === request.id) {
              clearTimeout(timeout)
              mcpProcess.stdout.removeListener('data', onData)
              resolve(response)
              return
            }
          }
        } catch (e) {
          // Not complete JSON yet, continue listening
        }
      }

      mcpProcess.stdout.on('data', onData)
    })

    const response = await responsePromise
    res.json(response)
    
  } catch (error) {
    console.error('MCP communication error:', error)
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      }
    })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mcpServer: mcpProcess ? 'running' : 'stopped',
    timestamp: new Date().toISOString()
  })
})

// Start the bridge server
app.listen(PORT, () => {
  console.log(`Bridge server running on http://localhost:${PORT}`)
  console.log('Starting MCP server...')
  startMCPServer()
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...')
  if (mcpProcess) {
    mcpProcess.kill()
  }
  process.exit(0)
})
