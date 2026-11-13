import { RunState, MetaState } from '../game/types';

// IndexedDB 存档 + LocalStorage 安全备份
const DB_NAME = 'rogue_football_db';
const STORE = 'saves';
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbPromise;
}
async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB(); if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve(r.result as T);
      r.onerror = () => resolve(undefined);
    } catch { resolve(undefined); }
  });
}
async function idbSet(key: string, val: unknown): Promise<boolean> {
  const db = await openDB(); if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(val, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}
async function idbDel(key: string) {
  const db = await openDB(); if (!db) return;
  try { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(key); } catch { /* ignore */ }
}
const ls = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* 存储已满或不可用 */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export function validateRun(r: unknown): r is RunState {
  if (!r || typeof r !== 'object') return false;
  const x = r as RunState;
  return typeof x.teamId === 'string' && !!x.tournament && Array.isArray(x.tournament.matches) && x.tournament.matches.length === 64
    && Array.isArray(x.skills) && Array.isArray(x.roster) && typeof x.gold === 'number' && typeof x.level === 'number';
}
export function validateMeta(m: unknown): m is MetaState {
  if (!m || typeof m !== 'object') return false;
  const x = m as MetaState;
  return Array.isArray(x.unlocked) && !!x.stats && !!x.settings;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** 保存征程：先把旧存档转为安全备份，再写入新存档 */
export async function saveRun(run: RunState | null) {
  if (!run) { await idbDel('run'); ls.del('rf_run'); return; }
  const data = clone(run);
  const prev = await idbGet<RunState>('run');
  if (prev && validateRun(prev)) await idbSet('run_backup', prev);
  const ok = await idbSet('run', data);
  const json = JSON.stringify(data);
  ls.set('rf_run', json);
  if (!ok) ls.set('rf_run_backup', json);
}
export async function loadRun(): Promise<RunState | null> {
  const r = await idbGet<RunState>('run');
  if (validateRun(r)) return r;
  return loadBackupRun();
}
export async function loadBackupRun(): Promise<RunState | null> {
  const b = await idbGet<RunState>('run_backup');
  if (validateRun(b)) return b;
  for (const k of ['rf_run', 'rf_run_backup']) {
    const s = ls.get(k);
    if (s) { try { const v = JSON.parse(s); if (validateRun(v)) return v; } catch { /* 损坏 */ } }
  }
  return null;
}
export async function saveMeta(meta: MetaState) {
  const data = clone(meta);
  await idbSet('meta', data);
  ls.set('rf_meta', JSON.stringify(data));
}
export async function loadMeta(): Promise<MetaState | null> {
  const m = await idbGet<MetaState>('meta');
  if (validateMeta(m)) return m;
  const s = ls.get('rf_meta');
  if (s) { try { const v = JSON.parse(s); if (validateMeta(v)) return v; } catch { /* ignore */ } }
  return null;
}
export function exportSave(run: RunState | null, meta: MetaState) {
  const blob = new Blob([JSON.stringify({ app: 'rogue-football', version: 1, exportedAt: new Date().toISOString(), run, meta }, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `方块世界杯存档_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export async function parseImport(file: File): Promise<{ run: RunState | null; meta: MetaState } | null> {
  try {
    const txt = await file.text();
    const data = JSON.parse(txt);
    if (!validateMeta(data.meta)) return null;
    return { run: validateRun(data.run) ? data.run : null, meta: data.meta };
  } catch { return null; }
}
