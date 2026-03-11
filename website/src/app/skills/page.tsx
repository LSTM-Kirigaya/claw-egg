'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material'
import { Download, Upload, Favorite, Share, Code } from '@mui/icons-material'
import { supabase, type Skill } from '@/lib/supabase'

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    content: '',
    tags: '',
  })

  useEffect(() => {
    fetchSkills()
  }, [])

  async function fetchSkills() {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('download_count', { ascending: false })

      if (error) throw error
      setSkills(data || [])
    } catch (error) {
      console.error('Error fetching skills:', error)
      // Use mock data if Supabase is not configured
      setSkills([
        {
          id: '1',
          name: 'PDF 处理专家',
          description: '专业的 PDF 处理 skill，支持旋转、合并、提取文本等功能',
          content: 'PDF processing skill content...',
          author_id: '1',
          author_name: '开发者小王',
          download_count: 128,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
          tags: ['PDF', '文档处理', '工具'],
        },
        {
          id: '2',
          name: '前端代码生成器',
          description: '快速生成 React/Vue 组件代码，支持 TypeScript',
          content: 'Frontend generator skill content...',
          author_id: '2',
          author_name: '前端达人',
          download_count: 256,
          created_at: '2025-01-02',
          updated_at: '2025-01-02',
          tags: ['前端', 'React', '代码生成'],
        },
      ])
    }
  }

  async function handleUploadSkill() {
    try {
      const { error } = await supabase.from('skills').insert([
        {
          name: newSkill.name,
          description: newSkill.description,
          content: newSkill.content,
          tags: newSkill.tags.split(',').map((t) => t.trim()),
          author_id: 'current_user',
          author_name: '当前用户',
          download_count: 0,
        },
      ])

      if (error) throw error

      setUploadDialogOpen(false)
      setNewSkill({ name: '', description: '', content: '', tags: '' })
      fetchSkills()
    } catch (error) {
      console.error('Error uploading skill:', error)
      alert('上传失败，请检查 Supabase 配置')
    }
  }

  return (
    <Box sx={{ pt: 12, pb: 8, minHeight: '100vh', background: '#0a0a0f' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            sx={{ color: '#fff', fontWeight: 700, mb: 2 }}
          >
            Skills 市场
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
            发现、下载和分享 OpenClaw Skills，扩展你的 AI 能力
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
                '&:hover': { background: 'linear-gradient(135deg, #FF5A50, #FF8B8B)' },
              }}
            >
              上传 Skill
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ mb: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Tab label="热门" sx={{ color: 'rgba(255,255,255,0.6)' }} />
          <Tab label="最新" sx={{ color: 'rgba(255,255,255,0.6)' }} />
          <Tab label="我的" sx={{ color: 'rgba(255,255,255,0.6)' }} />
        </Tabs>

        {/* Skills Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {skills.map((skill) => (
            <Card
              key={skill.id}
              sx={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 59, 48, 0.05)',
                  borderColor: 'rgba(255, 59, 48, 0.3)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Code sx={{ color: '#fff', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                      {skill.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      by {skill.author_name}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.6)', mb: 2, minHeight: 40 }}
                >
                  {skill.description}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {skill.tags?.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        background: 'rgba(255, 59, 48, 0.1)',
                        color: '#FF3B30',
                        fontSize: '0.75rem',
                      }}
                    />
                  ))}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pt: 2,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    <Download sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    {skill.download_count} 下载
                  </Typography>
                  <Box>
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      <Favorite sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      <Share sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>上传 Skill</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="名称"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
              InputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              fullWidth
              label="描述"
              value={newSkill.description}
              onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
              InputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              fullWidth
              label="标签（用逗号分隔）"
              value={newSkill.tags}
              onChange={(e) => setNewSkill({ ...newSkill, tags: e.target.value })}
              placeholder="例如: PDF, 工具, 自动化"
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
              InputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              fullWidth
              label="Skill 内容（Markdown）"
              value={newSkill.content}
              onChange={(e) => setNewSkill({ ...newSkill, content: e.target.value })}
              multiline
              rows={6}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
              InputProps={{ style: { color: '#fff' } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
              取消
            </Button>
            <Button
              onClick={handleUploadSkill}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
                '&:hover': { background: 'linear-gradient(135deg, #FF5A50, #FF8B8B)' },
              }}
            >
              上传
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
