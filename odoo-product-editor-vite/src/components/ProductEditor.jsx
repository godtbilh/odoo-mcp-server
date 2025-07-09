import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  InputAdornment,
} from '@mui/material'
import {
  Save,
  AutoFixHigh,
  Euro,
  Inventory,
  Description,
} from '@mui/icons-material'
import mcpClient from '../services/mcpClient'

const ProductEditor = ({ product, onProductUpdate, connectionStatus }) => {
  const [formData, setFormData] = useState({
    name: '',
    list_price: '',
    description: '',
    default_code: '',
    barcode: '',
    weight: '',
    volume: '',
  })
  const [originalData, setOriginalData] = useState({})
  const [saving, setSaving] = useState(false)
  const [polishing, setPolishing] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [polishDialog, setPolishDialog] = useState({ open: false, field: '', original: '', polished: '' })

  // Update form when product changes
  useEffect(() => {
    if (product) {
      const data = {
        name: product.name || '',
        list_price: product.list_price || '',
        description: product.description || '',
        default_code: product.default_code || '',
        barcode: product.barcode || '',
        weight: product.weight || '',
        volume: product.volume || '',
      }
      setFormData(data)
      setOriginalData(data)
    }
  }, [product])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!product || connectionStatus !== 'connected') return

    setSaving(true)
    try {
      // Only send changed fields
      const changes = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          changes[key] = formData[key]
        }
      })

      if (Object.keys(changes).length === 0) {
        setSnackbar({ open: true, message: 'No changes to save', severity: 'info' })
        return
      }

      await mcpClient.updateProduct(product.id, changes)
      
      // Update the product data
      const updatedProduct = { ...product, ...formData }
      onProductUpdate(updatedProduct)
      setOriginalData(formData)
      
      setSnackbar({ open: true, message: 'Product updated successfully!', severity: 'success' })
    } catch (error) {
      console.error('Save failed:', error)
      setSnackbar({ open: true, message: 'Failed to save product', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handlePolishText = async (field) => {
    const text = formData[field]
    if (!text || !text.trim()) {
      setSnackbar({ open: true, message: 'No text to polish', severity: 'warning' })
      return
    }

    setPolishing(true)
    try {
      const result = await mcpClient.polishText(text)
      setPolishDialog({
        open: true,
        field: field,
        original: result.original,
        polished: result.polished,
        improvements: result.improvements
      })
    } catch (error) {
      console.error('Polish failed:', error)
      setSnackbar({ open: true, message: 'Failed to polish text', severity: 'error' })
    } finally {
      setPolishing(false)
    }
  }

  const handleAcceptPolish = () => {
    handleInputChange(polishDialog.field, polishDialog.polished)
    setPolishDialog({ open: false, field: '', original: '', polished: '' })
    setSnackbar({ open: true, message: 'Text polished successfully!', severity: 'success' })
  }

  const hasChanges = () => {
    return Object.keys(formData).some(key => formData[key] !== originalData[key])
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0)
  }

  if (!product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          Select a product to edit
        </Typography>
      </Box>
    )
  }

  if (connectionStatus !== 'connected') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary">
          Not connected to Odoo
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Product Info Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {product.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip icon={<Euro />} label={formatPrice(product.list_price)} size="small" />
          <Chip label={`ID: ${product.id}`} size="small" variant="outlined" />
          {product.categ_id && (
            <Chip label={product.categ_id[1]} size="small" variant="outlined" />
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Form Fields */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Description sx={{ mr: 1 }} />
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Product Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={formData.list_price}
              onChange={(e) => handleInputChange('list_price', parseFloat(e.target.value) || 0)}
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Internal Reference"
              value={formData.default_code}
              onChange={(e) => handleInputChange('default_code', e.target.value)}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => handleInputChange('barcode', e.target.value)}
              variant="outlined"
            />
          </Grid>

          {/* Description with AI Polish */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                Description
              </Typography>
              <Button
                startIcon={<AutoFixHigh />}
                onClick={() => handlePolishText('description')}
                disabled={polishing || !formData.description.trim()}
                size="small"
                variant="outlined"
              >
                {polishing ? 'Polishing...' : 'Polish Text'}
              </Button>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Product Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              variant="outlined"
              placeholder="Enter a detailed product description..."
            />
          </Grid>

          {/* Physical Properties */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Inventory sx={{ mr: 1 }} />
              Physical Properties
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
              variant="outlined"
              InputProps={{
                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Volume (m³)"
              type="number"
              value={formData.volume}
              onChange={(e) => handleInputChange('volume', parseFloat(e.target.value) || 0)}
              variant="outlined"
              InputProps={{
                endAdornment: <InputAdornment position="end">m³</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Polish Dialog */}
      <Dialog open={polishDialog.open} onClose={() => setPolishDialog({ ...polishDialog, open: false })} maxWidth="md" fullWidth>
        <DialogTitle>✨ AI Text Polish Results</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Original:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2">{polishDialog.original}</Typography>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>
            Polished (SEO-friendly):
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2">{polishDialog.polished}</Typography>
          </Box>

          {polishDialog.improvements && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Improvements:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {polishDialog.improvements.map((improvement, index) => (
                  <Chip key={index} label={improvement} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolishDialog({ ...polishDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleAcceptPolish} variant="contained">
            Accept Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ProductEditor
