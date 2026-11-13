import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { Screen, RunTopInfo } from '../common/UI';
import { SHOP_MAP } from '../../data/shop';
import { restockCost } from '../../game/roguelike/ShopManager';
import DraftModal from '../SkillSelection/DraftModal';

/** 商店：每场比赛后提供 5~7 个随机商品，可花费金币补货刷新 */
export default function Shop() {
  const { run, buy, restockShop, leaveShop } = useGame();
  const [msg, setMsg] = useState<string | null>(null);
  if (!run || !run.shop) return null;
  const draftOpen = !!run.draft && run.pendingDrafts > 0;
  return (
    <Screen title="🛒 商店" onBack={leaveShop} right={<RunTopInfo />}>
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        <div className="text-sm text-gray-300">使用本次征程的金币购买道具。购买后立即生效并自动保存。</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {run.shop.offers.map((o, i) => {
            const it = SHOP_MAP[o.itemId];
            const sale = o.price < it.price;
            return (
              <div key={i} className={`mc-panel p-3 flex flex-col gap-1 ${o.sold ? 'opacity-50' : ''}`}>
                <div className="text-4xl">{it.icon}</div>
                <div className="font-black pixel-text">{it.name} {sale && <span className="text-xs text-red-300">特价</span>}</div>
                <div className="text-sm text-gray-300 flex-1">{it.desc}</div>
                <button className="mc-btn gold" disabled={o.sold || run.gold < o.price} onClick={() => setMsg(buy(i) || null)}>
                  {o.sold ? '已售出' : `🪙 ${o.price}${sale ? `（原价 ${it.price}）` : ''}`}
                </button>
              </div>
            );
          })}
        </div>
        {msg && <div className="mc-panel p-2 text-center font-bold text-yellow-300">{msg}</div>}
        <div className="flex flex-wrap gap-2 justify-center">
          <button className="mc-btn purple" disabled={run.gold < restockCost(run)} onClick={() => { if (restockShop()) setMsg('商店已补货刷新'); }}>🔄 补货刷新（🪙{restockCost(run)}）</button>
          <button className="mc-btn green" onClick={leaveShop}>{run.ended ? '前往世界杯结算 ▶' : '返回赛程 ▶'}</button>
        </div>
      </div>
      {draftOpen && <DraftModal onPicked={() => {}} />}
    </Screen>
  );
}
