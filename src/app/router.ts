// 页面路由：游戏使用单页状态路由（无需 URL），所有页面由 gameStore.screen 驱动
export type { Screen } from '../store/gameStore';
export const SCREEN_TITLES: Record<string, string> = {
  menu: '主菜单', mode: '世界杯模式', teamSelect: '选择国家队', coreSelect: '选择核心球员', hub: '世界杯赛程', match: '比赛', shop: '商店',
  manage: '球队管理', encyclopedia: '图鉴', achievements: '成就', settings: '设置', tournamentEnd: '世界杯结算',
};
