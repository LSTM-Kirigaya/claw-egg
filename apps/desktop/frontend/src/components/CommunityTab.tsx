import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Avatar,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material'
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Share2,
  Search,
  Plus,
  TrendingUp,
  Sparkles,
  Flame
} from 'lucide-react'
import { CommunityPost } from '../types'

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} className="w-full">
      {value === index && <Box className="pt-3">{children}</Box>}
    </div>
  )
}

// Mock data for community posts
const MOCK_POSTS: CommunityPost[] = [
  {
    id: '1',
    title: 'OpenClaw v2.0 发布，支持更多模型提供商！',
    author: 'OpenClaw Team',
    content: '我们很高兴地宣布 OpenClaw v2.0 正式发布。这个版本带来了对 Anthropic Claude、Google Gemini 等更多模型提供商的支持...',
    created_at: '2024-03-08',
    likes: 256,
    comments: 48,
    tags: ['announcement', 'release'],
  },
  {
    id: '2',
    title: '如何配置飞书机器人 webhook？',
    author: 'TechGuru',
    content: '最近很多小伙伴问如何配置飞书机器人的 webhook，这里分享一个详细的教程...',
    created_at: '2024-03-07',
    likes: 128,
    comments: 32,
    tags: ['tutorial', 'feishu'],
  },
  {
    id: '3',
    title: '分享我的 OpenClaw 插件开发经验',
    author: 'DevMaster',
    content: '开发 OpenClaw 插件已经有一段时间了，总结了一些经验和最佳实践，希望对大家有所帮助...',
    created_at: '2024-03-06',
    likes: 89,
    comments: 24,
    tags: ['plugin', 'development'],
  },
  {
    id: '4',
    title: '使用 OpenClaw 构建企业知识库问答系统',
    author: 'AIFan',
    content: '分享一个实际案例：如何使用 OpenClaw 配合向量数据库构建企业知识库问答系统...',
    created_at: '2024-03-05',
    likes: 167,
    comments: 41,
    tags: ['use-case', 'enterprise'],
  },
  {
    id: '5',
    title: 'Qwen 和 GPT-4 在 OpenClaw 中的对比评测',
    author: 'ModelTester',
    content: '对 Qwen-Turbo、Qwen-Max 和 GPT-4 在相同任务下的表现进行了详细对比...',
    created_at: '2024-03-04',
    likes: 234,
    comments: 67,
    tags: ['comparison', 'llm'],
  },
]

const TAGS = ['全部', 'announcement', 'tutorial', 'plugin', 'use-case', 'development']

interface CommunityTabProps {
  themeMode: 'light' | 'dark';
}

export function CommunityTab({ themeMode }: CommunityTabProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('全部')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '' })

  // Simulate loading posts
  useEffect(() => {
    setTimeout(() => {
      setPosts(MOCK_POSTS)
      setFilteredPosts(MOCK_POSTS)
      setIsLoading(false)
    }, 600)
  }, [])

  // Filter posts
  useEffect(() => {
    let filtered = posts

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.author.toLowerCase().includes(query)
      )
    }

    // Tag filter
    if (selectedTag !== '全部') {
      filtered = filtered.filter((p) => p.tags.includes(selectedTag))
    }

    // Tab filter (simplified sorting)
    if (activeTab === 1) {
      // Hot - sort by likes
      filtered = [...filtered].sort((a, b) => b.likes - a.likes)
    } else if (activeTab === 2) {
      // New - already sorted by date in mock
    }

    setFilteredPosts(filtered)
  }, [searchQuery, selectedTag, activeTab, posts])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    )
  }

  const handleCreatePost = () => {
    const post: CommunityPost = {
      id: String(Date.now()),
      title: newPost.title,
      author: '我',
      content: newPost.content,
      created_at: new Date().toISOString().split('T')[0],
      likes: 0,
      comments: 0,
      tags: newPost.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }
    setPosts([post, ...posts])
    setCreateDialogOpen(false)
    setNewPost({ title: '', content: '', tags: '' })
  }

  // 紧凑的输入框样式
  const compactTextFieldProps = {
    size: 'small' as const,
    InputProps: { sx: { fontSize: 13 } },
    InputLabelProps: { sx: { fontSize: 13 } },
    sx: { '& .MuiInputBase-input': { py: 1 } }
  }

  return (
    <Box className="h-full flex flex-col p-3">
      {/* Header */}
      <Box className="flex items-center justify-between mb-3">
        <Typography variant="subtitle1" className="font-semibold flex items-center gap-1.5 text-sm">
          <MessageSquare className="w-4 h-4 text-primary" />
          社区
        </Typography>
        <Fab
          size="small"
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
          sx={{ width: 32, height: 32, color: '#FFFFFF' }}
        >
          <Plus className="w-4 h-4" />
        </Fab>
      </Box>

      {/* Search */}
      <TextField
        placeholder="搜索讨论..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-3"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search className="text-gray-400 w-4 h-4" />
            </InputAdornment>
          ),
          sx: { fontSize: 13 }
        }}
      />

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        className="border-b mb-2"
        sx={{ 
          minHeight: 36,
          '& .MuiTabs-flexContainer': { minHeight: 36 },
          '& .MuiTab-root': { 
            minHeight: 36, 
            py: 0.5, 
            px: 1.5,
            fontSize: 12,
            textTransform: 'none',
            gap: 0.5
          }
        }}
      >
        <Tab icon={<TrendingUp className="w-3.5 h-3.5" />} iconPosition="start" label="推荐" />
        <Tab icon={<Flame className="w-3.5 h-3.5" />} iconPosition="start" label="热门" />
        <Tab icon={<Sparkles className="w-3.5 h-3.5" />} iconPosition="start" label="最新" />
      </Tabs>

      {/* Tags */}
      <Box className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {TAGS.map((tag) => (
          <Chip
            key={tag}
            label={tag === '全部' ? '全部' : tag}
            onClick={() => setSelectedTag(tag)}
            color={selectedTag === tag ? 'primary' : 'default'}
            variant={selectedTag === tag ? 'filled' : 'outlined'}
            className="cursor-pointer"
            size="small"
            sx={{ height: 22, fontSize: 10 }}
          />
        ))}
      </Box>

      {/* Posts List */}
      <Box className="flex-1 overflow-auto">
        {isLoading ? (
          <Box className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : filteredPosts.length === 0 ? (
          <Box className="text-center py-8">
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>暂无相关内容</Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 0 }}>
            {filteredPosts.map((post) => (
              <Card 
                key={post.id}
                variant="outlined"
                className="mb-2 hover:shadow-md transition-shadow cursor-pointer"
                sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
              >
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box className="flex items-start gap-2">
                    <Avatar className="bg-primary" sx={{ width: 28, height: 28, fontSize: 12 }}>
                      {post.author[0]}
                    </Avatar>
                    <Box className="flex-1 min-w-0">
                      <Typography variant="subtitle2" className="font-semibold mb-0.5" sx={{ fontSize: 13, lineHeight: 1.3 }}>
                        {post.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" className="mb-1.5 block" sx={{ fontSize: 10 }}>
                        {post.author} · {post.created_at}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="line-clamp-2 mb-1.5"
                        sx={{ fontSize: 11, lineHeight: 1.4 }}
                      >
                        {post.content}
                      </Typography>

                      {/* Tags */}
                      <Box className="flex gap-1 mb-1.5">
                        {post.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 16, fontSize: 9 }} />
                        ))}
                      </Box>

                      {/* Actions */}
                      <Box className="flex items-center gap-3">
                        <Tooltip title="点赞">
                          <Button
                            size="small"
                            startIcon={<ThumbsUp className="w-3.5 h-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLike(post.id)
                            }}
                            sx={{ fontSize: 11, py: 0.25, minHeight: 24, px: 1 }}
                          >
                            {post.likes}
                          </Button>
                        </Tooltip>
                        <Tooltip title="评论">
                          <Button
                            size="small"
                            startIcon={<MessageCircle className="w-3.5 h-3.5" />}
                            sx={{ fontSize: 11, py: 0.25, minHeight: 24, px: 1 }}
                          >
                            {post.comments}
                          </Button>
                        </Tooltip>
                        <Tooltip title="分享">
                          <IconButton size="small" className="ml-auto" sx={{ p: 0.5 }}>
                            <Share2 className="w-3.5 h-3.5" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Box>

      {/* Create Post Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ py: 2, px: 2.5, fontSize: 14 }}>发布新话题</DialogTitle>
        <DialogContent sx={{ py: 1.5, px: 2.5 }}>
          <TextField
            label="标题"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            fullWidth
            className="mb-3"
            {...compactTextFieldProps}
          />
          <TextField
            label="内容"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            fullWidth
            multiline
            rows={3}
            className="mb-3"
            {...compactTextFieldProps}
          />
          <TextField
            label="标签 (用逗号分隔)"
            value={newPost.tags}
            onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
            fullWidth
            placeholder="例如: tutorial, tips"
            helperText="可选，用逗号分隔多个标签"
            FormHelperTextProps={{ sx: { fontSize: 10 } }}
            {...compactTextFieldProps}
          />
        </DialogContent>
        <DialogActions sx={{ py: 1.5, px: 2.5 }}>
          <Button onClick={() => setCreateDialogOpen(false)} size="small" sx={{ fontSize: 12 }}>取消</Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleCreatePost}
            disabled={!newPost.title || !newPost.content}
            sx={{
              fontSize: 12,
              bgcolor: 'primary.main',
              color: '#FFFFFF',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            发布
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
