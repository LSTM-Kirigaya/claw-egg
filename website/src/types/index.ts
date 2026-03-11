export interface DownloadInfo {
  platform: 'windows' | 'mac'
  url: string
  version: string
  size: string
}

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

export interface HeroSection {
  title: string
  subtitle: string
  description: string
}

export interface Feature {
  icon: string
  title: string
  description: string
}
