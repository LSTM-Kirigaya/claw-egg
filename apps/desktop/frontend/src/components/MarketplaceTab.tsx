import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Avatar,
  Skeleton,
  Tooltip
} from '@mui/material'
import {
  Search,
  Download,
  Puzzle,
  Star,
  TrendingUp,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { Plugin } from '../types'

// Mock data for marketplace plugins
const MOCK_PLUGINS: Plugin[] = [
  {
    id: '1',
    name: 'GitHub Assistant',
    description: '集成 GitHub API，支持 issue 管理、PR 审查、代码搜索等功能',
    version: '1.2.0',
    author: 'OpenClaw Team',
    downloads: 15234,
    rating: 4.8,
    tags: ['github', 'dev-tools', 'productivity'],
  },
  {
    id: '2',
    name: 'Database Explorer',
    description: '可视化数据库管理工具，支持 MySQL、PostgreSQL、MongoDB',
    version: '2.0.1',
    author: 'DBTools Inc',
    downloads: 8932,
    rating: 4.5,
    tags: ['database', 'sql', 'visualization'],
  },
  {
    id: '3',
    name: 'AI Code Reviewer',
    description: '自动代码审查插件，基于 AI 检测潜在问题和优化建议',
    version: '0.9.5',
    author: 'CodeAI Labs',
    downloads: 6721,
    rating: 4.2,
    tags: ['ai', 'code-quality', 'automation'],
  },
  {
    id: '4',
    name: 'Markdown Master',
    description: '增强型 Markdown 编辑器，支持实时预览、图表、数学公式',
    version: '1.5.0',
    author: 'DocuTools',
    downloads: 22156,
    rating: 4.9,
    tags: ['markdown', 'documentation', 'editor'],
  },
  {
    id: '5',
    name: 'API Tester Pro',
    description: 'REST API 测试工具，支持环境变量、断言、批量测试',
    version: '3.1.2',
    author: 'APITools',
    downloads: 18543,
    rating: 4.6,
    tags: ['api', 'testing', 'http'],
  },
  {
    id: '6',
    name: 'Kubernetes Manager',
    description: 'K8s 集群管理插件，支持 Pod 查看、日志、部署管理',
    version: '2.3.0',
    author: 'K8sTeam',
    downloads: 9876,
    rating: 4.4,
    tags: ['kubernetes', 'devops', 'cloud'],
  },
]

const CATEGORIES = ['全部', '开发工具', 'AI/ML', '生产力', 'DevOps', '文档']

interface MarketplaceTabProps {
  themeMode: 'light' | 'dark';
}

export function MarketplaceTab({ themeMode }: MarketplaceTabProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [installingId, setInstallingId] = useState<string | null>(null)

  // Simulate loading plugins
  useEffect(() => {
    setTimeout(() => {
      setPlugins(MOCK_PLUGINS)
      setFilteredPlugins(MOCK_PLUGINS)
      setIsLoading(false)
    }, 800)
  }, [])

  // Filter plugins based on search and category
  useEffect(() => {
    let filtered = plugins

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    // Category filter (simplified)
    if (selectedCategory !== '全部') {
      const categoryMap: Record<string, string[]> = {
        '开发工具': ['github', 'dev-tools', 'code-quality'],
        'AI/ML': ['ai', 'ml'],
        '生产力': ['productivity'],
        'DevOps': ['devops', 'kubernetes', 'cloud'],
        '文档': ['documentation', 'markdown'],
      }
      const tags = categoryMap[selectedCategory] || []
      filtered = filtered.filter((p) => p.tags.some((t) => tags.includes(t)))
    }

    setFilteredPlugins(filtered)
  }, [searchQuery, selectedCategory, plugins])

  const handleInstall = async (plugin: Plugin) => {
    setInstallingId(plugin.id)
    // Simulate installation
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setPlugins((prev) =>
      prev.map((p) => (p.id === plugin.id ? { ...p, installed: true } : p))
    )
    setInstallingId(null)
    setSelectedPlugin(null)
  }

  const formatDownloads = (num: number): string => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  return (
    <Box className="h-full flex flex-col p-3">
      {/* Header */}
      <Box className="flex items-center justify-between mb-3">
        <Typography variant="subtitle1" className="font-semibold flex items-center gap-1.5 text-sm">
          <Puzzle className="w-4 h-4 text-primary" />
          插件市场
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
          共 {plugins.length} 个插件
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box className="flex gap-3 mb-3">
        <TextField
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search className="text-gray-400 w-4 h-4" />
              </InputAdornment>
            ),
            sx: { fontSize: 13, py: 0.5 }
          }}
        />
      </Box>

      {/* Categories */}
      <Box className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={category}
            onClick={() => setSelectedCategory(category)}
            color={selectedCategory === category ? 'primary' : 'default'}
            variant={selectedCategory === category ? 'filled' : 'outlined'}
            className="cursor-pointer"
            size="small"
            sx={{ fontSize: 11, height: 24 }}
          />
        ))}
      </Box>

      {/* Plugins Grid */}
      <Box className="flex-1 overflow-auto">
        {isLoading ? (
          <Grid container spacing={1.5}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{xs:12, sm:6}} key={i}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                    <Skeleton variant="rectangular" height={40} className="mt-1" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : filteredPlugins.length === 0 ? (
          <Box className="text-center py-8">
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>未找到匹配的插件</Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {filteredPlugins.map((plugin) => (
              <Grid size={{xs:12, sm:6}} key={plugin.id}>
                <Card 
                  variant="outlined"
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => setSelectedPlugin(plugin)}
                  sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box className="flex items-start justify-between mb-1.5">
                      <Box className="flex items-center gap-1.5">
                        <Avatar className="bg-primary text-white" sx={{ width: 28, height: 28, fontSize: 12 }}>
                          {plugin.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" className="font-semibold" sx={{ fontSize: 13, lineHeight: 1.2 }}>
                            {plugin.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                            {plugin.author}
                          </Typography>
                        </Box>
                      </Box>
                      {plugin.installed && (
                        <Chip
                          size="small"
                          color="success"
                          icon={<CheckCircle className="w-3 h-3" />}
                          label="已安装"
                          sx={{ height: 18, fontSize: 9 }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      className="line-clamp-2 mb-1.5"
                      sx={{ fontSize: 11, lineHeight: 1.4 }}
                    >
                      {plugin.description}
                    </Typography>

                    <Box className="flex items-center justify-between">
                      <Box className="flex items-center gap-2">
                        <Box className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <Typography variant="caption" sx={{ fontSize: 11 }}>{plugin.rating}</Typography>
                        </Box>
                        <Box className="flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3 text-gray-400" />
                          <Typography variant="caption" sx={{ fontSize: 11 }}>
                            {formatDownloads(plugin.downloads)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                        v{plugin.version}
                      </Typography>
                    </Box>

                    <Box className="flex gap-0.5 mt-1.5 flex-wrap">
                      {plugin.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag} size="small" label={tag} variant="outlined" sx={{ height: 18, fontSize: 9 }} />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Plugin Detail Dialog */}
      <Dialog
        open={!!selectedPlugin}
        onClose={() => setSelectedPlugin(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedPlugin && (
          <>
            <DialogTitle sx={{ py: 2, px: 2.5 }}>
              <Box className="flex items-center gap-2.5">
                <Avatar className="bg-primary text-white" sx={{ width: 36, height: 36, fontSize: 14 }}>
                  {selectedPlugin.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{selectedPlugin.name}</Typography>
                  <Typography variant="caption" sx={{ fontSize: 11 }}>
                    {selectedPlugin.author} · v{selectedPlugin.version}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ py: 1.5, px: 2.5 }}>
              <Typography variant="body2" className="mb-3" sx={{ fontSize: 13 }}>
                {selectedPlugin.description}
              </Typography>

              <Box className="flex items-center gap-3 mb-3">
                <Box className="flex items-center gap-1">
                  <Rating
                    value={selectedPlugin.rating}
                    precision={0.1}
                    readOnly
                    size="small"
                  />
                  <Typography variant="body2" sx={{ fontSize: 12 }}>{selectedPlugin.rating}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                  {formatDownloads(selectedPlugin.downloads)} 次下载
                </Typography>
              </Box>

              <Box className="flex gap-1.5 flex-wrap">
                {selectedPlugin.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: 10 }} />
                ))}
              </Box>
            </DialogContent>
            <DialogActions sx={{ py: 1.5, px: 2.5 }}>
              <Button onClick={() => setSelectedPlugin(null)} size="small" sx={{ fontSize: 12 }}>关闭</Button>
              <Button
                variant="contained"
                size="small"
                startIcon={
                  selectedPlugin.installed ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : installingId === selectedPlugin.id ? (
                    <span className="animate-spin text-xs">⏳</span>
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )
                }
                disabled={selectedPlugin.installed || installingId === selectedPlugin.id}
                onClick={() => handleInstall(selectedPlugin)}
                sx={{
                  fontSize: 12,
                  bgcolor: 'primary.main',
                  color: '#FFFFFF',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {selectedPlugin.installed
                  ? '已安装'
                  : installingId === selectedPlugin.id
                  ? '安装中...'
                  : '安装'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
