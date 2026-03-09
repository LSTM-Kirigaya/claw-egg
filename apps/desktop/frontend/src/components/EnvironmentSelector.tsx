import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  Typography,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material'
import { Monitor, Server, Plus, Pencil, Trash2 } from 'lucide-react'
import { RuntimeEnvironment, RuntimeEnvironmentSettings } from '../types'
import { AddServerDialog } from './AddServerDialog'

interface EnvironmentSelectorProps {
  themeMode: 'light' | 'dark';
}

export function EnvironmentSelector({ themeMode }: EnvironmentSelectorProps) {
  const [settings, setSettings] = useState<RuntimeEnvironmentSettings | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingEnv, setEditingEnv] = useState<RuntimeEnvironment | null>(null)

  const loadEnvironments = async () => {
    try {
      const data = await invoke<RuntimeEnvironmentSettings>('get_runtime_environments')
      setSettings(data)
    } catch (err) {
      console.error('Failed to load environments:', err)
    }
  }

  useEffect(() => {
    loadEnvironments()
  }, [])

  const handleChange = async (envId: string) => {
    try {
      await invoke('set_current_environment', { environmentId: envId })
      setSettings(prev => prev ? { ...prev, currentEnvironmentId: envId } : null)
    } catch (err) {
      console.error('Failed to switch environment:', err)
    }
  }

  const handleRemove = async (envId: string) => {
    try {
      await invoke('remove_runtime_environment', { id: envId })
      loadEnvironments()
    } catch (err) {
      console.error('Failed to remove environment:', err)
    }
  }

  const handleAddSuccess = () => {
    setShowAddDialog(false)
    loadEnvironments()
  }

  const handleEditSuccess = () => {
    setEditingEnv(null)
    loadEnvironments()
  }

  if (!settings) return null

  const currentEnv = settings.environments.find(e => e.id === settings.currentEnvironmentId)

  return (
    <Box className="flex items-center gap-2">
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        运行环境
      </Typography>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select
          value={settings.currentEnvironmentId}
          onChange={(e) => handleChange(e.target.value)}
          displayEmpty
          sx={{
            height: 28,
            fontSize: '0.8rem',
            bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '&:hover': {
              bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
            },
          }}
        >
          {settings.environments.map((env) => (
            <MenuItem key={env.id} value={env.id}>
              <Box className="flex items-center gap-2">
                {env.envType === 'local' ? (
                  <Monitor className="w-3.5 h-3.5" />
                ) : (
                  <Server className="w-3.5 h-3.5" />
                )}
                <span>{env.name}</span>
                {env.envType === 'remote' && (
                  <Chip label="SSH" size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Tooltip title="添加远程服务器">
        <IconButton size="small" onClick={() => setShowAddDialog(true)} sx={{ p: 0.5 }}>
          <Plus className="w-4 h-4" />
        </IconButton>
      </Tooltip>
      {currentEnv?.envType === 'remote' && (
        <>
          <Tooltip title="编辑">
            <IconButton size="small" onClick={() => setEditingEnv(currentEnv)} sx={{ p: 0.5 }}>
              <Pencil className="w-3.5 h-3.5" />
            </IconButton>
          </Tooltip>
          <Tooltip title="删除">
            <IconButton size="small" onClick={() => handleRemove(currentEnv.id)} sx={{ p: 0.5 }}>
              <Trash2 className="w-3.5 h-3.5" />
            </IconButton>
          </Tooltip>
        </>
      )}
      <AddServerDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddSuccess}
        themeMode={themeMode}
      />
      {editingEnv && (
        <AddServerDialog
          open={true}
          onClose={() => setEditingEnv(null)}
          onSuccess={handleEditSuccess}
          themeMode={themeMode}
          editEnv={editingEnv}
        />
      )}
    </Box>
  )
}
