import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { useQuery } from 'react-query'
import mcpClient from '../services/mcpClient'

const ProductList = ({ onProductSelect, selectedProduct, connectionStatus }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDomain, setSearchDomain] = useState([])

  // Update search domain when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      setSearchDomain([['name', 'ilike', searchTerm.trim()]])
    } else {
      setSearchDomain([])
    }
  }, [searchTerm])

  // Fetch products using React Query
  const {
    data: productsData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['products', searchDomain],
    () => mcpClient.searchProducts(searchDomain, ['name', 'list_price', 'categ_id'], 50),
    {
      enabled: connectionStatus === 'connected',
      refetchOnWindowFocus: false,
      retry: 2,
    }
  )

  const products = productsData?.records || []

  const handleProductClick = async (product) => {
    try {
      // Fetch detailed product information
      const detailData = await mcpClient.readProduct(product.id)
      if (detailData?.records && detailData.records.length > 0) {
        onProductSelect(detailData.records[0])
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error)
      // Fallback to basic product data
      onProductSelect(product)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0)
  }

  if (connectionStatus !== 'connected') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {connectionStatus === 'checking' ? 'Connecting to Odoo...' : 'Not connected to Odoo'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Field */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load products. Please try again.
        </Alert>
      )}

      {/* Products List */}
      {!isLoading && !error && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {products.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              {searchTerm ? 'No products found matching your search.' : 'No products available.'}
            </Typography>
          ) : (
            <List dense>
              {products.map((product) => (
                <ListItem key={product.id} disablePadding>
                  <ListItemButton
                    selected={selectedProduct?.id === product.id}
                    onClick={() => handleProductClick(product)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                            {product.name}
                          </Typography>
                          <Chip
                            label={formatPrice(product.list_price)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        product.categ_id && product.categ_id[1] ? (
                          <Typography variant="caption" color="text.secondary">
                            {product.categ_id[1]}
                          </Typography>
                        ) : null
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Results Count */}
      {!isLoading && !error && products.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </Typography>
      )}
    </Box>
  )
}

export default ProductList
