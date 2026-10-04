import { request } from '../utils/request'

/** 获取用户收藏的模型 id 列表（静默：失败由调用方回退本地缓存） */
export function getFavoriteIds(userId: string): Promise<string[]> {
  return request<string[]>({
    url: `/api/favorites?userId=${encodeURIComponent(userId)}`,
    silent: true,
  })
}

/** 添加收藏 */
export function addFavorite(userId: string, modelId: string): Promise<null> {
  return request<null>({
    url: '/api/favorites',
    method: 'POST',
    data: { userId, modelId },
  })
}

/** 取消收藏 */
export function removeFavorite(userId: string, modelId: string): Promise<null> {
  return request<null>({
    url: `/api/favorites/${encodeURIComponent(modelId)}?userId=${encodeURIComponent(userId)}`,
    method: 'DELETE',
  })
}
