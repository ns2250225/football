# 方块世界杯：Rogue Football

以世界杯为背景的 Minecraft 风格 3D 方块足球 Roguelike 网页游戏。选择一支国家队，从小组赛一路征战到决赛，通过传球、射门、抢断获取经验，抽取随机技能构筑超能力足球流派，最终捧起世界杯冠军。

**纯前端、完全离线运行，无后端、无远程 API 依赖。**

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Three.js](https://img.shields.io/badge/Three.js-0.169-black) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Zustand](https://img.shields.io/badge/Zustand-4-orange)

## 特性亮点

- **完整世界杯征程**：32 支国家队（独立属性 / 战术 / 专属被动 / 球衣 / 旗帜）、8 组小组赛积分排名 + 16 强至决赛的完整淘汰赛树，共 64 场赛事；玩家只打自己的 7～8 场，其余由基于球队实力的 AI 模拟。
- **5v5 快节奏足球**：自研 120Hz 固定步长足球物理（重力、空气阻力、马格努斯弧线、弹跳、门柱/横梁/球网/球员碰撞），三层 AI（球员 / 球队战术 / 门将）。
- **92 个基础技能 + 20 种进化**：主动、被动、射门、防守、大招五大类，全部数据驱动；满足配方可组合进化（如 火焰射门 + 铁腿 → 炎帝世界波）。
- **Roguelike 成长循环**：比赛内升级三选一、6 槽位 32 件装备、商店、随机事件、比赛任务、金币经济、45 项成就（24 项解锁球队）。
- **方块世界**：8 种主题球场、6 种天气、实例化观众看台、18 种程序化动画，全部原创程序化建模（不使用 Minecraft 官方素材）。
- **BOSS 与特殊事件**：8 种精英 BOSS 模板（阶段机制）、16 种特殊比赛事件（雷暴、冰雪球场、巨型球门、双足球等）。
- **多端支持**：PC 键盘 + 移动端虚拟摇杆/按钮，IndexedDB 多重存档（主存档 + 安全存档 + LocalStorage 备份），支持导出/导入 JSON 存档。

## 快速开始

环境要求：Node.js ≥ 18，包管理器 npm。

```bash
# 安装依赖
npm install

# 开发模式（浏览器打开终端中显示的地址）
npm run dev

# 生产构建（先 tsc 类型检查，输出到 dist/）
npm run build

# 本地预览生产构建
npm run preview
```

## 操作说明

| 按键 | 操作 |
| --- | --- |
| WASD / 方向键 | 移动 |
| Shift | 冲刺 |
| 空格（按住/松开） | 蓄力射门（空中球为头球/凌空） |
| J / K | 短传 / 长传（无球时请求队友传球） |
| L | 抢断（冲刺中为铲球） |
| Q | 切换控制球员 |
| E / 1~4 / F | 释放选中技能 / 直接释放对应技能 / 切换选中技能 |
| R | 释放大招 |
| Tab | 战术面板 |
| Esc | 暂停 |

移动端：左侧虚拟摇杆，右侧射门（长按蓄力）、短传、长传、抢断、技能、大招、切换、冲刺按钮。

## 比赛规则

5v5 简化规则：**不设越位**；界外球以手抛传球执行；淘汰赛平局进入 60 秒加时赛，仍平进入点球大战（5 轮 + 突然死亡）。完整规则可在游戏「设置 → 比赛规则」或比赛暂停菜单中查看。

单场比赛结构：上、下半场各 90 秒游戏时间，全场约 3～5 分钟。

## 游戏内容清单（与 PRD 对应）

| 模块 | 数量 | 位置 |
| --- | --- | --- |
| 国家队（独立属性/战术/被动/球衣/旗帜） | 32 | `src/data/teams.ts`、`src/game/player/TeamPassives.ts` |
| 球员阵容（每队 5 首发 + 3 替补） | 256 | `src/data/players.ts` |
| 主动 / 被动 / 射门 / 防守 / 大招 | 20 / 24 / 20 / 16 / 12 | `src/data/skills.ts` |
| 进化技能 | 20 | `src/data/skills.ts`（`EVOLUTION_SKILLS`） |
| 装备（6 槽位） | 32 | `src/data/equipment.ts` |
| 球场 / 天气 | 8 / 6 | `src/data/stadiums.ts`、`src/game/world/` |
| 特殊事件 | 16 | `src/data/events.ts` |
| BOSS 模板 | 8 | `src/data/bosses.ts`、`src/game/skills/BossSystem.ts` |
| 商店商品 / 属性强化 / 任务池 | 10 / 8 / 16 | `src/data/shop.ts` |
| 成就（24 项解锁球队） | 45 | `src/data/achievements.ts` |
| 球员动画 | 18 | `src/game/player/AnimationManager.ts` |
| 难度 | 5 | `src/game/types.ts` |
| 世界杯赛事 | 64 场 | `src/game/tournament/` |

## 项目架构

```
src/
├── app/            App 根组件（异常边界 + 安全存档恢复）、页面路由
├── components/     React UI：主菜单、模式、选队、赛程、HUD、三选一、装备、商店、图鉴、成就、结算、设置
├── game/
│   ├── core/       GameEngine（比赛主控）、固定步长 GameLoop、EventBus、Input、GameState
│   ├── world/      方块球场、草坪标线、球门、看台、实例化观众、天气、天空盒
│   ├── player/     方块人物模型、程序化动画、球员 AI / 球队 AI / 门将 AI、玩家操控、国家队被动
│   ├── football/   足球、物理、射门、传球、进球判定、比赛规则、现场点球大战
│   ├── skills/     数据驱动技能注册表、执行器、技能管理、进化、技能池（三选一）、大招、BOSS
│   ├── roguelike/  经验等级、奖励、商店、装备、事件、比赛规划、随机数
│   ├── tournament/ 分组、小组赛积分、淘汰赛映射、AI 模拟、点球
│   ├── vfx/        实例化方块粒子、技能特效对象池
│   └── audio/      WebAudio 程序化音效与环境音
├── data/           所有球队、技能、装备、球场、事件、BOSS、成就配置
├── store/          Zustand 状态（游戏、HUD、赛事、技能）、IndexedDB 存档
└── utils/          数学、随机、物理常量、平衡参数
```

### 技能数据驱动

所有技能都由同一组操作原语（`buff`、`status`、`dash`、`pullBall`、`clone`、`nextShot`、`shootNow`、`meteor`、`thunderAll` 等）与射门规格（形态 + 威力/精度/弧线/追踪/折射/爆炸/冰冻等字段）组合而成，由 `SkillExecutor` 统一执行，没有为单个技能编写独立主逻辑。射门技能叠加时，形态按优先级唯一、数值叠加、范围取最大，并设有平衡上限。

## 部署

构建产物为纯静态文件，`vite.config.ts` 中 `base: './'` 使用相对路径，可直接部署到任意静态托管（Vercel / Netlify / Cloudflare Pages / GitHub Pages / Nginx）：

```bash
npm run build   # 产物在 dist/，整个目录上传即可
```

GitHub Pages 示例：将 `dist/` 内容推送到 `gh-pages` 分支，或在 CI 中执行 `npm run build` 后部署 `dist/`。

## 技术栈与实现说明

- React 18 + TypeScript + Vite + Three.js + Zustand + Tailwind CSS；React Three Fiber + Drei 用于球衣 3D 预览与冠军奖杯。
- 比赛场景使用命令式 Three.js（避免逐帧 React 重渲染），HUD 通过独立 store 以 10Hz 推送。
- 物理采用自研 120Hz 固定步长足球物理，未引入 Rapier，便于精细控制足球手感与确定性。
- 动画采用共享骨骼的程序化动画库（18 种），未使用 AnimationMixer 关键帧剪辑。
- 音效与环境音全部由 WebAudio 实时合成（无外部音频资源，保证离线），未使用 Howler.js。
- 存档：IndexedDB 主存档 + 上一次安全存档 + LocalStorage 备份，支持导出/导入 JSON 存档文件。
- 美术为原创程序化方块建模，不使用任何 Minecraft 官方模型、材质、音效或商标。

## 许可证

仅供学习交流使用。
