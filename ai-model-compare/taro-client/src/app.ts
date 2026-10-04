import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { useFavoritesStore } from './stores/favorites'

import './app.css'

function App({ children }: PropsWithChildren) {
  const hydrate = useFavoritesStore((s) => s.hydrate)

  useLaunch(() => {
    // 启动时从服务端同步收藏（失败静默，回退本地缓存）
    hydrate()
  })

  // children 是将要渲染的页面
  return children
}

export default App
