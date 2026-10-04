import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'favorite_model_ids'

function loadIds(): string[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 收藏状态：跨页面共享 + 本地持久化（M3 核心技能点） */
export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>(loadIds())

  const count = computed(() => ids.value.length)
  const has = (id: string) => ids.value.includes(id)

  function toggle(id: string) {
    const idx = ids.value.indexOf(id)
    if (idx >= 0) ids.value.splice(idx, 1)
    else ids.value.push(id)
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(ids.value))
  }

  return { ids, count, has, toggle }
})
