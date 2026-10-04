import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getFavoriteIds, addFavorite, removeFavorite } from '@/api/favorites'

const STORAGE_KEY = 'favorite_model_ids'
const DEVICE_KEY = 'device_id'

function loadIds(): string[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistIds(list: string[]) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(list))
}

/** 演示阶段没有登录体系，用本地生成的设备 ID 标识用户 */
function getDeviceId(): string {
  let id = uni.getStorageSync(DEVICE_KEY) as string
  if (!id) {
    id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    uni.setStorageSync(DEVICE_KEY, id)
  }
  return id
}

/** 收藏状态：本地乐观更新 + 服务端同步（M5 接口联调核心） */
export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>(loadIds())
  const deviceId = getDeviceId()

  const count = computed(() => ids.value.length)
  const has = (id: string) => ids.value.includes(id)

  // 仅合并「在途」请求：完成后置空，下次 hydrate 重新拉取，保证每次进收藏页都同步云端
  let hydrateTask: Promise<void> | null = null
  // 本地 toggle 计数：hydrate 返回的旧快照若与中途的 toggle 竞态，跳过回写，下次同步对齐
  let toggleSeq = 0

  /** 启动/进入收藏页时从服务端同步；失败则沿用本地缓存，下次可重试 */
  function hydrate(): Promise<void> {
    if (!hydrateTask) {
      const seq = toggleSeq
      hydrateTask = getFavoriteIds(deviceId)
        .then((list) => {
          hydrateTask = null
          // 同步期间发生过本地 toggle：不用旧快照覆盖乐观更新，留待下次 hydrate 对齐
          if (seq === toggleSeq) {
            ids.value = list
            persistIds(list)
          }
        })
        .catch(() => {
          // 网络失败：保留本地缓存，并允许下次 hydrate 重试
          hydrateTask = null
        })
    }
    return hydrateTask
  }

  /** 乐观更新本地并持久化，再异步同步到服务端 */
  async function toggle(id: string) {
    toggleSeq += 1
    const adding = !ids.value.includes(id)
    if (adding) ids.value.push(id)
    else ids.value = ids.value.filter((x) => x !== id)
    persistIds(ids.value)

    try {
      if (adding) await addFavorite(deviceId, id)
      else await removeFavorite(deviceId, id)
    } catch {
      // 失败提示已由 request 层统一弹出；本地与服务端的差异会在下次 hydrate 时对齐
    }
  }

  return { ids, count, has, toggle, hydrate }
})
