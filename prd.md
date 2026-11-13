# **《方块世界杯：Rogue Football》完整 MVP 产品需求文档（PRD）**



完整内容 MVP

Roguelike

Minecraft 方块 3D

世界杯 32 强



[The Dream: Blockball Ultimate - Minecraft Bedrock Maps - CurseForge](https://images.openai.com/static-rsc-4/iMaGZw4v6EMOYAKkBna6HeCgcpbTDIajekhoe6ycKh6ntFhAn7AoQXcJ2PF0rL0-4Y5XTt18rGx5HdU5cmJ4XwWDX_S8zx3sYOo-W8VuxIdALKxRZi8ahzTj4BcxNxF2howT2-t9fmTw3ODsx-QXgOqXsIdXIcLWGO3lB_2hsQk?purpose=inline)

[堂安律 嫁・明松美玖との馴れ初め 子供を調査 18歳での出会いから2024年結婚までの軌跡と現在の夫婦生活 子どもの情報についても紹介 - 羊たちとともに](https://images.openai.com/static-rsc-4/kDNzOb-8IHUKWnkZY59v8oVMm3yMUEy0BWwB9wpno8El-nxjcRbJDtuMKGJvobDsK3fJUs_9HGTDp4KKI2_4JX0z9F0P1PR1nJlf9eMFB7Jk-UF5kzTgzS-mAd8RSnxrXJlQGH7QqIzEcj6Ojfpw0ouKz7pJOknw_-o4Otyw850?purpose=inline)

[『ブルーロック』｜“エゴこそ武器だ！”日本サッカーの常識をぶち壊す超攻撃的サバイバルスポーツアニメ｜おと](https://images.openai.com/static-rsc-4/oG4b3cnUceXGIum4JlOjeDwETClb_hMjzVG9WTvcItvZp4VEGvxt43jYovLMNKkK6hhHFuEtZA_MNm_GQ3u_K-TpQoz4GPgRpNLvy3JHl9T_TA7P3fGg2Zf7oYvkgysQNfJQUKLTHqTrpO_uaJz6x2N4F8rrNnezPJHdFiR5yiU?purpose=inline)

10

这次将 MVP 定义为**完整玩法版本，而不是功能验证版本**。

第一版就实现完整世界杯 32 支国家队、全部赛事阶段、完整技能池、技能进化、全部大招、装备、商店、随机事件、BOSS 球队和局外解锁系统。不采用先做 4 支球队、12 个技能再逐步补齐的方案。

需要区分两件事：

- **内容完整度：** MVP 就包含全部规划内容。
- **资源制作策略：** 可以复用程序化方块模型、动画模板和材质，但不能因为资源制作成本而删减球队、技能或玩法。

# **一、产品概述**

## **1.1 产品定位**

一款以世界杯为背景、采用 Minecraft 风格 3D 方块美术的足球 Roguelike 网页游戏。

玩家选择一支国家队，组建自己的方块足球阵容，从世界杯小组赛一路挑战 32 支国家队中的其他强队，通过足球比赛获得经验、技能和装备，不断构筑自己的超能力足球流派，最终赢得世界杯冠军。

游戏融合四种核心体验：

1. **Minecraft：** 方块化人物、足球场、观众、建筑、环境和技能特效。
2. **足球竞技：** 传球、射门、盘带、抢断、扑救、战术配合。
3. **Roguelike：** 随机技能、随机装备、技能升级、组合进化。
4. **世界杯：** 32 支国家队、8 个小组、完整淘汰赛、冠军争夺。

## **1.2 产品基本信息**

| 项目    | 规格                       |
| ----- | ------------------------ |
| 游戏名称  | 方块世界杯：Rogue Football     |
| 游戏类型  | 3D 足球竞技 + Roguelike      |
| 游戏视角  | 第三人称斜俯视                  |
| 美术风格  | Minecraft 风格方块像素         |
| 比赛形式  | 5v5 快节奏足球                |
| 球队数量  | 完整 32 支国家队               |
| 世界杯赛制 | 8 组小组赛 + 16 强淘汰赛         |
| 技能系统  | 完整技能池                    |
| 技能品质  | 普通、稀有、史诗、传说              |
| 游戏模式  | 单人世界杯征程                  |
| 游戏平台  | PC 浏览器、移动端浏览器            |
| 网络需求  | 单机运行                     |
| 后端需求  | 无后端，纯前端                  |
| 存档方式  | IndexedDB + LocalStorage |

## **1.3 核心设计原则**

- 32 支球队必须全部可以参与世界杯。
- 每支球队拥有独特属性、战术倾向和专属被动。
- 所有技能在 MVP 中都必须可以正常获得、升级和释放。
- 所有规划中的技能进化组合必须可以触发。
- 世界杯赛程必须真实运行，不能用固定剧情替代。
- 每场比赛的胜负必须由比赛系统决定，不能直接随机判定。
- 每次重新开始世界杯征程，技能和比赛事件都要产生随机变化。

# **二、核心游戏循环**

[World Cup Stadium | Minecraft](https://images.openai.com/static-rsc-4/Pe6-j1KOzi5EVQPx3Gos33EiKvPmuBDL_zWFRFu-sBxdvgnJspeoZyPjN8dYgqT5kHFPHSOmXTlFEt__WaYaFnmnPtKaWs3lxMgGAcVv31Ygu5o7sMGyb3va2b6RLsqRCKNLYN8xt-vhXfKWa4dWta_-2P4lVVM_sEZfQFw7hJ8?purpose=inline)

[minecraft.net](https://www.minecraft.net/sv-se/article/world-cup-stadium-0?utm_source=chatgpt.com)

```
启动游戏
   ↓
选择世界杯难度
   ↓
选择国家队（32选1）
   ↓
选择初始核心球员
   ↓
生成世界杯分组与赛程
   ↓
小组赛阶段
   ↓
进入足球比赛
   ↓
进球、助攻、抢断、获得经验
   ↓
升级：随机三选一技能
   ↓
比赛结束：结算金币和奖励
   ↓
进入球队成长界面
   ↓
商店购买技能和装备
   ↓
继续世界杯征程
   ↓
小组赛晋级
   ↓
16强 → 8强 → 4强
   ↓
半决赛 → 决赛
   ↓
夺得世界杯冠军
   ↓
获得成就、解锁内容
   ↓
开启下一轮世界杯
```

## **2.1 单场比赛时长**

| 比赛阶段 | 游戏时间    |
| ---- | ------- |
| 上半场  | 90 秒    |
| 中场休息 | 技能和装备管理 |
| 下半场  | 90 秒    |
| 加时赛  | 60 秒    |
| 点球大战 | 视比分触发   |

实际时间采用游戏时间，不对应现实足球 45 分钟。

目标单场比赛约 3～5 分钟。

## **2.2 完整世界杯流程**

完整 32 队世界杯采用传统赛制：

| 阶段    | 球队数量 | 比赛数量 |
| ----- | ---- | ---- |
| 小组赛   | 32   | 48   |
| 16 强  | 16   | 8    |
| 8 强   | 8    | 4    |
| 半决赛   | 4    | 2    |
| 决赛    | 2    | 1    |
| 三四名决赛 | 2    | 1    |
| 总计    | 32   | 64   |

玩家只亲自操作所选国家队参加的比赛。

其余国家队比赛由 AI 模拟，模拟过程必须使用球队属性、阵容实力、战术、疲劳和随机事件计算结果，而不是简单随机胜负。

因此，一次完整征程包含 7～8 场玩家实际操作的比赛，具体取决于是否参加三四名决赛。

# **三、世界杯 32 支国家队系统**

## **3.1 完整国家队名单**

MVP 必须提供 32 支球队，全部具有独立的国家队配置、球员配色、属性、AI 战术和专属被动技能。

[Football Soccer by Razzleberries | Map Minecraft Bedrock](https://images.openai.com/static-rsc-4/vpWOoAsrhVvKM0AEDBStryLksjfUapdJdN5sIepwdXiroChF6fzt_dXrm7n6ZhvEE4-i0rSRPMu370mbxwpSl3CNYGyHtLiS0_eSmmtMGIS6uSKxJtz6NxdI5mvwZIFzSUO9Tm46Rvww3gXDBOxLNUrGvjX6eJSAlXCD0UsFMOk?purpose=inline)

[bedrockuniverse.com](https://www.bedrockuniverse.com/en/minecraft-marketplace/map/football-soccer?utm_source=chatgpt.com)

| 编号 | 国家队  | 战术风格 | 专属被动      |
| -- | ---- | ---- | --------- |
| 1  | 巴西   | 技术盘带 | 桑巴舞步      |
| 2  | 阿根廷  | 核心突破 | 球王领域      |
| 3  | 法国   | 均衡反击 | 高卢雄鸡      |
| 4  | 德国   | 强力压迫 | 钢铁意志      |
| 5  | 西班牙  | 控球传递 | Tiki-Taka |
| 6  | 英格兰  | 远射冲击 | 三狮之力      |
| 7  | 葡萄牙  | 精准射门 | 黄金右脚      |
| 8  | 荷兰   | 全攻全守 | 全能足球      |
| 9  | 意大利  | 防守反击 | 钢铁防线      |
| 10 | 克罗地亚 | 中场控制 | 不屈斗志      |
| 11 | 乌拉圭  | 强硬对抗 | 铁血精神      |
| 12 | 比利时  | 全面进攻 | 黄金一代      |
| 13 | 日本   | 快速配合 | 忍者跑位      |
| 14 | 韩国   | 高速奔袭 | 永动机       |
| 15 | 美国   | 身体对抗 | 美式力量      |
| 16 | 墨西哥  | 灵活突破 | 绿茵旋风      |
| 17 | 瑞士   | 稳定防守 | 精密防线      |
| 18 | 丹麦   | 团队协作 | 北欧意志      |
| 19 | 瑞典   | 高空进攻 | 北欧巨人      |
| 20 | 波兰   | 强力射门 | 禁区猎手      |
| 21 | 塞内加尔 | 身体冲击 | 猛兽冲锋      |
| 22 | 摩洛哥  | 快速防反 | 沙漠雄鹰      |
| 23 | 埃及   | 技术突破 | 法老之速      |
| 24 | 喀麦隆  | 力量进攻 | 非洲雄狮      |
| 25 | 澳大利亚 | 强硬拼抢 | 袋鼠冲锋      |
| 26 | 加拿大  | 快速反击 | 极地速度      |
| 27 | 哥伦比亚 | 技术进攻 | 咖啡旋风      |
| 28 | 厄瓜多尔 | 高速奔跑 | 高原之力      |
| 29 | 塞尔维亚 | 高空轰炸 | 巨人之力      |
| 30 | 奥地利  | 高位逼抢 | 红白压迫      |
| 31 | 土耳其  | 激情进攻 | 狂热主场      |
| 32 | 威尔士  | 边路突击 | 红龙之心      |

以上是游戏原创的世界杯参赛阵容，不对应某一届现实世界杯的官方参赛名单。

## **3.2 国家队属性**

每支球队有六个基础属性，采用 1～100 分。

| 属性 | 作用          |
| -- | ----------- |
| 速度 | 球员移动和冲刺速度   |
| 射门 | 射门力量和精准度    |
| 盘带 | 控球稳定性和过人成功率 |
| 传球 | 传球速度、准确度    |
| 防守 | 抢断、拦截、身体对抗  |
| 体能 | 体力上限和恢复速度   |

不同国家队采用不同属性分配。

示例：

| 国家队 | 速度 | 射门 | 盘带 | 传球 | 防守 | 体能 |
| --- | -- | -- | -- | -- | -- | -- |
| 巴西  | 88 | 82 | 96 | 85 | 70 | 85 |
| 阿根廷 | 85 | 90 | 96 | 92 | 72 | 83 |
| 德国  | 82 | 90 | 78 | 86 | 93 | 94 |
| 法国  | 94 | 92 | 86 | 85 | 86 | 92 |
| 西班牙 | 78 | 80 | 92 | 98 | 82 | 85 |
| 日本  | 93 | 75 | 90 | 88 | 78 | 96 |

其余国家队同样必须配置完整属性，不允许使用相同默认数据。

## **3.3 国家队专属被动技能**

32 支球队全部具有独特的被动效果。

| 国家队  | 被动效果            |
| ---- | --------------- |
| 巴西   | 连续过人后移动速度逐步增加   |
| 阿根廷  | 核心球员持球时射门精准度增加  |
| 法国   | 反击时全队速度增加       |
| 德国   | 连续抢断后全队防守提升     |
| 西班牙  | 连续传球增加控球稳定性     |
| 英格兰  | 禁区外射门威力增加       |
| 葡萄牙  | 蓄力射门获得额外精准度     |
| 荷兰   | 球员切换后短时间属性提升    |
| 意大利  | 门将扑救成功后获得防御加成   |
| 克罗地亚 | 中场球员体力恢复加快      |
| 乌拉圭  | 对抗成功后获得短暂力量提升   |
| 比利时  | 全队进攻属性均衡提升      |
| 日本   | 连续传球缩短技能冷却      |
| 韩国   | 比赛后半段移动速度增加     |
| 美国   | 身体对抗能力增加        |
| 墨西哥  | 盘带时转向速度增加       |
| 瑞士   | 防守阵型保持能力增加      |
| 丹麦   | 队友距离较近时传球准确度增加  |
| 瑞典   | 头球和高空球能力增加      |
| 波兰   | 禁区内射门威力增加       |
| 塞内加尔 | 冲刺时身体碰撞能力增加     |
| 摩洛哥  | 抢断成功后反击速度增加     |
| 埃及   | 盘带成功后射门精准度增加    |
| 喀麦隆  | 对抗成功后获得短暂冲刺效果   |
| 澳大利亚 | 抢断和铲球距离增加       |
| 加拿大  | 开场阶段全队移动速度提升    |
| 哥伦比亚 | 传球后短时间提升控球能力    |
| 厄瓜多尔 | 全队体力消耗降低        |
| 塞尔维亚 | 头球、长传和射门力量增加    |
| 奥地利  | 高位逼抢时移动速度提升     |
| 土耳其  | 主场式观众加成，落后时属性提升 |
| 威尔士  | 边路突破时冲刺速度增加     |

每种被动技能都必须拥有独立图标、名称、数值参数和实际游戏效果。

## **3.4 球队选择和解锁**

- 初始开放 8 支球队。
- 其余 24 支球队可以通过世界杯成就解锁。
- 设置完整 32 支球队图鉴。
- 增加随机选择国家队。
- 支持球队属性对比。
- 支持查看球队专属被动。

为满足完整 MVP，32 支球队的比赛数据、AI 和模型从第一版全部制作完成，未解锁球队只限制玩家选择，不限制其作为 AI 对手出现。

# **四、足球比赛系统**

## **4.1 球员阵容**

采用 5v5 模式。

[\[Concept\] Soccer / Fussball in Vanilla-Minecraft Minecraft Map](https://images.openai.com/static-rsc-4/19KdI_nbELBXd1zGCd7KEvHMQ2h5uU8ufFcMTw4ugN8Z_BkbWr4Cl5my8fXRYLRMU-tQK4AoakF9xgyOrm7n7slkZDfPiefiFtN5AWcU-WlI_qPDDGFM1AVGc9EfJ9C50ajP4N26DTBjJuz57brH9t-A6QDbfjQGNhuAQ_hN-VU?purpose=inline)

[planetminecraft.com](https://www.planetminecraft.com/project/soccer-fussball-in-vanilla-minecraft/?utm_source=chatgpt.com)

每支队伍由以下位置组成：

| 位置    | 人数 | 主要能力  |
| ----- | -- | ----- |
| GK 门将 | 1  | 扑救、出击 |
| DF 后卫 | 1  | 抢断、拦截 |
| MF 中场 | 1  | 传球、组织 |
| FW 前锋 | 2  | 射门、突破 |

玩家默认控制球队核心球员，其余四名球员由 AI 自动控制。

允许玩家通过按键切换控制对象。

## **4.2 球员角色属性**

每个球员有独立的属性。

- 移动速度。
- 冲刺速度。
- 射门力量。
- 射门精度。
- 控球能力。
- 传球精度。
- 抢断能力。
- 身体对抗。
- 体力。
- 门将扑救能力。

球队总属性由国家队基础属性、球员位置修正、技能和装备共同计算。

## **4.3 比赛操作**

PC：

| 按键    | 操作        |
| ----- | --------- |
| WASD  | 移动        |
| Shift | 冲刺        |
| Space | 射门 / 蓄力射门 |
| J     | 短传        |
| K     | 长传        |
| L     | 抢断 / 铲球   |
| Q     | 切换控制球员    |
| E     | 主动技能      |
| R     | 释放大招      |
| Tab   | 战术面板      |
| Esc   | 暂停        |

移动端：

- 左侧虚拟摇杆。
- 右侧射门按钮。
- 右侧短传按钮。
- 右侧长传按钮。
- 右侧抢断按钮。
- 右侧技能按钮。
- 独立大招按钮。
- 长按射门蓄力。

## **4.4 足球物理系统**

足球需要实现：

1. 重力。
2. 地面摩擦。
3. 空气阻力。
4. 弹跳。
5. 球员碰撞。
6. 球门柱碰撞。
7. 足球旋转。
8. 旋转弧线。
9. 射门冲量。
10. 传球轨迹。
11. 足球与守门员碰撞。
12. 足球飞行拖尾。

特别要求：

- 不允许足球穿过球员。
- 不允许足球穿过球门柱。
- 不允许球员无条件吸附足球。
- 足球被踢出后必须由物理系统控制。
- 进球判定必须根据足球整体通过球门判定线进行。

## **4.5 比赛规则**

必须实现：

- 开球。
- 进球。
- 重新开球。
- 球门球。
- 角球。
- 界外球。
- 犯规。
- 任意球。
- 黄牌。
- 红牌。
- 加时赛。
- 点球大战。

考虑到 5v5 快节奏玩法，可以对越位规则进行简化，但必须有清晰的比赛规则说明。

## **4.6 比赛 AI**

AI 分为三层：

**球员 AI**

负责单个球员的移动、传球、射门、抢断和跑位。

**球队 AI**

负责阵型、攻防切换、战术选择和协同配合。

**门将 AI**

负责预判射门轨迹、扑救、出击和球门球。

球队战术模式：

| 模式   | 行为       |
| ---- | -------- |
| 进攻   | 更多球员前插   |
| 防守   | 优先保护球门   |
| 控球   | 优先短传     |
| 反击   | 迅速向前推进   |
| 全场逼抢 | 主动压迫持球队员 |
| 全员回防 | 降低进攻倾向   |

# **五、完整 Roguelike 技能系统**

[Free Kicks World Cup 2026 - Play Free Game on Wacky Steps](https://images.openai.com/static-rsc-4/MLrWr-RCsDvgMrFbF3owGwrOeJ90CP16r0MdyqPPSPna8PfKKkACFdymjl1gRSO32aVqhjn9_44JyfLBguLVzCUAJpTuEr-IWa7ucSePFND_Ivrtp-oNy-paP-Yic8c3WjW9ll8McIWB__hXQDZFv50X3jQY94L5M25vZxi2J8A?purpose=inline)

[Soccer ball on the green field with lightnings — Stock Photo © osalenko #12306513](https://images.openai.com/static-rsc-4/uRwqxL7cGB5I3ljskUxsGOKxgJojAgQYjWVKx68ZyBUXvM2Q62WLZ7HTVk0zPxwYaQEpNa8DJzuycpUN8to0-FOI9eA-PruT4GixisipL16z2-0Cu1ACrpJihLELc7XuA1J-9j4aEBERk8KN5XIn0sUre050vf0fCIKiu3AdIfw?purpose=inline)

[Showcase :: Block Party Sports](https://images.openai.com/static-rsc-4/rpruACL_d85NDV2nrF_SiEg1EjVE101T8YhseVe_FqHGFbJq2S8sKQ_7H_8CcBYwZJWrkaHolb8U4rUU7I0koFENWlQlZHb1QG-lJG4LSzRZodw4NYdBGM9PrCZPKxbPaSKHXeD6VUxpJ5OndOfwBXPM0GTGbt-1ag9RlGC60HY?purpose=inline)

9

## **5.1 技能系统规模**

本次 MVP 直接完成以下技能内容：

| 技能分类 | 数量       |
| ---- | -------- |
| 主动技能 | 20       |
| 被动技能 | 24       |
| 射门技能 | 20       |
| 防守技能 | 16       |
| 终极大招 | 12       |
| 合计   | **92 个** |

说明：技能进化不计入上述基础技能数量，另设计 20 种进化技能。

每个技能必须具备：

- 唯一 ID。
- 唯一名称。
- 图标。
- 技能品质。
- 技能说明。
- 等级上限。
- 技能效果。
- 冷却时间或触发条件。
- 对应动画。
- 对应音效。
- 对应粒子特效。
- 进化条件（如果存在）。

## **5.2 技能品质**

| 品质 | 颜色 | 基础出现概率 |
| -- | -- | ------ |
| 普通 | 灰色 | 50%    |
| 稀有 | 蓝色 | 30%    |
| 史诗 | 紫色 | 15%    |
| 传说 | 金色 | 5%     |

以上为基础概率，具体出现权重还需要考虑技能解锁状态、已有技能、比赛阶段和保底机制。

## **5.3 主动技能（20 个）**

主动技能由玩家手动释放，拥有独立冷却时间。

| ID  | 技能名称  | 效果            | 冷却   |
| --- | ----- | ------------- | ---- |
| A01 | 闪电冲刺  | 短时间高速移动       | 8 秒  |
| A02 | 瞬间过人  | 向前瞬移突破        | 10 秒 |
| A03 | 火焰射门  | 射出火焰足球        | 12 秒 |
| A04 | 冰冻足球  | 冻结附近敌方球员      | 15 秒 |
| A05 | 旋风盘带  | 旋转击退附近敌人      | 14 秒 |
| A06 | 引力吸球  | 吸引附近足球        | 12 秒 |
| A07 | 幻影分身  | 生成协助突破的分身     | 20 秒 |
| A08 | 磁力传球  | 自动寻找队友        | 10 秒 |
| A09 | 地震铲球  | 范围冲击并击倒对手     | 18 秒 |
| A10 | 时空减速  | 减缓附近对手行动      | 30 秒 |
| A11 | 二段跳跃  | 跳跃后可以再次起跳     | 8 秒  |
| A12 | 火箭推进  | 向前高速飞行一段距离    | 12 秒 |
| A13 | 护盾冲锋  | 获得护盾并向前冲击     | 15 秒 |
| A14 | 影子换位  | 与己方队友交换位置     | 18 秒 |
| A15 | 足球回旋  | 召回或改变足球飞行方向   | 16 秒 |
| A16 | 追踪射门  | 足球自动修正射门方向    | 18 秒 |
| A17 | 反重力领域 | 让足球短暂悬浮       | 22 秒 |
| A18 | 速度领域  | 周围己方球员加速      | 20 秒 |
| A19 | 能量波动  | 击退附近对手        | 16 秒 |
| A20 | 绝对领域  | 短时间提高控球和抗干扰能力 | 30 秒 |

注意：技能不能破坏基本足球规则。例如瞬移换位后不能直接让足球瞬移进入球门。

## **5.4 被动技能（24 个）**

被动技能自动生效。

| ID  | 名称    | 效果           |
| --- | ----- | ------------ |
| P01 | 铁腿    | 射门力量 +20%    |
| P02 | 飞毛腿   | 移动速度 +15%    |
| P03 | 金刚体   | 减少身体碰撞硬直     |
| P04 | 精准大师  | 射门精度 +20%    |
| P05 | 永动机   | 体力消耗降低       |
| P06 | 足球磁铁  | 控球范围增加       |
| P07 | 传球大师  | 传球准确度增加      |
| P08 | 门前杀手  | 禁区内射门威力增加    |
| P09 | 逆境之王  | 落后时全属性增加     |
| P10 | 幸运球   | 射门暴击概率增加     |
| P11 | 黄金肺   | 体力上限增加       |
| P12 | 钢铁神经  | 减少被控制时间      |
| P13 | 迅捷反应  | 切换球员后短暂加速    |
| P14 | 弹簧腿   | 跳跃高度增加       |
| P15 | 远程炮台  | 远距离射门威力增加    |
| P16 | 经验丰富  | 比赛经验获取增加     |
| P17 | 淘金者   | 金币获取增加       |
| P18 | 技能共鸣  | 技能冷却缩短       |
| P19 | 不屈斗士  | 落后时体力恢复加快    |
| P20 | 守护之心  | 受攻击时获得短暂护盾   |
| P21 | 连击大师  | 连续成功动作提高伤害加成 |
| P22 | 幸运三叶草 | 提高稀有技能出现概率   |
| P23 | 破门专家  | 射门时门将扑救难度提高  |
| P24 | 完美配合  | 与队友配合后增加传球效果 |

## **5.5 射门技能（20 个）**

射门技能主要改变足球的运动轨迹、元素属性和命中效果。

| ID  | 技能名称 | 射门效果          |
| --- | ---- | ------------- |
| S01 | 火焰射门 | 足球带火焰，命中产生爆炸  |
| S02 | 雷电射门 | 足球高速飞行并释放闪电   |
| S03 | 冰霜射门 | 命中后产生冰冻区域     |
| S04 | 陨石射门 | 足球变成陨石        |
| S05 | 空间折射 | 足球飞行过程中改变方向   |
| S06 | 螺旋射门 | 足球产生强烈旋转弧线    |
| S07 | 幻影射门 | 足球产生多个视觉残影    |
| S08 | 穿透射门 | 降低守门员对射门的阻挡效果 |
| S09 | 追踪射门 | 足球自动修正飞行方向    |
| S10 | 分裂射门 | 足球在空中产生多个小球   |
| S11 | 光速射门 | 大幅提升足球速度      |
| S12 | 重力射门 | 足球飞行后突然下坠     |
| S13 | 反弹射门 | 足球碰撞地面后改变方向   |
| S14 | 震荡射门 | 产生范围冲击波       |
| S15 | 吸引射门 | 足球在飞行时产生引力效果  |
| S16 | 诅咒射门 | 降低门将短时间扑救能力   |
| S17 | 彩虹射门 | 随机获得元素属性      |
| S18 | 爆裂射门 | 命中后产生大范围爆炸    |
| S19 | 穿云射门 | 超高弧线射门        |
| S20 | 黄金射门 | 高伤害、高精准度的特殊射门 |

射门技能可以叠加，但需要设置互斥和优先级机制。例如分裂射门和陨石射门不能简单同时改变足球主体模型，需要明确最终形态与附加效果。

## **5.6 防守技能（16 个）**

| ID  | 技能名称 | 效果          |
| --- | ---- | ----------- |
| D01 | 铁壁防守 | 短时间提高防御     |
| D02 | 闪电拦截 | 快速移动到足球路径   |
| D03 | 冰冻铲球 | 抢断成功后冰冻敌人   |
| D04 | 地震防守 | 范围击退敌方球员    |
| D05 | 绝对护盾 | 阻挡一次强力攻击    |
| D06 | 磁力拦截 | 吸引附近足球      |
| D07 | 反弹护盾 | 反弹部分冲击效果    |
| D08 | 影子防守 | 生成分身辅助防守    |
| D09 | 门神降临 | 门将属性大幅提升    |
| D10 | 极速回防 | 快速回到防守位置    |
| D11 | 钢铁门柱 | 门柱区域获得强化防护  |
| D12 | 守门预判 | 提前判断足球飞行方向  |
| D13 | 反击号角 | 抢断后全队短暂加速   |
| D14 | 领域压制 | 降低附近敌方速度    |
| D15 | 无敌滑铲 | 铲球过程中免受硬直   |
| D16 | 最终防线 | 门前危险时全队防守增强 |

## **5.7 终极大招（12 个）**

[The Dream: Blockball Ultimate Soccer | JV | EL SANDO - Minecraft Worlds - CurseForge](https://images.openai.com/static-rsc-4/1cOQrRCq1WXtSZ7RJm5Nqpamhev2-mLCNqX1l8Mz8JXERSur-Qm2Vqz2olu4-LtIZ4GMfW7FrRSxGjnNeCn_-ridjgh6h57M8lU2cbEkyD_V45bl_zfGbs1gK7KsqeBUgS6xLMjEoLW78R4TepM1pRdFTBMHxgid0Z3Gj_vo0xA?purpose=inline)

[How to Craft a Bow in Minecraft: Step-by-Step Guide](https://images.openai.com/static-rsc-4/H_oWe0U3EI5RcW6CBah0-_6LnqMMmib30Q9XUGR8O59tiL6P2Tn-w60_72IED0YC6Qjk8rmskfspZeoalLUl1nok8fWDn22kyHUDYj_bre-vDoHTXw_uKFjtU-lDOP5bjuOzIrT84r1rSMkjFwqmX1Mug2aP1PboEB3dRkKiGZQ?purpose=inline)

[undefined - MCModels](https://images.openai.com/static-rsc-4/ZA7XgvCRHTIMzSWHDwdkDUkKGYBgkLVej7rmlni1YhKUvTe6aq7pVCIivSBPjPcsIf1hIYrsQC-yS30Q4O_pso-jv53tk7D1PmnrAxKRui9Qa7xQlp9IAFCo9nyf3GpQbip3B25bzVGOv3BcMUORYUEoimogxs_slgFq6vpI_7o?purpose=inline)

9

大招必须拥有全屏级别的视觉反馈。

| ID  | 大招    | 效果              |
| --- | ----- | --------------- |
| U01 | 世界波   | 超强远距离射门         |
| U02 | 天降陨石  | 召唤陨石攻击指定区域      |
| U03 | 雷神降临  | 全场雷电攻击          |
| U04 | 时间领域  | 大范围时间减缓         |
| U05 | 龙卷风足球 | 足球形成巨型龙卷风       |
| U06 | 足球核爆  | 足球命中产生巨大爆炸      |
| U07 | 绝对防御  | 门将进入无敌防御状态      |
| U08 | 黄金进球  | 下一次射门大幅强化       |
| U09 | 巨人降临  | 核心球员巨大化并强化对抗    |
| U10 | 次元传送  | 在球场合法位置快速转移球员   |
| U11 | 足球风暴  | 召唤多个足球形成连续攻击    |
| U12 | 神之领域  | 全队属性大幅提升并短暂减缓对手 |

大招充能：

| 行为   | 充能  |
| ---- | --- |
| 进球   | 40% |
| 助攻   | 20% |
| 成功抢断 | 10% |
| 精彩扑救 | 15% |
| 连续过人 | 5%  |
| 射正   | 5%  |

所有充能都设置上限 100%，重复触发不允许溢出。

## **5.8 技能升级**

每个基础技能具有 5 个等级。

以火焰射门为例：

| 等级  | 效果            |
| --- | ------------- |
| LV1 | 火焰射门，威力增加 30% |
| LV2 | 火焰持续时间增加      |
| LV3 | 命中后产生小型爆炸     |
| LV4 | 爆炸范围增加 50%    |
| LV5 | 产生火焰风暴        |

技能升级规则：

- 同技能重复出现时允许升级。
- 已经满级的技能不再进入普通三选一池。
- 技能达到指定等级后可以触发进化。
- 技能进化后保留原技能基础属性。
- 特殊技能不允许无限叠加。

## **5.9 技能组合进化（20 种）**

[The Dream: Blockball Ultimate Soccer | JV | EL SANDO - Minecraft Worlds - CurseForge](https://images.openai.com/static-rsc-4/1cOQrRCq1WXtSZ7RJm5Nqpamhev2-mLCNqX1l8Mz8JXERSur-Qm2Vqz2olu4-LtIZ4GMfW7FrRSxGjnNeCn_-ridjgh6h57M8lU2cbEkyD_V45bl_zfGbs1gK7KsqeBUgS6xLMjEoLW78R4TepM1pRdFTBMHxgid0Z3Gj_vo0xA?purpose=inline)

[curseforge.com](https://www.curseforge.com/minecraft/worlds/the-dream-blockball-ultimate-soccer-jv-el-sando?utm_source=chatgpt.com)

| 编号  | 基础技能组合       | 进化名称  |
| --- | ------------ | ----- |
| E01 | 火焰射门 + 铁腿    | 炎帝世界波 |
| E02 | 雷电射门 + 飞毛腿   | 雷霆疾风  |
| E03 | 冰霜射门 + 精准大师  | 绝对零度  |
| E04 | 陨石射门 + 铁腿    | 灭世陨星  |
| E05 | 旋风盘带 + 幻影分身  | 影风舞步  |
| E06 | 磁力传球 + 传球大师  | 全自动传控 |
| E07 | 闪电冲刺 + 光速射门  | 光速破门  |
| E08 | 反重力领域 + 螺旋射门 | 银河旋球  |
| E09 | 追踪射门 + 幸运球   | 命运制导  |
| E10 | 爆裂射门 + 地震铲球  | 震天爆裂  |
| E11 | 绝对护盾 + 铁壁防守  | 永恒壁垒  |
| E12 | 门神降临 + 守门预判  | 不败门神  |
| E13 | 冰冻铲球 + 领域压制  | 极寒领域  |
| E14 | 幻影射门 + 分裂射门  | 千影足球  |
| E15 | 速度领域 + 飞毛腿   | 疾风领域  |
| E16 | 时间减速 + 黄金射门  | 时间裁决  |
| E17 | 火箭推进 + 二段跳跃  | 天空漫步  |
| E18 | 反击号角 + 迅捷反应  | 雷霆反击  |
| E19 | 震荡射门 + 光速射门  | 超音速冲击 |
| E20 | 足球磁铁 + 引力吸球  | 万有引力  |

进化规则：

1. 玩家必须同时拥有指定技能。
2. 指定技能必须达到要求等级。
3. 完成一次技能进化后弹出进化动画。
4. 进化技能替换对应组合技能，或按照配方配置合并效果。
5. 进化后的技能拥有独立的等级上限和特效。
6. 每种进化技能必须能够在图鉴中查看。

**重要：** 上表是首发 20 种进化配方，不代表只有 20 个技能可以获得。其余技能仍然可以独立升级和组合使用。

# **六、装备系统**

## **6.1 装备分类**

装备槽共 6 个：

| 装备槽 | 主要效果      |
| --- | --------- |
| 球鞋  | 移动和冲刺     |
| 护腿  | 防御和抢断     |
| 手套  | 守门和控球辅助   |
| 头盔  | 特殊技能加成    |
| 护身符 | 幸运和技能效果   |
| 足球  | 射门属性和元素效果 |

## **6.2 装备品质**

普通、稀有、史诗、传说。

## **6.3 完整装备池**

首发制作 32 件装备。

| 类型  | 装备                            |
| --- | ----------------------------- |
| 球鞋  | 黄金球鞋、闪电球鞋、火焰球鞋、冰霜球鞋、疾风球鞋、钻石球鞋 |
| 护腿  | 钻石护腿、钢铁护腿、雷霆护腿、火焰护腿、守护护腿      |
| 手套  | 力量手套、精准手套、守门手套、磁力手套、黄金手套      |
| 头盔  | 幸运头盔、钻石头盔、雷神头盔、火焰头盔、冠军头盔      |
| 护身符 | 幸运护符、经验护符、技能护符、金币护符、反击护符      |
| 足球  | 黄金足球、雷电足球、火焰足球、冰霜足球、陨石足球、彩虹足球 |

装备需要具有完整模型、图标、数值、特殊效果和获取途径。

# **七、世界杯完整赛事系统**

## **7.1 32 队分组**

采用 8 个小组，每组 4 支球队。

为保证每次征程都有变化：

- 使用球队实力作为种子分档。
- 每个小组尽量避免实力过度集中。
- 每组必须有 4 支不同球队。
- 每次新开世界杯可以重新随机分组。
- 玩家选定球队后，所属小组固定。

示例分组：

| 小组 | 球队               |
| -- | ---------------- |
| A  | 巴西、瑞士、日本、埃及      |
| B  | 阿根廷、丹麦、美国、喀麦隆    |
| C  | 法国、墨西哥、塞尔维亚、加拿大  |
| D  | 德国、乌拉圭、韩国、澳大利亚   |
| E  | 西班牙、克罗地亚、摩洛哥、威尔士 |
| F  | 英格兰、波兰、厄瓜多尔、土耳其  |
| G  | 葡萄牙、瑞典、塞内加尔、哥伦比亚 |
| H  | 荷兰、比利时、奥地利、意大利   |

此分组仅作为示例，每次比赛可以重新生成。

## **7.2 小组赛**

每个小组进行单循环。

每支球队参加三场比赛。

积分规则：

| 结果 | 积分 |
| -- | -- |
| 胜利 | 3  |
| 平局 | 1  |
| 失败 | 0  |

排名规则：

1. 积分。
2. 净胜球。
3. 总进球。
4. 相互比赛成绩。
5. 随机抽签作为最终兜底。

小组前两名进入 16 强。

## **7.3 淘汰赛**

淘汰赛完整实现：

- 16 强。
- 8 强。
- 半决赛。
- 三四名决赛。
- 决赛。

平局进入加时赛，加时赛仍然平局则进行点球大战。

淘汰赛对阵根据标准小组排名映射生成，不能直接随机选择对手。

## **7.4 AI 模拟比赛**

玩家不参与的比赛需要在后台逻辑中快速模拟。

模拟参数：

```
比赛结果 =
球队综合实力
+ 球员阵容
+ 球队战术
+ 当前疲劳
+ 技能和装备修正
+ 主场氛围
+ 随机事件
```

模拟需要生成：

- 最终比分。
- 进球球员。
- 助攻球员。
- 黄牌。
- 红牌。
- 射门统计。
- 控球率。
- 比赛事件。

同一场比赛结果一旦生成就必须保存，不能因为用户重新打开赛程而变化。

## **7.5 世界杯赛程 UI**

[XP Soccer Screenshots · SteamDB](https://images.openai.com/static-rsc-4/ZiJgjafAUuiXletNg28vyAUvlSc_rjWRNiG84axS2giP3C-p1dZdnOxduUzPbzpd5bc7_mbTW27cjRvbBMJFTdd1GZJg2NuzhBRalGjNePPiFPUZVcnC6w1_NSqnijKZ0wQI6RPNXeqMS1K8Y0RJYc-MLDecL2j5iKEqVFEPdlA?purpose=inline)

[steamdb.info](https://steamdb.info/app/2013580/screenshots/?utm_source=chatgpt.com)

支持：

- 查看所有小组。
- 查看全部 32 支球队。
- 查看小组排名。
- 查看完整淘汰赛树。
- 查看比赛比分。
- 查看下一场比赛。
- 查看晋级路线。
- 查看已淘汰球队。
- 查看最终冠军。

# **八、比赛奖励与局内经济系统**

## **8.1 经验系统**

比赛中通过足球行为获取经验。

| 行为       | 经验 |
| -------- | -- |
| 成功短传     | 5  |
| 成功长传     | 8  |
| 成功抢断     | 10 |
| 成功过人     | 10 |
| 射正球门     | 15 |
| 完成助攻     | 30 |
| 进球       | 50 |
| 精彩扑救     | 20 |
| 连续传球 5 次 | 15 |
| 连续过人 3 次 | 20 |
| 完成帽子戏法   | 50 |
| 绝杀进球     | 40 |

经验达到升级要求后，暂停比赛，弹出三选一技能界面。

## **8.2 三选一技能系统**

[Sera Dion: Survivor (2025) | My Games Backlog](https://images.openai.com/static-rsc-4/W-N2_mZnRtGgbf5gZE6MiXoFHzgtH9HOAE5i8mdjwQve5Xjw0-0Ol0mIozEmtOthRNhYkhsGXxON7B3o7w3F0eC4RN8NJ7kubYzvdl7JOR_QxDpi8pASiAAljrpLdelJ4wFDrUZDfRkraoMV2Ulz5kXMgXpomsbVGxYVfgQCSuo?purpose=inline)

[mygamesbacklog.com](https://mygamesbacklog.com/games/sera-dion-survivor?utm_source=chatgpt.com)

每次升级随机提供三个不同奖励。

奖励类型：

- 新技能。
- 技能升级。
- 技能进化。
- 属性强化。
- 特殊道具。
- 金币奖励。

规则：

1. 三张卡片不能出现完全相同的奖励。
2. 优先推荐当前构筑可以使用的技能。
3. 满级技能不再出现。
4. 满足进化条件时提高进化奖励的权重。
5. 可以刷新一次免费选择。
6. 刷新后重新抽取三个奖励。
7. 选择后比赛继续。
8. 可以通过设置关闭自动暂停以外的非关键提示，但技能选择必须暂停游戏。

## **8.3 属性强化奖励**

除技能外，升级时也可以抽到基础属性奖励。

| 名称   | 效果          |
| ---- | ----------- |
| 强力射门 | 射门威力 +10%   |
| 精准控制 | 射门精度 +10%   |
| 极限速度 | 移动速度 +10%   |
| 强健体魄 | 最大体力 +15%   |
| 快速恢复 | 体力恢复速度 +20% |
| 钢铁防御 | 防守能力 +10%   |
| 完美配合 | 传球精度 +10%   |
| 幸运眷顾 | 稀有技能概率增加    |

每种属性强化最多可以重复获得，但设置合理的成长上限。

## **8.4 金币系统**

金币属于单次世界杯征程资源。

获得途径：

- 完成比赛。
- 取得胜利。
- 进球。
- 助攻。
- 完成比赛任务。
- 击败精英球队。
- 击败 BOSS 球队。

奖励示例：

| 行为     | 金币  |
| ------ | --- |
| 完成比赛   | 30  |
| 比赛获胜   | 50  |
| 进球     | 10  |
| 助攻     | 8   |
| 完美比赛   | 30  |
| 击败精英球队 | 60  |
| 晋级淘汰赛  | 100 |
| 赢得半决赛  | 150 |
| 赢得世界杯  | 500 |

## **8.5 商店系统**

[Minecraft DLC Marketplace | Minecraft](https://images.openai.com/static-rsc-4/rYwcK4_tOaEtZrrN5xEyxVwjCKw8I5NoKvvS2H0ZGW8W1y6KoaxW9EFntv_2sLhz7kQdZtGyyWGp28cVlikruL7VoWDG9TTxhaEjIYjrfxmyRSAEMLCEyj5bXiiSq07k9WjNMegxJg4y5HaXbPI1RKt0pSbDN7GexhyI-h71DHM?purpose=inline)

[minecraft.net](https://www.minecraft.net/en-us/marketplace/pdp/lunar-client/triumphs--trophies/71b426a5-be68-4d43-aa2d-453dddaf10a8?utm_source=chatgpt.com)

每场比赛结束后进入商店，展示随机商品。

首发商店商品：

| 商品    | 价格  | 效果       |
| ----- | --- | -------- |
| 能量饮料  | 30  | 恢复体力     |
| 强力足球  | 50  | 射门威力提升   |
| 幸运护符  | 60  | 提升稀有技能概率 |
| 黄金球鞋  | 80  | 移动速度提升   |
| 神秘技能箱 | 100 | 随机获得一个技能 |
| 大招充能器 | 120 | 恢复大招能量   |
| 装备箱   | 150 | 随机获得装备   |
| 技能刷新券 | 40  | 刷新三选一奖励  |
| 急救包   | 50  | 恢复受伤球员状态 |
| 体能恢复剂 | 60  | 恢复球队体力   |

商店每次提供 5～7 个随机商品，购买后可以补货刷新。

## **8.6 比赛任务系统**

每场比赛随机生成 3 个挑战任务。

示例：

- 完成 10 次成功传球。
- 射门至少 5 次。
- 完成 3 次抢断。
- 进球 2 个。
- 不丢球。
- 完成 3 次过人。
- 使用技能 5 次。
- 完成一次远距离射门得分。

完成任务后获得额外金币或技能奖励。

# **九、BOSS 球队与特殊比赛**

## **9.1 BOSS 系统**

[堂安律 嫁・明松美玖との馴れ初め 子供を調査 18歳での出会いから2024年結婚までの軌跡と現在の夫婦生活 子どもの情報についても紹介 - 羊たちとともに](https://images.openai.com/static-rsc-4/kDNzOb-8IHUKWnkZY59v8oVMm3yMUEy0BWwB9wpno8El-nxjcRbJDtuMKGJvobDsK3fJUs_9HGTDp4KKI2_4JX0z9F0P1PR1nJlf9eMFB7Jk-UF5kzTgzS-mAd8RSnxrXJlQGH7QqIzEcj6Ojfpw0ouKz7pJOknw_-o4Otyw850?purpose=inline)

[mayuri.hatenadiary.com](https://mayuri.hatenadiary.com/entry/ritsu-doan-wife-familiarity-children?utm_source=chatgpt.com)

世界杯比赛中的强队会逐渐拥有特殊机制。

首发设置 8 种精英挑战模板，按国家队属性和战术匹配：

| BOSS 名称 | 特点  | 专属机制   |
| ------- | --- | ------ |
| 铁壁守门员   | 防守型 | 超高扑救能力 |
| 闪电前锋    | 速度型 | 高速连续突破 |
| 火焰射手    | 进攻型 | 火焰射门   |
| 冰霜中场    | 控制型 | 冰冻球场区域 |
| 幻影球王    | 技巧型 | 分身和幻影  |
| 雷霆后卫    | 防守型 | 范围闪电拦截 |
| 巨人中锋    | 力量型 | 身体对抗极强 |
| 世界冠军队   | 全能型 | 多种技能组合 |

BOSS 不一定是某支现实国家队的固定身份，而是叠加在球队基础战术之上的挑战模板。

## **9.2 BOSS 阶段机制**

例如世界冠军队：

- 第一阶段：正常比赛。
- 第二阶段：比分落后时提高全队速度。
- 第三阶段：获得强化守门员。
- 第四阶段：释放终极团队技能。

## **9.3 特殊比赛事件**

MVP 首发包含 16 种随机事件。

| 编号 | 事件   | 效果         |
| -- | ---- | ---------- |
| 01 | 黄金足球 | 足球威力增加     |
| 02 | 雷暴天气 | 球场随机出现闪电   |
| 03 | 冰雪球场 | 改变球员和足球摩擦  |
| 04 | 双倍经验 | 经验获取翻倍     |
| 05 | 观众狂热 | 大招充能增加     |
| 06 | 足球狂暴 | 足球速度增加     |
| 07 | 黑夜模式 | 降低球场环境亮度   |
| 08 | 反重力  | 足球弹跳高度增加   |
| 09 | 黄金时间 | 金币获取增加     |
| 10 | 狂风天气 | 足球轨迹受风力影响  |
| 11 | 巨型球门 | 球门尺寸增加     |
| 12 | 超小球门 | 球门尺寸缩小     |
| 13 | 双足球  | 场上同时出现两个足球 |
| 14 | 加速比赛 | 球员和足球速度增加  |
| 15 | 体力危机 | 球员体力消耗增加   |
| 16 | 技能狂欢 | 技能冷却缩短     |

特殊规则：

- 事件可以同时叠加，但不能出现严重冲突。
- 特殊事件必须有明显的 UI 提示。
- 部分事件只影响玩家，部分事件影响双方。
- 特殊事件不能破坏进球判定和比赛基本流程。

# **十、球场与方块世界系统**

## **10.1 美术风格**

[Best 13 Minecraft: How to build a Football Stadium \[Tutorial – Artofit](https://images.openai.com/static-rsc-4/Kfcb-EFcdVmg2OH3SlOsf2fyBsupNz3RrN4FOeLPAXcAkHbYFzu_FlWuiiEKJU1eSSF2pQB1ruyV0qylx-AV5hBimvVmEkvDtwF6uzXPd9L_yiA2IZU9pmWvJHn9S1fJ6nMdXJKS-27qRDh09Je52adNX-0hrCYfyd2EHL53258?purpose=inline)

[Nie tylko FIFA - także w Minecraft pograsz w piłkę nożną](https://images.openai.com/static-rsc-4/OoEJd7noKsS1AJBj8ahmOdfOgO2nm291mpgihMi-8ec8JGGFjjN_A0oMJIEuEsIPg7Qexk-MPg-LQtMKjQuPEM9dyiGGrrhRnVIunD8-OyWFA5ZCOb7vp5wcNwRm-8lploDhVZiyyact5m54XtVtNh_ZtNWW7xEyiSvIKacJCNA?purpose=inline)

[ESTADIO AZTECA MEXICO Minecraft Map](https://images.openai.com/static-rsc-4/vGu2D0G1o1YTS_4gw4kHy64uE4VLQRrEj-puYKdhNWRAaLjuIX11AEFCyIcxrVtcskyOe0oTe749NBVhlG6nLytIZdYIPQuONV9iRNZiiMM8_6EsSQodc1fOVNGV1CxKwIxjNBfWsKCpdfFWpO34RdVwfUj8EkfWKl9nmGrrTeo?purpose=inline)

11

整个游戏采用原创 Minecraft 风格方块建模。

主要元素：

- 方块球员。
- 方块足球。
- 方块草坪。
- 方块球门。
- 方块看台。
- 方块观众。
- 方块广告牌。
- 方块灯光塔。
- 方块天空。
- 方块特效。

不直接使用未经授权的 Minecraft 原版模型、材质、音效和商标素材。

## **10.2 球场种类**

首发制作 8 种完整球场。

| 球场      | 主题         |
| ------- | ---------- |
| 世界杯中央球场 | 标准大型世界杯体育场 |
| 热带雨林球场  | 森林和热带植物    |
| 沙漠球场    | 沙漠、仙人掌和黄沙  |
| 冰雪球场    | 冰面和雪山      |
| 火山球场    | 岩浆和火山      |
| 未来科技球场  | 霓虹灯和科技建筑   |
| 天空浮岛球场  | 悬浮平台和云层    |
| 终极冠军球场  | 金色建筑和冠军装饰  |

[Mokal Football Stadium - Map 1.21 Minecraft Map](https://images.openai.com/static-rsc-4/BpUqXv99Aq-jFOuiufJztoMsuB2cSoGHZmy7hDYmul7EQhjFSeh2tounHx9o3ajoTItdDQbzTQLNBntvcRqWrJDcySFs9UuevlktBrfUDiwUCJ1CnMzy-eeMqUu4c4n_nHAzoyg6hatYpFkQUsH6DD985gmITfpEOafUkmeVQ4c?purpose=inline)

[Scootball: Remastered - Minecraft Modpacks - CurseForge](https://images.openai.com/static-rsc-4/a7Nnk8kmYWCHJxTN7ZZrx-pmPSOkvsCbbdQ1b-bF9zBo8_zTP9TiVIV2n_FBOLv5mz06-kG72EPBJZvenespZTPn6y2HKOpkvoS-Qqlu1d7rSwzVRy1XB5dJTI2BjG9_9HBnXg_TCSwtmuVXpjypP0oiWkrlNZlfJd0yARYPzDU?purpose=inline)

[Cherry Arena Football Stadium Minecraft Map](https://images.openai.com/static-rsc-4/G4VRxKwaQJpJgRZgAWGW1IbZK6dnVeTiXu53qbvQqBMxMlzxsOopsk5l2FICXD9P-c8PTau-Svw-CrSZz_46X2k6Z8g-LxM9q2Gaw2MGc-8gLpGa7gTXiSephHe-LLpcH2gDUnaW3R1X4S3U9YbLL88ti5KYr_uwx5YEKXYbV5Q?purpose=inline)

7

每种球场具有：

- 独立天空盒。
- 独立草坪纹理。
- 独立环境模型。
- 独立观众配色。
- 独立灯光设置。
- 独立环境音效。

## **10.3 天气系统**

首发包含：

- 晴天。
- 雨天。
- 雷暴。
- 雪天。
- 沙尘暴。
- 夜晚。

天气能够影响视觉表现，也可以通过特殊事件改变比赛参数。

## **10.4 方块人物系统**

所有国家队共享基础人物骨骼和动画，但外观独立。

人物模型组成：

```
Player
├── Head
├── Body
│   ├── Jersey
│   ├── Number
│   └── Badge
├── LeftArm
├── RightArm
├── LeftLeg
├── RightLeg
├── Shoes
└── Accessories
```

必须支持：

- 32 支国家队服装配色。
- 主客场球衣。
- 球衣号码。
- 球员位置标识。
- 不同球员身高和体型。
- 门将专属服装。
- 球员受伤动画。
- 进球庆祝动画。

## **10.5 球员动画库**

| 动画              | 描述   |
| --------------- | ---- |
| Idle            | 站立   |
| Walk            | 行走   |
| Run             | 跑步   |
| Sprint          | 冲刺   |
| Dribble         | 带球   |
| Pass            | 传球   |
| Shoot           | 射门   |
| LongShoot       | 大力射门 |
| Tackle          | 铲球   |
| Jump            | 跳跃   |
| Header          | 头球   |
| Fall            | 倒地   |
| Hit             | 被撞击  |
| Celebrate       | 进球庆祝 |
| GoalkeeperDive  | 门将扑救 |
| GoalkeeperCatch | 门将接球 |
| Victory         | 胜利   |
| Defeat          | 失败   |

# **十一、完整游戏页面设计**

## **11.1 主菜单**

[The Dream: Blockball Ultimate - Minecraft Bedrock Maps - CurseForge](https://images.openai.com/static-rsc-4/iMaGZw4v6EMOYAKkBna6HeCgcpbTDIajekhoe6ycKh6ntFhAn7AoQXcJ2PF0rL0-4Y5XTt18rGx5HdU5cmJ4XwWDX_S8zx3sYOo-W8VuxIdALKxRZi8ahzTj4BcxNxF2howT2-t9fmTw3ODsx-QXgOqXsIdXIcLWGO3lB_2hsQk?purpose=inline)

[curseforge.com](https://www.curseforge.com/minecraft-bedrock/maps/the-dream-blockball-ultimate?utm_source=chatgpt.com)

功能入口：

- 开始世界杯。
- 继续游戏。
- 球队图鉴。
- 技能图鉴。
- 装备图鉴。
- 球场图鉴。
- 成就系统。
- 游戏设置。

## **11.2 世界杯模式选择**

提供：

- 标准世界杯。
- 随机世界杯。
- 极限世界杯。
- 自定义世界杯。

标准世界杯：正常难度，32 支球队。

随机世界杯：随机分组、球场和赛事事件。

极限世界杯：对手 AI 和技能强度提高。

自定义世界杯：选择难度、比赛时间、事件频率、技能掉落概率。

## **11.3 国家队选择**

[Pixel War 3D -  Keymailer](https://images.openai.com/static-rsc-4/eJx8ReUvJVwDWpGGB7QYaVnUjMawKFg2_P-fK-KT-ckSGa7DngHL3tJ5OspD7-a_rKDc7TbMi-s-6s_2LpXseEU39CamqlX0_FWpfPHhvQ-qmZe1f4mTqfac4kXf4BZ3VMJPq-RxUT5tWliolPXx5rA1CsNEjU9fYPHfYy_PxNg?purpose=inline)

[keymailer.co](https://www.keymailer.co/g/games/b36150d8?utm_source=chatgpt.com)

采用 4×8 国家队选择网格。

每张卡片包含：

- 国家队旗帜。
- 国家队名称。
- 球衣缩略图。
- 球队综合评分。
- 战术类型。
- 解锁状态。

点击后进入详情页面，显示：

- 球队属性雷达图。
- 专属被动技能。
- 球员阵容。
- 球衣预览。
- 历史成就。
- 选择按钮。

## **11.4 世界杯赛程**

[Soccer Gaming (@SoccerGaming) on X](https://images.openai.com/static-rsc-4/hZpoT2TuhZJ1jVq6HXJYmp7nbHs3THI0LFciPI5uzOb6rQPl3ekj_97PKlECu_gFBDzrYnfeRYt1Oi6IhrBl1sGiTJnemCtelDwbtg-cgC7NuOI1PLUAIiXlUHAOKq5UrglZpSOg5AgxiXjjPaVslwhdpv9zENn0Fze9E6C56Ow?purpose=inline)

[x.com](https://x.com/SoccerGaming/status/2062511324974743991?utm_source=chatgpt.com)

分为三个 Tab：

1. 小组赛。
2. 淘汰赛。
3. 我的征程。

## **11.5 比赛界面**

[Soccer by Pathway Studios (Minecraft Marketplace Map) - Minecraft Bedrock Marketplace Explorer](https://images.openai.com/static-rsc-4/RSf3NihRGGhoma7BucST_9h6ZQwWnYuybLpUyFb6N36BDOkJN3dbo1tlOJM9dwJDmqZMVCyYV6hSpqSmNj84PjhO_yZGKxOGk5BD_JVxP_kWXLRV8ik-Wt42IwM0pq2D0lptSDVaOlqsjjcXuY7L9in4la79gahoMaHdSKDyS3U?purpose=inline)

[bedrockexplorer.com](https://www.bedrockexplorer.com/marketplace-content/pathway-studios/soccer?utm_source=chatgpt.com)

HUD 布局：

# **BRA 2 : 1 ARG**

世界杯 · 小组赛 · 01:35

比赛进行中

[Simple Games  - Page 1 • Simple Survival](https://images.openai.com/static-rsc-4/DRlvhONtpTm7VXistptMYHnLyrT8wuMmK41i3At3h7QgqKG-amPDXF8BqS-ckX47617fDbWG98jRh7EPCQkbd-H_OitX9ZakS6NSadQpHYTMShG3_kOwkZYXtnCkQi7xwknP9jbiuMmRqT7C6lO44W6waYjD0gqRHveOGZ3TOqc?purpose=inline)

[simplesurvival.gg](https://www.simplesurvival.gg/forum/topic/53-simple-games-/?utm_source=chatgpt.com)

**玩家状态**

LV.8

体力

大招能量：75%

**技能快捷栏**

# **🔥**

# **⚡**

# **❄️**

# **🌀**

# **🌟**

经验：75 / 100

## **11.6 技能选择界面**

[Buy Extremely Powerful Capybaras Steam PC PS5 Switch Xbox](https://images.openai.com/static-rsc-4/Q0u9FXWIuZZonUR0F759wYuTE_haaxCNG9pBA-vaOqK_1twK4f1ceJNB6GQM5fnXbbjuZ2-MWYRM306zSyUPt38JLPV2iZnU9XE--3nM4lOnHvs-HtcQWwM1xq4RjUcFE55LBdTS-r4R_emB59_phHNmeYpLFNHXi6B-p6VTWp0?purpose=inline)

[dlcompare.com](https://www.dlcompare.com/games/100025527/buy-extremely-powerful-capybaras-steam-key?utm_source=chatgpt.com)

三选一卡片必须展示：

- 技能名称。
- 技能图标。
- 技能品质。
- 技能分类。
- 当前等级。
- 技能效果。
- 升级后效果。
- 是否可进化。
- 选择按钮。

## **11.7 装备界面**

展示六个装备槽、装备属性、特殊效果、装备品质和更换功能。

## **11.8 技能图鉴**

[魔法书幸存者官方高清截图欣赏_官方图集下载_3DM单机](https://images.openai.com/static-rsc-4/b3yiCo9AV_y-7bM7S9SwLH-pLrfgE4Ow5vitpMGHPe_gYlx4R-QNj-Xylt0lWsAmFyEu78KYJkLiKaJb4m_k-EUe-EDCsGQUXEpPeJ7i6AILJbvLR_LPVZn-5e_BiH9HobChPrEzYZPf5YYS6-NwrkKjMgMh1O0tfN-p_iPzbTg?purpose=inline)

[3dmgame.com](https://www.3dmgame.com/tu/3743901.html?utm_source=chatgpt.com)

技能图鉴分为：

- 主动技能。
- 被动技能。
- 射门技能。
- 防守技能。
- 终极技能。
- 进化技能。

每种技能显示：

- 技能名称。
- 技能描述。
- 品质。
- 等级上限。
- 获取条件。
- 进化条件。
- 技能视频预览或动画。

## **11.9 结算页面**

比赛结束显示：

- 比赛比分。
- 胜利或失败。
- 球员数据。
- 球队数据。
- 进球回放。
- 金币奖励。
- 经验奖励。
- 解锁内容。
- 下一场比赛。

世界杯结束后显示最终排名、冠军奖杯、最佳球员和整届赛事数据。

# **十二、游戏难度与平衡**

## **12.1 难度等级**

| 难度   | 对手属性倍率 | AI          |
| ---- | ------ | ----------- |
| 新手   | 0.7    | 基础          |
| 普通   | 1.0    | 标准          |
| 困难   | 1.2    | 积极逼抢        |
| 地狱   | 1.5    | 高级战术        |
| 世界冠军 | 1.8    | 完整战术 + 技能组合 |

## **12.2 对手成长**

对手强度随着赛事阶段增长。

| 阶段   | 属性倍率 |
| ---- | ---- |
| 小组赛  | 1.0  |
| 16 强 | 1.1  |
| 8 强  | 1.2  |
| 半决赛  | 1.3  |
| 决赛   | 1.5  |

以上为普通难度基准，其他难度在此基础上叠加。

## **12.3 技能平衡**

重点控制：

- 火焰、雷电、陨石的伤害。
- 冰冻、减速、时间控制的持续时间。
- 瞬移和飞行技能的位移距离。
- 自动追踪射门的修正角度。
- 守门员无敌技能的持续时间。
- 大招释放频率。
- 技能冷却缩减上限。

特别注意：足球竞技不能完全转化为纯数值攻击游戏。

技能应该创造进球机会、突破机会和防守机会，而不是直接绕过足球规则自动判定进球。

# **十三、技术架构**

## **13.1 技术栈**

采用纯前端架构，所有比赛逻辑、AI、物理、世界杯模拟、技能系统均在浏览器运行。

| 模块       | 技术                      | 用途       |
| -------- | ----------------------- | -------- |
| 前端       | React + TypeScript      | 页面与业务逻辑  |
| 构建       | Vite                    | 项目构建     |
| 3D 引擎    | Three.js                | 方块世界     |
| React 3D | React Three Fiber       | 场景组件     |
| 3D 辅助    | Drei                    | 摄像机、模型加载 |
| 物理引擎     | Rapier.js               | 球员和足球碰撞  |
| 动画       | Three.js AnimationMixer | 球员动画     |
| 特效       | Shader + GPU Particles  | 技能效果     |
| 状态管理     | Zustand                 | 游戏状态     |
| 音频       | Howler.js               | 音效和音乐    |
| UI       | Tailwind CSS            | 游戏界面     |
| 数据       | JSON / TypeScript       | 球队和技能配置  |
| 存档       | IndexedDB               | 游戏存档     |

## **13.2 系统架构**

```
React UI
   │
   ├── MainMenu
   ├── TeamSelection
   ├── WorldCup
   ├── Tournament
   ├── GameHUD
   ├── SkillSelection
   ├── Equipment
   ├── Shop
   ├── Encyclopedia
   └── Result
          │
          ▼
      Game Manager
          │
   ┌──────┼──────────┐
   ▼      ▼          ▼
Football  Roguelike  Tournament
Engine    Engine     Engine
   │      │          │
   ▼      ▼          ▼
Physics  Skill      WorldCup
AI       Manager    Simulator
VFX      Evolution  Group Stage
Animation Equipment Knockout
   │      │          │
   └──────┼──────────┘
          ▼
       Game Store
          │
          ▼
     IndexedDB Save
```

## **13.3 项目目录结构**

```
src/
├── app/
│   ├── App.tsx
│   └── router.ts
│
├── components/
│   ├── MainMenu/
│   ├── TeamSelect/
│   ├── Tournament/
│   ├── GameHUD/
│   ├── SkillSelection/
│   ├── Equipment/
│   ├── Shop/
│   ├── Encyclopedia/
│   ├── Achievement/
│   └── Result/
│
├── game/
│   ├── core/
│   │   ├── GameEngine.ts
│   │   ├── GameLoop.ts
│   │   ├── GameState.ts
│   │   └── EventBus.ts
│   │
│   ├── world/
│   │   ├── Stadium.ts
│   │   ├── FootballField.ts
│   │   ├── StadiumBuilder.ts
│   │   ├── WeatherSystem.ts
│   │   └── CrowdSystem.ts
│   │
│   ├── player/
│   │   ├── Player.ts
│   │   ├── PlayerController.ts
│   │   ├── PlayerAI.ts
│   │   ├── TeamAI.ts
│   │   ├── GoalkeeperAI.ts
│   │   └── AnimationManager.ts
│   │
│   ├── football/
│   │   ├── Football.ts
│   │   ├── Physics.ts
│   │   ├── ShootingSystem.ts
│   │   ├── PassingSystem.ts
│   │   ├── GoalDetector.ts
│   │   └── MatchRules.ts
│   │
│   ├── skills/
│   │   ├── SkillManager.ts
│   │   ├── SkillRegistry.ts
│   │   ├── SkillExecutor.ts
│   │   ├── SkillEvolution.ts
│   │   ├── SkillPool.ts
│   │   └── UltimateManager.ts
│   │
│   ├── roguelike/
│   │   ├── RewardManager.ts
│   │   ├── LevelSystem.ts
│   │   ├── RandomGenerator.ts
│   │   ├── ShopManager.ts
│   │   ├── EquipmentManager.ts
│   │   └── EventManager.ts
│   │
│   ├── tournament/
│   │   ├── WorldCup.ts
│   │   ├── GroupGenerator.ts
│   │   ├── GroupStage.ts
│   │   ├── Standings.ts
│   │   ├── KnockoutStage.ts
│   │   ├── MatchSimulator.ts
│   │   └── PenaltyShootout.ts
│   │
│   └── vfx/
│       ├── ParticleManager.ts
│       ├── FireEffect.ts
│       ├── LightningEffect.ts
│       ├── IceEffect.ts
│       ├── ExplosionEffect.ts
│       └── UltimateEffect.ts
│
├── data/
│   ├── teams.json
│   ├── players.json
│   ├── skills.json
│   ├── evolutions.json
│   ├── equipment.json
│   ├── stadiums.json
│   ├── events.json
│   └── achievements.json
│
├── assets/
│   ├── models/
│   ├── textures/
│   ├── animations/
│   ├── audio/
│   ├── icons/
│   └── particles/
│
├── store/
│   ├── gameStore.ts
│   ├── tournamentStore.ts
│   ├── skillStore.ts
│   └── saveStore.ts
│
└── utils/
    ├── math.ts
    ├── random.ts
    ├── physics.ts
    └── balance.ts
```

## **13.4 数据驱动技能架构**

所有技能统一使用数据驱动配置，不能给 92 个技能分别写独立的游戏主逻辑。

技能配置示例：

```
{
  "id": "fire_shot",
  "name": "火焰射门",
  "category": "shooting",
  "rarity": "epic",
  "maxLevel": 5,
  "cooldown": 12,
  "effects": {
    "shootPowerMultiplier": 1.3,
    "fireDamage": 10,
    "explosionRadius": 3
  },
  "vfx": "fire_ball",
  "audio": "fire_shot",
  "evolution": {
    "requiredSkills": [
      "iron_leg"
    ],
    "result": "fire_world_shot"
  }
}
```

技能执行器负责：

1. 检查释放条件。
2. 检查冷却时间。
3. 计算技能效果。
4. 应用足球物理参数。
5. 触发对应特效。
6. 播放音效。
7. 更新技能状态。
8. 检查是否满足进化条件。

## **13.5 世界杯数据架构**

球队数据必须独立管理。

```
{
  "id": "brazil",
  "name": "巴西",
  "stats": {
    "speed": 88,
    "shooting": 82,
    "dribbling": 96,
    "passing": 85,
    "defense": 70,
    "stamina": 85
  },
  "tactics": "technical",
  "passiveSkill": "samba_dance",
  "formation": "1-1-2"
}
```

32 支球队使用相同的数据结构，但各自具有不同的属性、被动、战术和球衣配置。

## **13.6 游戏存档**

使用 IndexedDB 保存完整征程。

保存内容：

- 玩家选择的国家队。
- 世界杯分组。
- 全部比赛结果。
- 当前比赛阶段。
- 球队阵容。
- 当前技能。
- 技能等级。
- 进化技能。
- 装备。
- 金币。
- 球队疲劳。
- 当前商店商品。
- 成就进度。
- 局外解锁内容。

要求：

- 比赛结束自动保存。
- 技能选择后自动保存。
- 商店购买后自动保存。
- 每次进入下一场比赛前自动保存。
- 发生异常时可以恢复最近一次安全存档。
- 支持导出和导入存档文件。

# **十四、性能与优化**

3D 方块足球游戏会同时运行球员 AI、足球物理和技能特效，需要重点优化。

## **14.1 性能目标**

| 指标   | PC  | 移动端   |
| ---- | --- | ----- |
| FPS  | 60  | 30～60 |
| 同屏球员 | 10  | 10    |
| 球场   | 完整  | 简化细节  |
| 粒子效果 | 高   | 中低    |
| 实时阴影 | 开启  | 限制数量  |
| 纹理   | 高质量 | 压缩纹理  |
| 画质档位 | 三档  | 三档    |

## **14.2 优化要求**

- InstancedMesh 渲染观众和装饰物。
- 球员模型共享几何体。
- 球衣采用材质参数动态换色。
- 远距离使用 LOD。
- 技能特效使用对象池。
- 粒子数量根据设备性能动态调整。
- 静态场景尽量合并网格。
- 控制物理碰撞检测频率。
- 使用固定时间步长运行物理模拟。
- UI 与 3D 渲染分离，避免频繁 React 重渲染。
- 关闭页面时暂停游戏逻辑。
- 切换标签页后暂停比赛并保存安全状态。

## **14.3 画质设置**

| 设置    | 低   | 中    | 高   |
| ----- | --- | ---- | --- |
| 阴影    | 关闭  | 简单   | 完整  |
| 粒子    | 少   | 中    | 多   |
| 观众    | 简化  | 标准   | 完整  |
| 特效    | 简化  | 标准   | 完整  |
| 抗锯齿   | 关闭  | FXAA | 高质量 |
| 渲染分辨率 | 0.7 | 0.85 | 1.0 |

# **十五、完整 MVP 内容清单**

第一版必须全部交付

这部分是整个项目最重要的开发约束。

| 模块         | 首发交付数量       |
| ---------- | ------------ |
| 国家队        | 32 支         |
| 小组         | 8 个          |
| 世界杯阶段      | 完整赛制         |
| 世界杯模拟比赛    | 64 场         |
| 玩家实际比赛     | 依晋级路线约 7～8 场 |
| 场上球员       | 5v5          |
| 球员动画       | 18 种         |
| 国家队专属被动    | 32 种         |
| 主动技能       | 20 种         |
| 被动技能       | 24 种         |
| 射门技能       | 20 种         |
| 防守技能       | 16 种         |
| 终极大招       | 12 种         |
| 技能进化       | 20 种         |
| 装备         | 32 件         |
| 球场         | 8 种          |
| 天气         | 6 种          |
| 特殊事件       | 16 种         |
| 精英 BOSS 模板 | 8 种          |
| 难度         | 5 档          |
| 商店商品       | 10 种         |
| 比赛挑战任务     | 完整任务池        |
| 成就         | 至少 40 项      |
| 技能图鉴       | 完整           |
| 球队图鉴       | 完整           |
| 装备图鉴       | 完整           |
| 本地存档       | 完整           |

**交付约束：**

- 不允许用空白卡片占位。
- 不允许出现无法获得的技能。
- 不允许只有名称没有效果的技能。
- 不允许球队只有旗帜而没有实际属性差异。
- 不允许 BOSS 只有外观没有实际机制。
- 不允许赛事页面显示固定的虚假比分。
- 不允许技能图鉴和实际技能池数据不一致。

# **十六、开发里程碑**

虽然 MVP 内容完整，但建议按模块开发，最后统一交付。

| 阶段  | 开发内容             | 验收标准            |
| --- | ---------------- | --------------- |
| P1  | 项目框架、3D 球场、球员    | 可以完整加载方块球场      |
| P2  | 足球物理、球员控制        | 可以完成射门、传球和抢断    |
| P3  | AI、门将、比赛规则       | 可以完成一场 5v5 比赛   |
| P4  | 32 支球队           | 全部球队具有真实数据和战术差异 |
| P5  | 92 个基础技能         | 全部技能可获取、升级或释放   |
| P6  | 20 种技能进化、12 个大招  | 全部进化和大招正常运行     |
| P7  | 装备、商店、经济系统       | 完整肉鸽成长循环        |
| P8  | 32 队世界杯          | 小组赛和淘汰赛全部正常运行   |
| P9  | 8 种球场、天气、事件、BOSS | 全部特殊内容可触发       |
| P10 | 图鉴、成就、存档         | 内容完整并能恢复进度      |
| P11 | UI、音效、特效         | 完整游戏体验          |
| P12 | 优化、测试、发布         | PC 和移动端可玩       |

# **十七、完整验收标准**

## **17.1 足球系统**

- 32 支国家队都可以作为比赛参与方。
- 5v5 阵容正常运行。
- 球员移动和动画正常。
- 足球物理正确。
- 射门、传球、抢断正常。
- 门将 AI 能够扑救。
- 球员 AI 能够跑位和配合。
- 比赛时间、比分正确。
- 进球判定正确。
- 加时赛和点球大战正常。
- 进球后正确重新开球。

## **17.2 世界杯系统**

- 32 支球队全部存在。
- 可以随机分组。
- 每组有 4 支球队。
- 每支球队参加 3 场小组赛。
- 积分排名正确。
- 前两名正常晋级。
- 淘汰赛对阵正确。
- AI 比赛能够模拟。
- 玩家比赛能够正常操作。
- 可以进入世界杯决赛。
- 冠军结果正确保存。

## **17.3 技能系统**

- 20 个主动技能全部可用。
- 24 个被动技能全部可用。
- 20 个射门技能全部可用。
- 16 个防守技能全部可用。
- 12 个大招全部可用。
- 20 个进化技能全部可以触发。
- 技能升级正确。
- 技能冷却正确。
- 技能效果真正影响比赛。
- 技能图鉴数据完整。

## **17.4 肉鸽系统**

- 经验正常获取。
- 升级能够触发三选一。
- 随机技能分布正确。
- 技能品质概率正确。
- 技能能够进化。
- 商店能够购买商品。
- 装备能够穿戴。
- 金币能够正确结算。
- 每场比赛可以形成不同构筑。

## **17.5 视觉和操作**

- 完整 Minecraft 风格方块世界。
- 全部球队球衣正确。
- 球员动画完整。
- 8 种球场正常显示。
- 6 种天气正常运行。
- 16 种随机事件正常触发。
- 大招特效完整。
- PC 键盘操作正常。
- 手机虚拟摇杆操作正常。
- UI 适配横屏手机。

# **十八、推荐开发重点与最终方向**

我建议这个项目不要做成传统 FIFA 的简化版，而是做成一款**以进球为目标的超能力肉鸽足球游戏**。

核心区别在于：

[『ブルーロック』｜“エゴこそ武器だ！”日本サッカーの常識をぶち壊す超攻撃的サバイバルスポーツアニメ｜おと](https://images.openai.com/static-rsc-4/oG4b3cnUceXGIum4JlOjeDwETClb_hMjzVG9WTvcItvZp4VEGvxt43jYovLMNKkK6hhHFuEtZA_MNm_GQ3u_K-TpQoz4GPgRpNLvy3JHl9T_TA7P3fGg2Zf7oYvkgysQNfJQUKLTHqTrpO_uaJz6x2N4F8rrNnezPJHdFiR5yiU?purpose=inline)

[note.com](https://note.com/just_deer215/n/n87679e4c837c?utm_source=chatgpt.com)

# **方块世界杯：Rogue Football**

**32 支国家队 · 92 个基础技能 · 20 种进化 · 12 个终极大招**

## **五大核心卖点**

1. 32 支国家队完整世界杯征程。
2. 5v5 快节奏足球竞技。
3. 92 个可构筑的足球超能力。
4. 20 种技能进化组合。
5. 8 种特色球场与随机赛事事件。

**我最推荐的三个核心流派：**

[Sulfer football arena v1.0 - Minecraft Bedrock Maps - CurseForge](https://images.openai.com/static-rsc-4/E4QcYR_QzuWbKAT0JVYIK1_V_bXshuqKLzKFieETSw8lxU_GCE6QC_oijWKQOR5Vcj9uns2jmsCazjnpG6WwscVF0ATULjc_yCZVr-7d2UUntx_P31xO7i-_nJlddTpuVDzfxnU4JRUUdKS8N0CnX96Vx15kfL7XJVj6kcP9p8o?purpose=inline)

**火焰核爆流**

火焰射门 + 铁腿 + 爆裂射门 + 陨石射门。

玩法：高伤害、大范围冲击、强力射门。

[Lightning ball 3D model animated | CGTrader](https://images.openai.com/static-rsc-4/JFTGg3RTaCSvVoeMJaHytbvFWcOi3-HeS-S2DhSSSAXdrA0NXT7sdBY9IAVXBnPbn3P-bvrUulmzhxH4zsP45At5hce0IIz460PPuB56q37nZO7TkwY8R3kdTpzkJ99l2tnVdwRryK4H22MR4Sk_9w1zH4EpTzDHGQESw4RFKbw?purpose=inline)

**雷霆速度流**

闪电冲刺 + 雷电射门 + 飞毛腿 + 速度领域。

玩法：极限速度、快速突破、闪电进球。

[Cryo Mage - Minecraft Bedrock Addons - CurseForge](https://images.openai.com/static-rsc-4/amRbJxVpr__9T1CtHkZMyqYCCwF-QlKeRkicqzYPS2_KzO9FxqwK7RbpsmhuexAmKCOC9CDKEgVzkAigoChkO5FMAJsz7H1En88_ZtwLjXqUxu_kB22c6YGUX9eiPnNUCW2qe8bSfSdJsXn_EqTHN74QTlUp996BNgKMFCsADV8?purpose=inline)

**冰霜控制流**

冰霜射门 + 冰冻铲球 + 领域压制 + 绝对零度。

玩法：冻结对手、控制球场、创造射门机会。

## **十九、最终开发约束**

为了保证完整 MVP 的质量，建议额外明确以下规则：

1. 92 个基础技能必须全部进入实际游戏技能池，不能仅制作图鉴。
2. 20 个技能进化必须有实际可触发的组合逻辑。
3. 32 支球队必须拥有独立的战术参数、被动技能和球衣。
4. 64 场世界杯赛事都必须能够产生有效比赛数据。
5. 8 种球场必须能够正常加载，不能只是换背景图片。
6. 8 个 BOSS 模板必须拥有不同的实际机制。
7. 所有技能、装备、球队、赛事数据采用数据驱动，方便后续扩展。
8. 游戏必须可以完全离线运行，不能依赖远程 API 才能完成比赛。
9. 第一版必须包含完整的世界杯冠军结算和存档恢复。
10. 所有核心内容必须在 PC 和移动端进行实际测试。

**最终验收目标：** 用户第一次打开游戏，就能够选择 32 支国家队中的任意一支，完整体验世界杯赛程，通过足球操作和随机技能构筑打完整个赛事，最终争夺世界杯冠军。所有规划的技能、进化、装备和特殊比赛内容均在第一版中交付。