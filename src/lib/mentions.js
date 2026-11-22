import { sbVars } from "./sbTheme";

const MAX_AT_SCAN = 20;
const MAX_QUERY_LEN = 40;
const isWordChar = (ch) => !!ch && /[\p{L}\p{N}_]/u.test(ch);
const isSpace = (ch) => !!ch && /\s/.test(ch);

function nameKeys(m) {
  const out = new Set();
  for (const v of [m?.displayName, m?.name]) {
    const s = String(v || "").trim().toLowerCase();
    if (s) out.add(s);
  }
  return out;
}

function countNames(members) {
  const counts = new Map();
  for (const m of members || []) {
    for (const k of nameKeys(m)) counts.set(k, (counts.get(k) || 0) + 1);
  }
  return counts;
}

// Unique lowercase names, longest first. Build once per members change.
export function buildMentionIndex(members) {
  return [...countNames(members).entries()]
    .filter(([, c]) => c === 1)
    .map(([k]) => k)
    .sort((a, b) => b.length - a.length);
}

// Returns null when the text has no mention, else [{ t, m }] segments.
export function splitMentions(text, index) {
  const s = typeof text === "string" ? text : "";
  if (!s || !index || index.length === 0 || s.indexOf("@") === -1) return null;
  const parts = [];
  let last = 0;
  let i = 0;
  let scanned = 0;
  let found = false;
  while (i < s.length && scanned < MAX_AT_SCAN) {
    const at = s.indexOf("@", i);
    if (at === -1) break;
    scanned++;
    i = at + 1;
    if (at > 0 && !isSpace(s[at - 1])) continue;
    for (const name of index) {
      const end = at + 1 + name.length;
      if (s.slice(at + 1, end).toLowerCase() === name && !isWordChar(s[end])) {
        if (at > last) parts.push({ t: s.slice(last, at), m: false });
        parts.push({ t: s.slice(at, end), m: true });
        last = end;
        i = end;
        found = true;
        break;
      }
    }
  }
  if (!found) return null;
  if (last < s.length) parts.push({ t: s.slice(last), m: false });
  return parts;
}

// Picker: the "@query" just before the caret, or null. Needs 2+ characters.
export function getMentionQuery(value, caret) {
  const s = typeof value === "string" ? value : "";
  const pos = Number.isInteger(caret) ? Math.min(caret, s.length) : s.length;
  if (pos < 3) return null;
  const at = s.lastIndexOf("@", pos - 1);
  if (at === -1 || pos - at - 1 > MAX_QUERY_LEN) return null;
  if (at > 0 && !isSpace(s[at - 1])) return null;
  const query = s.slice(at + 1, pos);
  if (query.length < 2 || isSpace(query[0]) || /[\r\n]/.test(query)) return null;
  return { start: at + 1, end: pos, query };
}

// Display names starting with the query, max 5, excluding me and shared names.
export function getMentionSuggestions(members, query, myEmail, myName, limit = 5) {
  const q = String(query || "").toLowerCase();
  if (q.length < 2) return [];
  const counts = countNames(members);
  const meMail = String(myEmail || "").trim().toLowerCase();
  const meName = String(myName || "").trim().toLowerCase();
  const out = [];
  const seen = new Set();
  for (const m of members || []) {
    const name = String(m?.displayName || m?.name || "").trim();
    const low = name.toLowerCase();
    if (!name || seen.has(low) || counts.get(low) !== 1) continue;
    const mMail = String(m?.email || "").trim().toLowerCase();
    const isMe = meMail && mMail ? mMail === meMail : low === meName;
    if (isMe || !low.startsWith(q)) continue;
    seen.add(low);
    out.push(name);
    if (out.length >= limit) break;
  }
  return out;
}

// Replaces "@query" with the full name plus a space. Returns { value, caret }.
export function applyMentionPick(value, range, name) {
  const s = String(value || "");
  const before = s.slice(0, range.start);
  let after = s.slice(range.end);
  if (after.startsWith(" ")) after = after.slice(1);
  const insert = `${name} `;
  return { value: before + insert + after, caret: before.length + insert.length };
}

// Solid colors (no gradients, iOS Safari). Taken from the --sb-* palette because
// those CSS variables only exist inside the Navbar, not on the cards.
const V_DARK = sbVars("dark");
const V_LIGHT = sbVars("light");
const base = { fontWeight: 600, padding: "0 3px", borderRadius: 4 };
const STYLE_DARK = { ...base, color: V_DARK["--sb-blue"], background: V_DARK["--sb-blue-soft"] };
const STYLE_LIGHT = { ...base, color: V_LIGHT["--sb-blue"], background: V_LIGHT["--sb-blue-soft"] };
export const mentionStyle = (theme) => (theme === "light" ? STYLE_LIGHT : STYLE_DARK);