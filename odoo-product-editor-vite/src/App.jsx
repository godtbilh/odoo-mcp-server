import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Grid,
  Paper,
  Alert,
} from '@mui/material'
import ProductList from './components/ProductList'
import ProductEditor from './components/ProductEditor'
import ConnectionStatus from './components/ConnectionStatus'

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('checking')

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Odoo Product Editor
          </Typography>
          <ConnectionStatus 
            status={connectionStatus} 
            onStatusChange={setConnectionStatus} 
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {connectionStatus === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to connect to Odoo MCP server. Please check your connection.
          </Alert>
        )}

        <Grid container spacing={2} sx={{ height: 'calc(100vh - 120px)' }}>
          {/* Product List Panel */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: '100%', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <ProductList 
                onProductSelect={setSelectedProduct}
                selectedProduct={selectedProduct}
                connectionStatus={connectionStatus}
              />
            </Paper>
          </Grid>

          {/* Product Editor Panel */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: '100%', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedProduct ? `Edit: ${selectedProduct.name}` : 'Select a Product'}
              </Typography>
              <ProductEditor 
                product={selectedProduct}
                onProductUpdate={setSelectedProduct}
                connectionStatus={connectionStatus}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default App
