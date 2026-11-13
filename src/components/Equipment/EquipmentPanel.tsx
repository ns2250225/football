import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { EQUIP_SLOTS, SLOT_NAME, SLOT_ICON, RARITY_COLOR, MOD_NAMES, Mods, EquipDef } from '../../game/types';
import { EQUIP_MAP } from '../../data/equipment';
import { RarityTag } from '../common/UI';

export function modsText(m: Partial<Mods>): string {
  return Object.entries(m).filter(([, v]) => typeof v === 'number' && v !== 0).map(([k, v]) => `${MOD_NAMES[k as keyof Mods]} ${v! > 0 ? '+' : ''}${Math.round(v! * 100)}%`).join('，');
}

function EquipInfo({ e }: { e: EquipDef }) {
  return (
    <div className="text-xs">
      <div className="flex items-center gap-2"><span className="text-2xl">{e.icon}</span><b style={{ color: RARITY_COLOR[e.rarity] }}>{e.name}</b><RarityTag r={e.rarity} /></div>
      <div className="text-gray-200 mt-1">{e.desc}</div>
      {modsText(e.mods) && <div className="text-cyan-200">属性：{modsText(e.mods)}</div>}
      {e.shot && <div className="text-orange-200">射门属性：蓄力射门附加元素效果</div>}
      {e.special && <div className="text-purple-200">特殊效果：{e.special.desc}</div>}
      <div className="text-gray-400">获取途径：{e.source}</div>
    </div>
  );
}

/** 装备界面：6 个装备槽 + 背包，支持穿戴与卸下 */
export default function EquipmentPanel() {
  const run = useGame((s) => s.run)!;
  const equipItem = useGame((s) => s.equipItem);
  const unequip = useGame((s) => s.unequipSlot);
  const [sel, setSel] = useState<string | null>(null);
  const selDef = sel ? EQUIP_MAP[sel] : null;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {EQUIP_SLOTS.map((s) => {
          const id = run.equipSlots[s];
          const e = id ? EQUIP_MAP[id] : null;
          return (
            <div key={s} className={`mc-panel p-2 flex flex-col gap-1 ${e ? `rarity-${e.rarity}` : ''}`} style={{ borderWidth: 3 }}>
              <div className="text-xs text-gray-400">{SLOT_ICON[s]} {SLOT_NAME[s]}</div>
              {e ? (<>
                <button className="text-left" onClick={() => setSel(e.id)}><span className="text-2xl">{e.icon}</span> <b className="text-sm" style={{ color: RARITY_COLOR[e.rarity] }}>{e.name}</b></button>
                <button className="mc-btn small red" onClick={() => unequip(s)}>卸下</button>
              </>) : <div className="text-gray-500 text-sm py-3 text-center">空槽位</div>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <div className="mc-panel p-2">
          <div className="font-bold mb-1">🎒 背包（{run.inventory.length}）</div>
          {run.inventory.length === 0 && <div className="text-xs text-gray-400">背包为空。可通过装备箱、商店、任务、击败 BOSS、三选一获得装备。</div>}
          <div className="grid grid-cols-2 gap-1">
            {run.inventory.map((id) => { const e = EQUIP_MAP[id]; return (
              <button key={id} onClick={() => setSel(id)} className={`mc-panel-light p-1 text-left text-xs rarity-${e.rarity}`} style={{ borderWidth: 2 }}>{e.icon} {e.name}<span className="text-gray-400">（{SLOT_NAME[e.slot]}）</span></button>
            ); })}
          </div>
        </div>
        {selDef && (
          <div className="mc-panel p-2">
            <EquipInfo e={selDef} />
            {run.inventory.includes(selDef.id) && <button className="mc-btn green small mt-2" onClick={() => { equipItem(selDef.id); }}>穿戴（替换{SLOT_NAME[selDef.slot]}）</button>}
            {run.equipSlots[selDef.slot] && run.equipSlots[selDef.slot] !== selDef.id && <div className="text-xs mt-1 text-gray-300">当前：{EQUIP_MAP[run.equipSlots[selDef.slot]!].name}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
export { EquipInfo };
