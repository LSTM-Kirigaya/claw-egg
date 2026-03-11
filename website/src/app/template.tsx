import ThemeProvider from '@/components/ThemeProvider'

export default function Template({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
