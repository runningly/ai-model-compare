import Taro from '@tarojs/taro'
import { BASE_URL } from '../config/env'

/** 后端统一响应结构 */
interface ApiResp<T> {
  code: number
  message: string
  data: T
}

export interface ReqOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  /** 传入则展示 loading 提示文案 */
  loading?: string
  /** 静默模式：失败不弹 toast（如启动时的收藏同步） */
  silent?: boolean
}

/** Taro.request 的 Promise 封装：统一拼接 baseURL、超时与错误提示 */
export function request<T>(opts: ReqOptions): Promise<T> {
  const { url, method = 'GET', data, loading, silent } = opts
  if (loading) Taro.showLoading({ title: loading, mask: true })

  return new Promise<T>((resolve, reject) => {
    Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      timeout: 10000,
      success: (res) => {
        const body = res.data as ApiResp<T>
        if (res.statusCode === 200 && body && body.code === 0) {
          resolve(body.data)
          return
        }
        const msg = body?.message || `请求失败（HTTP ${res.statusCode}）`
        if (loading) Taro.hideLoading()
        if (!silent) Taro.showToast({ title: msg, icon: 'none' })
        reject(new Error(msg))
      },
      fail: (err) => {
        if (loading) Taro.hideLoading()
        if (!silent) Taro.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
        reject(new Error(err.errMsg))
      },
      complete: () => {
        if (loading) Taro.hideLoading()
      },
    })
  })
}
