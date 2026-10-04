/**
 * 接口基础地址
 * - 开发环境：直连本地 Express 服务（微信开发者工具需勾选「不校验合法域名」）
 * - 生产环境：TODO 部署后端后替换为真实域名
 */
export const BASE_URL: string = import.meta.env.DEV
  ? 'http://localhost:3000'
  : ''
