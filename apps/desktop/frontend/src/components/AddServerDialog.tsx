import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  Alert
} from '@mui/material'
import { RuntimeEnvironment } from '../types'

type InputMode = 'command' | 'params'

interface AddServerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  themeMode: 'light' | 'dark';
  editEnv?: RuntimeEnvironment | null;
}

export function AddServerDialog({
  open,
  onClose,
  onSuccess,
  themeMode: _themeMode,
  editEnv = null,
}: AddServerDialogProps) {
  const [inputMode, setInputMode] = useState<InputMode>('params')
  const [name, setName] = useState('')
  const [sshCommand, setSshCommand] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [user, setUser] = useState('')
  const [identityFile, setIdentityFile] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!editEnv

  useEffect(() => {
    if (open) {
      setError(null)
      setTestResult(null)
      if (editEnv) {
        setName(editEnv.name)
        const cfg = editEnv.sshConfig
        if (cfg?.sshCommand) {
          setInputMode('command')
          setSshCommand(cfg.sshCommand)
          setHost('')
          setPort('22')
          setUser('')
        } else {
          setInputMode('params')
          setSshCommand('')
          setHost(cfg?.host || '')
          setPort(String(cfg?.port || 22))
          setUser(cfg?.user || '')
          setIdentityFile(cfg?.identityFile || '')
        }
      } else {
        setName('')
        setSshCommand('')
        setHost('')
        setPort('22')
        setUser('')
        setIdentityFile('')
      }
    }
  }, [open, editEnv])

  const handleTest = async () => {
    if (isEdit) return
    setTesting(true)
    setTestResult(null)
    setError(null)
    try {
      const result = await invoke<{ id: string }>('add_runtime_environment', {
        name: name || '测试连接',
        sshCommand: inputMode === 'command' ? sshCommand.trim() : undefined,
        host: inputMode === 'params' ? host.trim() : undefined,
        port: inputMode === 'params' ? (parseInt(port, 10) || 22) : undefined,
        user: inputMode === 'params' ? (user.trim() || undefined) : undefined,
        identityFile: inputMode === 'params' ? (identityFile.trim() || undefined) : undefined,
      })
      const envId = result.id
      const success = await invoke<boolean>('test_ssh_connection', { environmentId: envId })
      await invoke('remove_runtime_environment', { id: envId })
      setTestResult(success ? { success: true, message: '连接成功' } : { success: false, message: '连接失败' })
    } catch (err) {
      setTestResult({ success: false, message: String(err) })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await invoke('update_runtime_environment', {
          id: editEnv.id,
          name: name.trim(),
          sshCommand: inputMode === 'command' && sshCommand.trim() ? sshCommand.trim() : undefined,
          host: inputMode === 'params' && host.trim() ? host.trim() : undefined,
          port: inputMode === 'params' ? (parseInt(port, 10) || 22) : undefined,
          user: inputMode === 'params' ? (user.trim() || undefined) : undefined,
          identityFile: inputMode === 'params' ? (identityFile.trim() || undefined) : undefined,
        })
      } else {
        await invoke('add_runtime_environment', {
          name: name.trim(),
          sshCommand: inputMode === 'command' ? sshCommand.trim() : undefined,
          host: inputMode === 'params' ? host.trim() : undefined,
          port: inputMode === 'params' ? parseInt(port, 10) : undefined,
          user: inputMode === 'params' ? user.trim() : undefined,
          identityFile: inputMode === 'params' ? identityFile.trim() : undefined,
        })
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  const canSave = name.trim() && (
    inputMode === 'command' ? sshCommand.trim() : host.trim()
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? '编辑服务器' : '添加远程服务器'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="环境名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：生产服务器"
            sx={{ mb: 2 }}
            size="small"
          />

          <Tabs value={inputMode} onChange={(_, v) => setInputMode(v)} sx={{ mb: 2 }}>
            <Tab label="SSH 命令" value="command" />
            <Tab label="分参数填写" value="params" />
          </Tabs>

          {inputMode === 'command' ? (
            <TextField
              fullWidth
              multiline
              rows={2}
              label="SSH 连接命令"
              value={sshCommand}
              onChange={(e) => setSshCommand(e.target.value)}
              placeholder="ssh user@host -p 22"
              helperText="填写完整的 SSH 命令，如：ssh root@192.168.1.100 -p 22"
              size="small"
            />
          ) : (
            <Box className="flex flex-col gap-3">
              <TextField
                fullWidth
                label="主机地址"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.100 或 hostname"
                size="small"
              />
              <Box className="flex gap-3">
                <TextField
                  label="端口"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  type="number"
                  sx={{ width: 100 }}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="用户名"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="默认 root"
                  size="small"
                />
              </Box>
              <TextField
                fullWidth
                label="SSH 私钥路径（可选）"
                value={identityFile}
                onChange={(e) => setIdentityFile(e.target.value)}
                placeholder="~/.ssh/id_rsa"
                size="small"
              />
            </Box>
          )}

          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
              {testResult.message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {!isEdit && (
          <Button onClick={handleTest} disabled={testing || !canSave}>
            {testing ? '测试中...' : '测试连接'}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave || saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
