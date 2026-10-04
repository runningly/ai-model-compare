import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { getFavoriteIds, addFavorite, removeFavorite } from '../api/favorites'

const STORAGE_KEY = 'favorite_model_ids'
const DEVICE_KEY = 'device_id'

function loadIds(): string[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    return raw ? JSON.parse(raw as string) : []
  } catch {
    return []
  }
}

function persistIds(list: string[]) {
  Taro.setStorageSync(STORAGE_KEY, JSON.stringify(list))
}

/** 演示阶段没有登录体系，用本地生成的设备 ID 标识用户 */
function getDeviceId(): string {
  let id = Taro.getStorageSync(DEVICE_KEY) as string
  if (!id) {
    id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    Taro.setStorageSync(DEVICE_KEY, id)
  }
  return id
}

// 模块级单例：与 Pinia store 等价的创建时机（import 时执行一次）
const deviceId = getDeviceId()
let hydrateTask: Promise<void> | null = null

interface FavoritesState {
  ids: string[]
  has: (id: string) => boolean
  /** 启动/进入收藏页时从服务端同步；失败则沿用本地缓存，下次可重试 */
  hydrate: () => Promise<void>
  /** 乐观更新本地并持久化，再异步同步到服务端 */
  toggle: (id: string) => void
}

/** 收藏状态：本地乐观更新 + 服务端同步（zustand 版，对标 uni-app 的 Pinia 实现） */
export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  ids: loadIds(),

  has: (id) => get().ids.includes(id),

  hydrate: () => {
    if (!hydrateTask) {
      hydrateTask = getFavoriteIds(deviceId)
        .then((list) => {
          set({ ids: list })
          persistIds(list)
        })
        .catch(() => {
          // 网络失败：保留本地缓存，并允许下次 hydrate 重试
          hydrateTask = null
        })
    }
    return hydrateTask
  },

  toggle: (id) => {
    const ids = get().ids
    const adding = !ids.includes(id)
    const next = adding ? [...ids, id] : ids.filter((x) => x !== id)
    set({ ids: next })
    persistIds(next)

    // 失败提示已由 request 层统一弹出；本地与服务端的差异会在下次 hydrate 时对齐
    if (adding) {
      addFavorite(deviceId, id).catch(() => {})
    } else {
      removeFavorite(deviceId, id).catch(() => {})
    }
  },
}))
