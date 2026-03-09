import { useState } from 'react'
import {
  Box,
  Paper,
  Tooltip
} from '@mui/material'
import {
  Settings,
  Puzzle,
  MessageSquare
} from 'lucide-react'
import { ManageTab } from './ManageTab'
import { MarketplaceTab } from './MarketplaceTab'
import { CommunityTab } from './CommunityTab'
import { MainTab } from '../types'

interface MainLayerProps {
  themeMode: 'light' | 'dark';
}

const TABS = [
  { id: 'manage' as MainTab, icon: Settings, label: '管理' },
  { id: 'marketplace' as MainTab, icon: Puzzle, label: '插件市场' },
  { id: 'community' as MainTab, icon: MessageSquare, label: '社区' },
]

export function MainLayer({ themeMode }: MainLayerProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('manage')

  return (
    <Box className="h-full flex">
      {/* 左侧边栏 - VSCode 风格 */}
      <Paper 
        elevation={0}
        className={`h-full flex flex-col items-center py-2 ${
          themeMode === 'dark' 
            ? 'bg-[#1C1C1C] border-r border-[#404040]' 
            : 'bg-gray-50 border-r border-[#E0E0E0]'
        }`}
        sx={{ 
          width: 40,
          minWidth: 40,
          borderRadius: 0 
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <Tooltip 
              key={tab.id} 
              title={tab.label} 
              placement="right"
              arrow
            >
              <Box
                component="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center justify-center mb-1
                  transition-all duration-200 ease-in-out
                  ${isActive 
                    ? themeMode === 'dark' 
                      ? 'text-primary' 
                      : 'text-primary'
                    : themeMode === 'dark'
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }
                `}
                sx={{
                  width: 32,
                  height: 32,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: themeMode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                  ...(isActive && {
                    bgcolor: themeMode === 'dark' 
                      ? 'rgba(255, 59, 48, 0.15)' 
                      : 'rgba(255, 59, 48, 0.1)',
                  }),
                }}
              >
                <Icon className="w-4 h-4" />
                {/* 活动指示器 */}
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 2,
                      height: 16,
                      bgcolor: '#FF3B30',
                      borderRadius: '0 2px 2px 0',
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Paper>

      {/* 主内容区域 */}
      <Box className="flex-1 overflow-hidden">
        {activeTab === 'manage' && <ManageTab themeMode={themeMode} />}
        {activeTab === 'marketplace' && <MarketplaceTab themeMode={themeMode} />}
        {activeTab === 'community' && <CommunityTab themeMode={themeMode} />}
      </Box>
    </Box>
  )
}
