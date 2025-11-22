// ========================================
//  constants.js（pocoapoco）
//  すべての環境変数・localStorageキー・URL定数を管理
// ========================================

// -----------------------------
// 🔹 環境変数
// -----------------------------
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Stripe Subscriptions（将来の利用想定）
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

// アプリベースURL
export const BASE_APP_URL = process.env.NEXT_PUBLIC_BASE_APP_URL || "";

// -----------------------------
// 🔹 localStorage Keys（完全統一）
// -----------------------------
export const LS_CHILDREN = "pocopoco_children";
export const LS_CURRENT_CHILD_ID = "pocopoco_current_child_id";

export const LS_HISTORY = "pocopoco_history";

export const LS_SONGS = "pocopoco_songs"; // 曲データ（子どもごと）
export const LS_TASKS = "pocopoco_tasks"; // タスク定義

// イベント（新仕様）
export const LS_EVENTS = "pocopoco_events";
// 旧仕様（レガシー）
export const LS_EVENT_LEGACY = "pocopoco_event";

// カレンダー設定（週始まり＋練習バッジ）
export const LS_CALENDAR_SETTINGS = "pocoapoco_calendar_settings";

// カレンダー表示タスク絞り込み
export const LS_CALENDAR_TASK_FILTER = "pocopoco_calendar_task_filter";

// 言語設定
export const LS_LANG = "pocopoco_lang";

// 時間割（子どもごと）
export const LS_WEEKLY_TIMETABLE = "pocoapoco_timetable_by_child";

// ロール関連
export const LS_ROLE = "pocopoco_role"; // parent / child
export const LS_PARENT_CODE = "pocopoco_parentCode";
export const LS_PARENT_AUTHED = "pocopoco_parentAuthed";
export const LS_MODE = "pocopoco_mode"; // UIモード（旧）→ 今は非推奨だが残す

// -----------------------------
// 🔹 URL（アプリ内ルート）
// -----------------------------
export const ROUTE_HOME = "/";
export const ROUTE_RECORD = "/record";
export const ROUTE_HISTORY = "/history";
export const ROUTE_HISTORY_EDIT = "/history/edit";
export const ROUTE_CALENDAR = "/calendar";
export const ROUTE_CALENDAR_SETTINGS = "/calendar-settings";

export const ROUTE_SONGS = "/songs";
export const ROUTE_SONGS_NEW = "/songs/new";
export const ROUTE_SONGS_EDIT = "/songs/edit";

export const ROUTE_WEEKLY_BOARD = "/weeklyboard";
export const ROUTE_SETTINGS = "/settings";
export const ROUTE_LOGIN = "/login"; // アプリ内ログイン

// -----------------------------
// 🔹 外部（ポータル側）
// -----------------------------
// 例: https://choco-on-labo.com/pocoapoco/login に接続する時用
export const PORTAL_LOGIN_URL = `${BASE_APP_URL}/pocoapoco/login`;
export const PORTAL_BUY_URL = `${BASE_APP_URL}/buy/pocoapoco`;

// -----------------------------
// 🔹 アプリ共通で使う定数
// -----------------------------
export const DEFAULT_BADGES = {
  level1: { minutes: 1, icon: "🌸" },
  level2: { minutes: 30, icon: "🥉" },
  level3: { minutes: 60, icon: "🥈" },
  level4: { minutes: 90, icon: "🥇" }
};

// -----------------------------
// 🔹 子ども最大数
// -----------------------------
export const MAX_CHILDREN = 5;

// -----------------------------
// 🔹 デバッグログ
// -----------------------------
export const DEBUG = false;
