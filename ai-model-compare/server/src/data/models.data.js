/**
 * 模型演示数据（seed 脚本的数据源）
 * -------------------------------------------------
 * 说明：这是一份"静态快照"，与前端 mock 数据保持一致，真实项目应以官网实时定价为准。
 * 价格单位：元 / 百万 tokens（即每调用一百万 tokens 的费用）。
 *
 * 各字段含义：
 * - id            模型唯一标识，同时作为数据库 models 表的主键
 * - modelName     模型显示名
 * - vendor        所属厂商
 * - contextLength 上下文长度（单位：K tokens）
 * - maxOutput     最大输出长度（单位：K tokens）
 * - priceList     价格结构。注意：不同厂商的字段并不统一！
 *     · input / output    输入 / 输出单价（免费模型可传 null，如 glm-4.5-flash）
 *     · cacheHit          缓存命中单价（仅部分厂商提供）
 *     · peak / offPeak    高峰 / 低谷时段价（仅部分厂商提供，DeepSeek 有）
 *   —— 正因为结构不统一，入库时才整体存成 JSON 字符串（models.price_list），
 *      读取时原样还原，由前端按"字段是否存在"做兼容展示。
 * - features      特性标签数组
 * - purchaseUrl   官方购买 / 控制台地址
 * - free          是否免费
 * - remark        备注说明
 */
export const models = [
  {
    id: 'deepseek-chat',
    modelName: 'deepseek-chat',
    vendor: 'DeepSeek',
    contextLength: 128,
    maxOutput: 8,
    priceList: {
      input: 0.8,
      output: 2,
      cacheHit: 0.2,
      peak: { input: 0.8, output: 2 },
      offPeak: { input: 0.4, output: 1 },
    },
    features: ['通用对话', '缓存命中 0.2 元', '空闲时段 5 折'],
    purchaseUrl: 'https://platform.deepseek.com',
    free: false,
    remark: 'V3.2 系列，非思维链模型',
  },
  {
    id: 'deepseek-reasoner',
    modelName: 'deepseek-reasoner',
    vendor: 'DeepSeek',
    contextLength: 128,
    maxOutput: 64,
    priceList: {
      input: 2,
      output: 8,
      cacheHit: 0.55,
      peak: { input: 2, output: 8 },
      offPeak: { input: 1, output: 4 },
    },
    features: ['深度推理', '思维链展示', '空闲时段 5 折'],
    purchaseUrl: 'https://platform.deepseek.com',
    free: false,
    remark: 'R1 系列，数学 / 代码推理能力强',
  },
  {
    id: 'glm-4.5',
    modelName: 'glm-4.5',
    vendor: '智谱GLM',
    contextLength: 128,
    maxOutput: 96,
    priceList: { input: 0.8, output: 2, cacheHit: 0.28 },
    features: ['推理模式', '工具调用', '支持资源包'],
    purchaseUrl: 'https://open.bigmodel.cn',
    free: false,
    remark: '智谱旗舰模型，Agentic 能力突出',
  },
  {
    id: 'glm-4.5-flash',
    modelName: 'glm-4.5-flash',
    vendor: '智谱GLM',
    contextLength: 128,
    maxOutput: 96,
    priceList: { input: null, output: null },
    features: ['限时免费', '轻量任务'],
    purchaseUrl: 'https://open.bigmodel.cn',
    free: true,
    remark: 'Flash 系列限免，适合高频轻量调用',
  },
  {
    id: 'qwen-max',
    modelName: 'qwen-max',
    vendor: '通义千问',
    contextLength: 32,
    maxOutput: 8,
    priceList: { input: 2.4, output: 9.6 },
    features: ['旗舰能力', '复杂任务'],
    purchaseUrl: 'https://bailian.console.aliyun.com',
    free: false,
    remark: '阿里云百炼平台旗舰模型',
  },
  {
    id: 'qwen-plus',
    modelName: 'qwen-plus',
    vendor: '通义千问',
    contextLength: 128,
    maxOutput: 8,
    priceList: { input: 0.8, output: 2 },
    features: ['均衡性价比', '128K 上下文'],
    purchaseUrl: 'https://bailian.console.aliyun.com',
    free: false,
    remark: '效果与成本均衡的主力模型',
  },
  {
    id: 'qwen-flash',
    modelName: 'qwen-flash',
    vendor: '通义千问',
    contextLength: 128,
    maxOutput: 8,
    priceList: { input: 0.3, output: 0.6 },
    features: ['高吞吐', '超低价'],
    purchaseUrl: 'https://bailian.console.aliyun.com',
    free: false,
    remark: '追求极致成本的轻量模型',
  },
  {
    id: 'doubao-1.5-pro-32k',
    modelName: 'doubao-1.5-pro-32k',
    vendor: '豆包',
    contextLength: 32,
    maxOutput: 12,
    priceList: { input: 0.8, output: 2 },
    features: ['火山引擎', '稳定可靠'],
    purchaseUrl: 'https://console.volcengine.com/ark',
    free: false,
    remark: '字节跳动旗舰模型（32K 版本）',
  },
  {
    id: 'doubao-1.5-lite-32k',
    modelName: 'doubao-1.5-lite-32k',
    vendor: '豆包',
    contextLength: 32,
    maxOutput: 12,
    priceList: { input: 0.3, output: 0.6 },
    features: ['轻量低价', '高频场景'],
    purchaseUrl: 'https://console.volcengine.com/ark',
    free: false,
    remark: '豆包轻量版',
  },
  {
    id: 'kimi-k2-0905',
    modelName: 'kimi-k2-0905',
    vendor: 'Kimi',
    contextLength: 256,
    maxOutput: 8,
    priceList: { input: 4, output: 16, cacheHit: 1 },
    features: ['万亿参数 MoE', 'Agentic 强', '256K 上下文'],
    purchaseUrl: 'https://platform.moonshot.cn',
    free: false,
    remark: 'Moonshot 旗舰，与开源版本同款',
  },
]
