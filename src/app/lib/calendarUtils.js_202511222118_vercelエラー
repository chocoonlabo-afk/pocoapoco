// src/app/lib/calendarUtils.js
"use client";

import {
  LS_CALENDAR_SETTINGS,
  LS_EVENTS,
  LS_EVENT_LEGACY,
  LS_CALENDAR_TASK_FILTER,
  LS_TASKS,
  LS_BIRTHDAY,
} from "@/app/constants";

// ========================
// 日付ユーティリティ
// ========================

// YYYY-MM-DD 文字列に変換
export function toDayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// カレンダーセルを作る（前の空白 + 1〜末日）
export function buildCalendarCells(year, month) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) {
    cells.push(new Date(year, month, d));
  }
  return cells;
}

// ========================
// カレンダーバッジ関係
// ========================

// デフォルトバッジ定義
export const DEFAULT_BADGES = [
  { id: "level1", name: "少しでも練習した日", minMinutes: 1, icon: "🌸" },
  { id: "level2", name: "たくさん練習（銅）", minMinutes: 30, icon: "🥉" },
  { id: "level3", name: "もっとたくさん（銀）", minMinutes: 60, icon: "🥈" },
  { id: "level4", name: "すごくがんばった（金）", minMinutes: 90, icon: "🥇" },
];

// localStorage からバッジ設定を読む
export function loadCalendarSettingsFromStorage() {
  if (typeof window === "undefined") return DEFAULT_BADGES;
  let badges = DEFAULT_BADGES;
  try {
    const raw = window.localStorage.getItem(LS_CALENDAR_SETTINGS);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.badges) && data.badges.length > 0) {
        badges = DEFAULT_BADGES.map((def) => {
          const found = data.badges.find((b) => b.id === def.id);
          return found ? { ...def, ...found } : def;
        });
      }
    }
  } catch (e) {
    console.warn("calendar settings parse error", e);
  }
  return badges;
}

// 分数に応じて色・アイコンを決める
export function getBadgeFromSettings(minutes, badges) {
  if (!minutes || minutes <= 0) {
    return {
      bg: "#ffffff",
      border: "#dddddd",
      text: "#999999",
      label: "",
    };
  }

  const sorted = [...badges].sort(
    (a, b) => Number(a.minMinutes || 0) - Number(b.minMinutes || 0)
  );
  let levelIndex = -1;
  let label = "";

  sorted.forEach((b, idx) => {
    const threshold = Number(b.minMinutes || 0);
    if (minutes >= threshold) {
      levelIndex = idx;
      label = b.icon || "";
    }
  });

  const colorLevels = [
    { bg: "#eef4ff", border: "#aac0ff", text: "#001a66" },
    { bg: "#e9ffe9", border: "#a8e4a8", text: "#045704" },
    { bg: "#fff4d9", border: "#ffcd73", text: "#6d4c00" },
    { bg: "#ffe7e7", border: "#ff9f9f", text: "#a00000" },
  ];

  if (levelIndex < 0) {
    return {
      bg: "#eef4ff",
      border: "#aac0ff",
      text: "#001a66",
      label,
    };
  }

  const color =
    colorLevels[Math.min(levelIndex, colorLevels.length - 1)] || colorLevels[0];

  return {
    ...color,
    label,
  };
}

// ========================
// イベント・タスク・誕生日
// ========================

// イベント一覧を読む（新 old 両対応）
export function loadEvents() {
  if (typeof window === "undefined") return [];
  // 新仕様
  try {
    const raw = window.localStorage.getItem(LS_EVENTS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    console.warn("pocopoco_events parse error", e);
  }

  // 旧仕様（単一イベント）
  try {
    const rawSingle = window.localStorage.getItem(LS_EVENT_LEGACY);
    if (rawSingle) {
      const s = JSON.parse(rawSingle);
      if (s && (s.title || s.date)) {
        return [
          {
            id: "legacy_single",
            title: s.title || "イベント",
            date: s.date || "",
            mark: "★",
            home: true,
            child_id: "all",
          },
        ];
      }
    }
  } catch (e) {
    console.warn("pocopoco_event parse error", e);
  }

  return [];
}

// カレンダーで合計対象にするタスクIDリスト
export function loadCalendarTaskFilter() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_CALENDAR_TASK_FILTER);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    return arr;
  } catch {
    return null;
  }
}

// タスク一覧（id/label辞書）
export function loadTasksDict() {
  if (typeof window === "undefined") return { byId: {}, byLabel: {} };
  try {
    const raw = window.localStorage.getItem(LS_TASKS);
    if (!raw) return { byId: {}, byLabel: {} };
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return { byId: {}, byLabel: {} };
    const byId = {};
    const byLabel = {};
    arr.forEach((t) => {
      if (t.id) byId[t.id] = t;
      const label = (t.label || "").trim().toLowerCase();
      if (label) byLabel[label] = t;
    });
    return { byId, byLabel };
  } catch {
    return { byId: {}, byLabel: {} };
  }
}

// 誕生日を読む
export function loadBirthday() {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(LS_BIRTHDAY);
    if (!raw) return "";
    return raw;
  } catch {
    return "";
  }
}

// その日が誕生日か？
export function isBirthdayDay(dateObj, birthdayStr) {
  if (!birthdayStr) return false;
  const parts = birthdayStr.split("-");
  if (parts.length < 3) return false;
  const m = parts[1];
  const d = parts[2];
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return mm === m && dd === d;
}

// 子どもごとの表示可否
export function isEventVisibleForChild(ev, childId) {
  if (!ev.child_id || ev.child_id === "all") return true;
  if (childId === "all") return ev.child_id === "all";
  return ev.child_id === childId;
}

export function filterEventsForChild(events, childId) {
  return events.filter((ev) => isEventVisibleForChild(ev, childId));
}

// ========================
// 練習履歴 → 日別集計
// ========================

// 日別の練習合計分
export function calcDailyMinutes(historyArr, filterIds, tasksByLabel, childId) {
  const map = {};

  const hasFilter = Array.isArray(filterIds) && filterIds.length > 0;
  const hasChildFilter = !!childId && childId !== "all";

  for (const rec of historyArr) {
    if (hasChildFilter && rec.child_id && rec.child_id !== childId) continue;

    const dayKey = rec.startedAt ? rec.startedAt.slice(0, 10) : rec.date;
    if (!dayKey) continue;
    const sec = rec.seconds ?? rec.duration ?? 0;

    if (!hasFilter) {
      map[dayKey] = (map[dayKey] || 0) + Math.floor(sec / 60);
      continue;
    }

    // task_id でマッチ
    if (rec.task_id && filterIds.includes(rec.task_id)) {
      map[dayKey] = (map[dayKey] || 0) + Math.floor(sec / 60);
      continue;
    }

    // label から推測
    const labels = [rec.task_title, rec.task].filter(Boolean);
    for (const label of labels) {
      const lc = label.trim().toLowerCase();
      const t = tasksByLabel[lc];
      if (t && filterIds.includes(t.id)) {
        map[dayKey] = (map[dayKey] || 0) + Math.floor(sec / 60);
        break;
      }
    }
  }

  return map;
}
