import axios from 'axios'

class MCPClient {
  constructor() {
    this.baseURL = '/api'
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }

  // Test connection to MCP server
  async testConnection() {
    try {
      const response = await this.client.post('/', {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'odoo_test_connection',
          arguments: {}
        }
      })
      
      if (response.data.error) {
        throw new Error(response.data.error.message)
      }
      
      // Parse the text content from MCP response
      const result = response.data.result
      if (result && result[0] && result[0].text) {
        return JSON.parse(result[0].text)
      }
      
      return result
    } catch (error) {
      console.error('Connection test failed:', error)
      throw error
    }
  }

  // Search for products
  async searchProducts(domain = [], fields = [], limit = 50) {
    try {
      const response = await this.client.post('/', {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'odoo_search',
          arguments: {
            model: 'product.template',
            domain: domain,
            fields: fields.length > 0 ? fields : ['name', 'list_price', 'description', 'categ_id'],
            limit: limit
          }
        }
      })
      
      if (response.data.error) {
        throw new Error(response.data.error.message)
      }
      
      // Parse the text content from MCP response
      const result = response.data.result
      if (result && result[0] && result[0].text) {
        return JSON.parse(result[0].text)
      }
      
      return result
    } catch (error) {
      console.error('Product search failed:', error)
      throw error
    }
  }

  // Read specific product by ID
  async readProduct(productId, fields = []) {
    try {
      const response = await this.client.post('/', {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'odoo_read',
          arguments: {
            model: 'product.template',
            ids: [productId],
            fields: fields.length > 0 ? fields : ['name', 'list_price', 'description', 'categ_id', 'default_code', 'barcode', 'weight', 'volume']
          }
        }
      })
      
      if (response.data.error) {
        throw new Error(response.data.error.message)
      }
      
      // Parse the text content from MCP response
      const result = response.data.result
      if (result && result[0] && result[0].text) {
        return JSON.parse(result[0].text)
      }
      
      return result
    } catch (error) {
      console.error('Product read failed:', error)
      throw error
    }
  }

  // Update product
  async updateProduct(productId, values) {
    try {
      const response = await this.client.post('/', {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'odoo_write',
          arguments: {
            model: 'product.template',
            ids: [productId],
            values: values
          }
        }
      })
      
      if (response.data.error) {
        throw new Error(response.data.error.message)
      }
      
      // Parse the text content from MCP response
      const result = response.data.result
      if (result && result[0] && result[0].text) {
        return JSON.parse(result[0].text)
      }
      
      return result
    } catch (error) {
      console.error('Product update failed:', error)
      throw error
    }
  }

  // Create new product
  async createProduct(values) {
    try {
      const response = await this.client.post('/', {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'odoo_create',
          arguments: {
            model: 'product.template',
            values: values
          }
        }
      })
      
      if (response.data.error) {
        throw new Error(response.data.error.message)
      }
      
      // Parse the text content from MCP response
      const result = response.data.result
      if (result && result[0] && result[0].text) {
        return JSON.parse(result[0].text)
      }
      
      return result
    } catch (error) {
      console.error('Product creation failed:', error)
      throw error
    }
  }

  // Polish text using AI (placeholder for future AI integration)
  async polishText(text, tone = 'professional') {
    // This would integrate with an AI service like OpenAI
    // For now, return a simple polished version
    try {
      // Simulate AI polishing
      const polished = text
        .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letters
        .replace(/\s+/g, ' ') // Clean up spaces
        .trim()
      
      return {
        original: text,
        polished: polished,
        improvements: ['Capitalized words', 'Cleaned spacing']
      }
    } catch (error) {
      console.error('Text polishing failed:', error)
      throw error
    }
  }
}

export default new MCPClient()
