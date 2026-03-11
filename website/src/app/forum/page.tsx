'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material'
import {
  Comment,
  Add,
  Visibility,
} from '@mui/icons-material'
import { supabase, type ForumPost } from '@/lib/supabase'

const categories = ['全部', '问答', '分享', '教程', '反馈', '闲聊']

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '问答',
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      // Mock data
      setPosts([
        {
          id: '1',
          title: '如何配置飞书机器人 webhook？',
          content: '我按照文档配置了 webhook，但是收不到消息，有人遇到过吗？',
          author_id: '1',
          author_name: '新手用户',
          category: '问答',
          views: 128,
          replies: 8,
          created_at: '2025-03-10T10:00:00Z',
          updated_at: '2025-03-10T10:00:00Z',
          is_pinned: true,
        },
        {
          id: '2',
          title: '分享一个我写的 PDF 处理 skill',
          content: '支持旋转、合并、提取文本，需要的可以下载试试...',
          author_id: '2',
          author_name: 'Skill开发者',
          category: '分享',
          views: 256,
          replies: 15,
          created_at: '2025-03-09T08:00:00Z',
          updated_at: '2025-03-09T08:00:00Z',
          is_pinned: false,
        },
        {
          id: '3',
          title: '【教程】从零开始搭建 OpenClaw',
          content: '详细步骤包括环境准备、配置、部署等...',
          author_id: '3',
          author_name: '资深用户',
          category: '教程',
          views: 512,
          replies: 32,
          created_at: '2025-03-08T12:00:00Z',
          updated_at: '2025-03-08T12:00:00Z',
          is_pinned: true,
        },
      ])
    }
  }

  async function handleCreatePost() {
    try {
      const { error } = await supabase.from('forum_posts').insert([
        {
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          author_id: 'current_user',
          author_name: '当前用户',
          views: 0,
          replies: 0,
          is_pinned: false,
        },
      ])

      if (error) throw error

      setCreateDialogOpen(false)
      setNewPost({ title: '', content: '', category: '问答' })
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('发布失败，请检查 Supabase 配置')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Box sx={{ pt: 12, pb: 8, minHeight: '100vh', background: '#0a0a0f' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
              社区论坛
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              交流经验、分享技能、共同成长
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
              '&:hover': { background: 'linear-gradient(135deg, #FF5A50, #FF8B8B)' },
            }}
          >
            发布帖子
          </Button>
        </Box>

        {/* Category Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ mb: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map((cat) => (
            <Tab key={cat} label={cat} sx={{ color: 'rgba(255,255,255,0.6)' }} />
          ))}
        </Tabs>

        {/* Posts List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {posts.map((post) => (
            <Card
              key={post.id}
              sx={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 59, 48, 0.05)',
                  borderColor: 'rgba(255, 59, 48, 0.3)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Avatar */}
                  <Avatar
                    sx={{
                      background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
                      width: 40,
                      height: 40,
                    }}
                  >
                    {post.author_name[0]}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    {/* Title & Category */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                        {post.title}
                      </Typography>
                      <Chip
                        label={post.category}
                        size="small"
                        sx={{
                          background: 'rgba(255, 59, 48, 0.1)',
                          color: '#FF3B30',
                          fontSize: '0.75rem',
                        }}
                      />
                      {post.is_pinned && (
                        <Chip
                          label="置顶"
                          size="small"
                          sx={{
                            background: 'rgba(255, 193, 7, 0.1)',
                            color: '#FFC107',
                            fontSize: '0.75rem',
                          }}
                        />
                      )}
                    </Box>

                    {/* Content Preview */}
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}
                    >
                      {post.content.slice(0, 150)}
                      {post.content.length > 150 && '...'}
                    </Typography>

                    {/* Footer */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          {post.author_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          {formatDate(post.created_at)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          <Visibility sx={{ fontSize: 16 }} />
                          <Typography variant="caption">{post.views}</Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          <Comment sx={{ fontSize: 16 }} />
                          <Typography variant="caption">{post.replies}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Create Post Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>发布新帖</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="标题"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
              InputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              select
              fullWidth
              label="分类"
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
              InputProps={{ style: { color: '#fff' } }}
              SelectProps={{
                native: true,
              }}
            >
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="内容"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              multiline
              rows={8}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
              InputProps={{ style: { color: '#fff' } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
              取消
            </Button>
            <Button
              onClick={handleCreatePost}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
                '&:hover': { background: 'linear-gradient(135deg, #FF5A50, #FF8B8B)' },
              }}
            >
              发布
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
