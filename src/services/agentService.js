import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

const COLLECTION = 'agents';
const RESERVED_FIELD_PREFIX = 'reservedField_';

// localStorage fallback — keeps the app usable when Firestore is unreachable
// (quota exceeded, offline, project paused). All writes mirror here; reads
// fall back here when the remote call fails or returns nothing.
const LS_AGENT_PREFIX = 'agent-arc:agent:';
const LS_INDEX_KEY = 'agent-arc:agents-index';

function lsRead(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsWrite(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { console.warn('[agentService] localStorage write failed', e); }
}
function lsRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

function lsGetIndex() {
  const raw = lsRead(LS_INDEX_KEY);
  if (!raw) return [];
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return []; }
}
function lsSetIndex(ids) { lsWrite(LS_INDEX_KEY, JSON.stringify(ids)); }

function lsSaveAgent(agentId, snapshot) {
  const record = { ...snapshot, id: agentId, _localUpdatedAt: Date.now(), _source: 'local' };
  lsWrite(LS_AGENT_PREFIX + agentId, JSON.stringify(record));
  const idx = lsGetIndex();
  if (!idx.includes(agentId)) {
    idx.push(agentId);
    lsSetIndex(idx);
  }
}

function lsGetAgent(agentId) {
  const raw = lsRead(LS_AGENT_PREFIX + agentId);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function lsGetAllAgents() {
  return lsGetIndex()
    .map((id) => lsGetAgent(id))
    .filter(Boolean);
}

function lsGetAgentBySlug(moduleSlug, agentSlug) {
  return lsGetAllAgents().find(
    (a) => a.moduleSlug === moduleSlug && a.agentSlug === agentSlug
  ) || null;
}

function lsDeleteAgent(agentId) {
  lsRemove(LS_AGENT_PREFIX + agentId);
  lsSetIndex(lsGetIndex().filter((id) => id !== agentId));
}

function encodeFieldKey(key) {
  if (/^__.*__$/.test(key)) return `${RESERVED_FIELD_PREFIX}${key.slice(2, -2)}`;
  return key;
}

function decodeFieldKey(key) {
  if (key.startsWith(RESERVED_FIELD_PREFIX)) {
    return `__${key.slice(RESERVED_FIELD_PREFIX.length)}__`;
  }
  return key;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function sanitizeForFirestore(value) {
  if (value === undefined || typeof value === 'function') return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => {
      const sanitized = sanitizeForFirestore(item);
      return sanitized === undefined ? null : sanitized;
    });
  }
  if (value && isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, nestedValue]) => [encodeFieldKey(key), sanitizeForFirestore(nestedValue)])
        .filter(([, nestedValue]) => nestedValue !== undefined)
    );
  }
  return value;
}

function restoreFromFirestore(value) {
  if (Array.isArray(value)) return value.map(restoreFromFirestore);
  if (value && isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, nestedValue]) => [decodeFieldKey(key), restoreFromFirestore(nestedValue)])
    );
  }
  return value;
}

// Save or update an agent. Always writes to localStorage first so user
// work survives a Firestore failure (quota exceeded, offline, etc.). Then
// attempts the Firestore write and swallows the error if it fails.
export async function saveAgent(agentId, snapshot) {
  lsSaveAgent(agentId, snapshot);
  try {
    await setDoc(doc(db, COLLECTION, agentId), {
      ...sanitizeForFirestore(snapshot),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[agentService] Firestore save failed; kept local copy', e);
  }
}

// Fetch a single agent by id. Falls back to localStorage on remote failure.
export async function getAgent(agentId) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, agentId));
    if (snap.exists()) return restoreFromFirestore({ id: snap.id, ...snap.data() });
  } catch (e) {
    console.warn('[agentService] Firestore getAgent failed; using local copy', e);
  }
  return lsGetAgent(agentId);
}

// Delete an agent by id (remote + local).
export async function deleteAgent(agentId) {
  lsDeleteAgent(agentId);
  try {
    await deleteDoc(doc(db, COLLECTION, agentId));
  } catch (e) {
    console.warn('[agentService] Firestore delete failed; removed local copy only', e);
  }
}

// ─── Module-level prefetch cache ─────────────────────────────────────────────
const agentCache = {};

function cacheKey(moduleSlug, agentSlug) {
  return `${moduleSlug}/${agentSlug}`;
}

export async function prefetchAgent(agentSlug, moduleSlug) {
  if (!agentSlug || !moduleSlug) return;
  const key = cacheKey(moduleSlug, agentSlug);
  if (agentCache[key]) return;
  try {
    const q = query(
      collection(db, COLLECTION),
      where('agentSlug', '==', agentSlug),
      where('moduleSlug', '==', moduleSlug)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      agentCache[key] = restoreFromFirestore({ id: snap.docs[0].id, ...snap.docs[0].data() });
      return;
    }
  } catch (e) {
    console.warn('[agentService] prefetchAgent Firestore failed; checking local', e);
  }
  const local = lsGetAgentBySlug(moduleSlug, agentSlug);
  if (local) agentCache[key] = local;
}

export function getCachedAgent(agentSlug, moduleSlug) {
  if (!agentSlug || !moduleSlug) return null;
  return agentCache[cacheKey(moduleSlug, agentSlug)] ?? null;
}

// Fetch a single agent by moduleSlug + agentSlug (checks cache first, then
// Firestore, then localStorage).
export async function getAgentBySlug(moduleSlug, agentSlug) {
  const key = cacheKey(moduleSlug, agentSlug);
  if (agentCache[key]) return agentCache[key];
  try {
    const q = query(
      collection(db, COLLECTION),
      where('agentSlug', '==', agentSlug),
      where('moduleSlug', '==', moduleSlug)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const result = restoreFromFirestore({ id: snap.docs[0].id, ...snap.docs[0].data() });
      agentCache[key] = result;
      return result;
    }
  } catch (e) {
    console.warn('[agentService] getAgentBySlug Firestore failed; using local copy', e);
  }
  const local = lsGetAgentBySlug(moduleSlug, agentSlug);
  if (local) agentCache[key] = local;
  return local;
}

// Subscribe to all agents in real-time. Emits local agents immediately so
// the list is never blank on startup, then layers remote results on top
// when Firestore is reachable. If the subscription itself fails (quota,
// offline), keeps emitting from localStorage only.
export function subscribeToAgents(onAgents) {
  const emitLocal = () => onAgents(lsGetAllAgents());
  emitLocal();

  try {
    return onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const remote = snapshot.docs.map((d) => restoreFromFirestore({ id: d.id, ...d.data() }));
        const remoteIds = new Set(remote.map((a) => a.id));
        const localOnly = lsGetAllAgents().filter((a) => !remoteIds.has(a.id));
        onAgents([...remote, ...localOnly]);
      },
      (err) => {
        console.warn('[agentService] Firestore subscription failed; using local only', err);
        emitLocal();
      }
    );
  } catch (e) {
    console.warn('[agentService] Firestore subscription threw; using local only', e);
    emitLocal();
    return () => {};
  }
}
