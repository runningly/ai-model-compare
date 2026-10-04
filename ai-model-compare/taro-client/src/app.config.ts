export default defineAppConfig({
  pages: [
    'pages/models/index',
    'pages/favorites/index',
    'pages/models/detail',
  ],
  tabBar: {
    color: '#8a8f99',
    selectedColor: '#3b5bff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/models/index', text: '模型列表' },
      { pagePath: 'pages/favorites/index', text: '我的收藏' },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'AI 模型比价',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f6fa',
  },
})
