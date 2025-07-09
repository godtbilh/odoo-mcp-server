import React, { useEffect } from 'react'
import { Chip, CircularProgress } from '@mui/material'
import { CheckCircle, Error, Warning } from '@mui/icons-material'
import mcpClient from '../services/mcpClient'

const ConnectionStatus = ({ status, onStatusChange }) => {
  useEffect(() => {
    const checkConnection = async () => {
      try {
        onStatusChange('checking')
        await mcpClient.testConnection()
        onStatusChange('connected')
      } catch (error) {
        console.error('Connection failed:', error)
        onStatusChange('error')
      }
    }

    checkConnection()
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [onStatusChange])

  const getStatusProps = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Connected',
          color: 'success',
          icon: <CheckCircle />,
        }
      case 'error':
        return {
          label: 'Disconnected',
          color: 'error',
          icon: <Error />,
        }
      case 'checking':
        return {
          label: 'Connecting...',
          color: 'warning',
          icon: <CircularProgress size={16} />,
        }
      default:
        return {
          label: 'Unknown',
          color: 'default',
          icon: <Warning />,
        }
    }
  }

  const statusProps = getStatusProps()

  return (
    <Chip
      icon={statusProps.icon}
      label={statusProps.label}
      color={statusProps.color}
      variant="outlined"
      size="small"
    />
  )
}

export default ConnectionStatus
