// src/app/settings/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { t, getLangFromStorage, setLangToStorage } from "../lib/i18n";

const DEFAULT_TASKS = [
  { id: "task_violin", label: "バイオリン", icon: "🎻" },
  { id: "task_piano", label: "ピアノ", icon: "🎹" },
  { id: "task_solfege", label: "ソルフェージュ", icon: "📝" },
  { id: "task_japanese", label: "国語", icon: "📖" },
  { id: "task_math", label: "算数", icon: "🔢" },
  { id: "task_english", label: "英語", icon: "🇬🇧" },
  { id: "task_science", label: "理科", icon: "🔬" },
  { id: "task_social", label: "社会", icon: "🌍" },
];

// カレンダー設定（バッジ）
const CALENDAR_SETTINGS_KEY = "pocoapoco_calendar_settings";

const DEFAULT_BADGES = [
  { id: "level1", name: "少しでも練習した日", minMinutes: 1, icon: "🌸" },
  { id: "level2", name: "たくさん練習（銅）", minMinutes: 30, icon: "🥉" },
  { id: "level3", name: "もっとたくさん（銀）", minMinutes: 60, icon: "🥈" },
  { id: "level4", name: "すごくがんばった（金）", minMinutes: 90, icon: "🥇" },
];

function loadCalendarSettingsFromStorage() {
  let badges = DEFAULT_BADGES;
  let firstDayOfWeek = "sun";

  try {
    const raw = localStorage.getItem(CALENDAR_SETTINGS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        if (data.firstDayOfWeek === "mon") {
          firstDayOfWeek = "mon";
        }
        if (Array.isArray(data.badges) && data.badges.length > 0) {
          badges = DEFAULT_BADGES.map((def) => {
            const found = data.badges.find((b) => b.id === def.id);
            return found ? { ...def, ...found } : def;
          });
        }
      }
    }
  } catch (e) {
    console.warn("calendar settings parse error", e);
  }

  return { firstDayOfWeek, badges };
}

// タスクのIDが欠けている古いデータをならす
function normalizeTasksForSettings(tasksLike) {
  if (!Array.isArray(tasksLike)) return [];
  return tasksLike.map((t, index) => {
    if (t.id) return t;
    const base =
      typeof t.label === "string" && t.label.length > 0
        ? t.label
        : `task_${index}`;
    const normalizedId =
      "task_" +
      base
        .toString()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w_ぁ-んァ-ン一-龥]/g, "") +
      "_" +
      index;
    return {
      id: normalizedId,
      label: t.label ?? `タスク${index + 1}`,
      icon: t.icon ?? "🎵",
    };
  });
}

// CSV書き出し（今はUIでは使っていないが、将来用に残しておく）
function exportToCSV(records) {
  if (!records || records.length === 0) {
    alert("きろくがありません。");
    return;
  }
  const header = ["date", "task", "minutes", "count", "memo"];
  const rows = records.map((r) => {
    const dateStr = r.startedAt
      ? new Date(r.startedAt).toLocaleString("ja-JP")
      : "";
    const minutes = Math.floor((r.seconds || 0) / 60);
    const count = r.count || 0;
    const memo = r.memo || "";
    const task = r.task || r.task_title || "";
    return [
      `"${dateStr}"`,
      `"${task.replace(/"/g, '""')}"`,
      `"${minutes}"`,
      `"${count}"`,
      `"${memo.replace(/"/g, '""')}"`,
    ].join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `pocopoco_history_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// CSV読み込み（こちらも将来用）
function parseCSV(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) throw new Error("CSVがみじかすぎます。");

  const header = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  if (
    header[0] !== "date" ||
    header[1] !== "task" ||
    header[2] !== "minutes" ||
    header[3] !== "count" ||
    header[4] !== "memo"
  ) {
    throw new Error("CSVのヘッダーがちがいます。");
  }

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const rawCells = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const cells = rawCells.map((c) => c.replace(/^"|"$/g, ""));
    const [dateStr, task, minutesStr, countStr, memo] = cells;
    const startedDate = new Date(dateStr);
    if (isNaN(startedDate.getTime())) continue;
    const seconds = parseInt(minutesStr, 10) * 60 || 0;
    const count = parseInt(countStr, 10) || 0;
    records.push({
      task,
      seconds,
      count,
      memo,
      startedAt: startedDate.toISOString(),
    });
  }
  return records;
}

function mergeHistory(oldArr, newArr) {
  const result = [...oldArr];
  for (const rec of newArr) {
    const exists = result.some(
      (r) =>
        r.startedAt === rec.startedAt &&
        (r.task || r.task_title) === (rec.task || rec.task_title) &&
        (r.seconds || 0) === (rec.seconds || 0) &&
        (r.count || 0) === (rec.count || 0)
    );
    if (!exists) result.push(rec);
  }
  return result;
}

export default function SettingsPage() {
  const [role, setRole] = useState("parent");
  const [lang, setLang] = useState("jp");
  const [parentCode, setParentCode] = useState("");
  const [records, setRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskIcon, setNewTaskIcon] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef(null);

  // イベント（複数持つ・子ども別・ホーム表示フラグ）
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [newCalEventTitle, setNewCalEventTitle] = useState("");
  const [newCalEventDate, setNewCalEventDate] = useState("");
  const [newCalEventMark, setNewCalEventMark] = useState("");
  const [newCalEventChild, setNewCalEventChild] = useState("all");

  // カレンダーでどのタスクを合計に使うか
  const [calendarTaskFilter, setCalendarTaskFilter] = useState(null);

  // 子ども管理
  const [children, setChildren] = useState([]);
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthday, setNewChildBirthday] = useState("");
  const [currentChildId, setCurrentChildId] = useState("");

  // カレンダーバッジ設定
  const [calendarBadges, setCalendarBadges] = useState(DEFAULT_BADGES);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem("pocopoco_role");
      if (savedRole === "parent" || savedRole === "child") {
        setRole(savedRole);
      }

      const savedLang = getLangFromStorage();
      setLang(savedLang);

      const savedCode = localStorage.getItem("pocopoco_parentCode");
      if (savedCode) setParentCode(savedCode);

      // history
      const rawHistory = localStorage.getItem("pocopoco_history");
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) setRecords(parsed);
      }

      // tasks
      const rawTasks = localStorage.getItem("pocopoco_tasks");
      if (rawTasks) {
        const parsedTasks = JSON.parse(rawTasks);
        const normalized = normalizeTasksForSettings(parsedTasks);
        setTasks(normalized);
        localStorage.setItem("pocopoco_tasks", JSON.stringify(normalized));
      } else {
        setTasks(DEFAULT_TASKS);
        localStorage.setItem("pocopoco_tasks", JSON.stringify(DEFAULT_TASKS));
      }

      // children
      const rawChildren = localStorage.getItem("pocopoco_children");
      if (rawChildren) {
        const arr = JSON.parse(rawChildren);
        if (Array.isArray(arr)) setChildren(arr);
      }
      const savedCurrentChild = localStorage.getItem(
        "pocopoco_current_child_id"
      );
      if (savedCurrentChild) setCurrentChildId(savedCurrentChild);

      // events（新方式）
      const rawCalEvents = localStorage.getItem("pocopoco_events");
      let loadedEvents = [];
      if (rawCalEvents) {
        const arr = JSON.parse(rawCalEvents);
        if (Array.isArray(arr)) loadedEvents = arr;
      }

      // 旧ぽこぽこ_event を吸収
      const rawSingle = localStorage.getItem("pocopoco_event");
      if (rawSingle) {
        try {
          const s = JSON.parse(rawSingle);
          if (s?.title || s?.date) {
            const exists = loadedEvents.some(
              (e) => e.title === s.title && e.date === s.date
            );
            if (!exists) {
              loadedEvents.push({
                id: "ev_from_single",
                title: s.title || "イベント",
                date: s.date || "",
                mark: "★",
                home: true,
                child_id: "all",
              });
            }
          }
        } catch {}
      }

      setCalendarEvents(loadedEvents);

      const rawCalTaskFilter = localStorage.getItem(
        "pocopoco_calendar_task_filter"
      );
      if (rawCalTaskFilter) {
        const arr = JSON.parse(rawCalTaskFilter);
        if (Array.isArray(arr)) setCalendarTaskFilter(arr);
      }

      // カレンダー設定（バッジ）
      const calSettings = loadCalendarSettingsFromStorage();
      setCalendarBadges(calSettings.badges);
    } catch (e) {
      console.error("settings load error", e);
    }
  }, []);

  // モード切替
  function switchToParent() {
    const savedCode = localStorage.getItem("pocopoco_parentCode") || "";
    if (!savedCode) {
      localStorage.setItem("pocopoco_role", "parent");
      setRole("parent");
      setStatusMsg("親モードになりました");
      return;
    }
    const input = window.prompt("おとなの4けたコードを入力してください");
    if (input === savedCode) {
      localStorage.setItem("pocopoco_role", "parent");
      localStorage.setItem("pocopoco_parentAuthed", "yes");
      setRole("parent");
      setStatusMsg("親モードになりました");
    } else if (input !== null) {
      alert("コードがちがいます");
    }
  }

  function switchToChild() {
    localStorage.setItem("pocopoco_role", "child");
    setRole("child");
    setStatusMsg("子モードになりました");
  }

  // 子ども管理
  function handleAddChild() {
    const name = newChildName.trim();
    if (!name) {
      setStatusMsg("なまえを入力してください");
      return;
    }
    if (children.length >= 5) {
      setStatusMsg("こどもは5人まで登録できます");
      return;
    }
    const id = "child_" + Date.now().toString(36);
    const newC = { id, name, birthday: newChildBirthday || "" };
    const next = [...children, newC];
    setChildren(next);
    localStorage.setItem("pocopoco_children", JSON.stringify(next));
    setNewChildName("");
    setNewChildBirthday("");
    setStatusMsg(`${name} を登録しました`);
  }

  function handleDeleteChild(id) {
    if (!window.confirm("このこどもを削除しますか？")) return;
    const next = children.filter((c) => c.id !== id);
    setChildren(next);
    localStorage.setItem("pocopoco_children", JSON.stringify(next));
    if (currentChildId === id) {
      localStorage.removeItem("pocopoco_current_child_id");
      setCurrentChildId("");
    }
    setStatusMsg("削除しました");
  }

  function handleSetCurrentChild(id) {
    setCurrentChildId(id);
    localStorage.setItem("pocopoco_current_child_id", id);
    const found = children.find((c) => c.id === id);
    setStatusMsg(`${found?.name || "この子"} を表示対象にしました`);
  }

  // 言語保存
  function handleSaveLang() {
    setLangToStorage(lang);
    setStatusMsg("表示言語を保存しました。");
  }

  function handleSaveParentCode() {
    if (!/^[0-9]{4}$/.test(parentCode)) {
      setStatusMsg("4けたの数字で入力してください。");
      return;
    }
    localStorage.setItem("pocopoco_parentCode", parentCode);
    setStatusMsg("秘密コードを保存しました。");
  }

  // タスク
  function persistTasks(nextTasks) {
    setTasks(nextTasks);
    localStorage.setItem("pocopoco_tasks", JSON.stringify(nextTasks));
  }

  function handleAddTask() {
    const label = newTaskLabel.trim();
    const icon = newTaskIcon.trim();
    if (!label || !icon) {
      setStatusMsg("アイコンとタスク名を入れてください");
      return;
    }
    const safeId =
      "task_" +
      label
        .toString()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w_ぁ-んァ-ン一-龥]/g, "") +
      "_" +
      Date.now().toString().slice(-5);
    const next = [...tasks, { id: safeId, label, icon }];
    persistTasks(next);
    setNewTaskLabel("");
    setNewTaskIcon("");
    setStatusMsg(`「${label}」を追加しました`);
  }

  function handleDeleteTask(idx) {
    if (!window.confirm("このタスクを消しますか？")) return;
    const next = tasks.filter((_, i) => i !== idx);
    persistTasks(next);
    setStatusMsg("タスクを削除しました");
  }

  // イベント追加（子ども別＋ホーム=falseで作る）
  function handleAddCalendarEvent() {
    if (!newCalEventDate) {
      setStatusMsg("日付を入れてください");
      return;
    }
    const ev = {
      id: "ev_" + Date.now().toString(36),
      title: newCalEventTitle || "イベント",
      date: newCalEventDate,
      mark: newCalEventMark || "EV",
      child_id: newCalEventChild === "all" ? "all" : newCalEventChild,
      home: false,
    };
    const next = [...calendarEvents, ev];
    setCalendarEvents(next);
    localStorage.setItem("pocopoco_events", JSON.stringify(next));
    setNewCalEventTitle("");
    setNewCalEventDate("");
    setNewCalEventMark("");
    setNewCalEventChild("all");
    setStatusMsg("カレンダーイベントを追加しました");
  }

  function handleDeleteCalendarEvent(id) {
    const next = calendarEvents.filter((ev) => ev.id !== id);
    setCalendarEvents(next);
    localStorage.setItem("pocopoco_events", JSON.stringify(next));
    setStatusMsg("イベントを削除しました");
  }

  // このイベントをホームに表示する
  function handleSetHomeEvent(id) {
    const target = calendarEvents.find((ev) => ev.id === id);
    if (!target) return;
    const childScope = target.child_id || "all";
    const next = calendarEvents.map((ev) => {
      if ((ev.child_id || "all") !== childScope) {
        return ev; // 違う子のイベントならそのまま
      }
      return ev.id === id ? { ...ev, home: true } : { ...ev, home: false };
    });
    setCalendarEvents(next);
    localStorage.setItem("pocopoco_events", JSON.stringify(next));
    setStatusMsg("ホームに表示するイベントを変更しました");
  }

  // カレンダーに反映するタスク
  function handleToggleCalendarTask(id) {
    if (!calendarTaskFilter) {
      const next = [id];
      setCalendarTaskFilter(next);
      localStorage.setItem(
        "pocopoco_calendar_task_filter",
        JSON.stringify(next)
      );
      setStatusMsg("カレンダーのタスクを設定しました");
      return;
    }
    const exists = calendarTaskFilter.includes(id);
    let next;
    if (exists) {
      next = calendarTaskFilter.filter((x) => x !== id);
    } else {
      next = [...calendarTaskFilter, id];
    }
    const finalVal = next.length === 0 ? null : next;
    setCalendarTaskFilter(finalVal);
    if (finalVal) {
      localStorage.setItem(
        "pocopoco_calendar_task_filter",
        JSON.stringify(finalVal)
      );
    } else {
      localStorage.removeItem("pocopoco_calendar_task_filter");
    }
    setStatusMsg("カレンダーのタスクしぼりこみを更新しました");
  }

  function isCalendarTaskChecked(id) {
    if (!calendarTaskFilter) return false;
    return calendarTaskFilter.includes(id);
  }

  function handleGoLogin() {
    localStorage.removeItem("pocopoco_role");
    localStorage.removeItem("pocopoco_parentAuthed");
    localStorage.removeItem("pocopoco_current_child_id");
    window.location.href = "/login";
  }

  // バッジ設定ハンドラ
  function handleChangeBadgeMin(id, value) {
    const num = Number(value);
    setCalendarBadges((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, minMinutes: isNaN(num) ? 0 : num } : b
      )
    );
  }

  function handleChangeBadgeIcon(id, value) {
    setCalendarBadges((prev) =>
      prev.map((b) => (b.id === id ? { ...b, icon: value } : b))
    );
  }

  function handleSaveCalendarBadges() {
    const cleaned = calendarBadges.map((b) => ({
      id: b.id,
      name: b.name,
      minMinutes: Math.max(0, Number(b.minMinutes) || 0),
      icon: b.icon || "",
    }));

    let firstDayOfWeek = "sun";
    try {
      const raw = localStorage.getItem(CALENDAR_SETTINGS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (
          data &&
          typeof data === "object" &&
          (data.firstDayOfWeek === "sun" || data.firstDayOfWeek === "mon")
        ) {
          firstDayOfWeek = data.firstDayOfWeek;
        }
      }
    } catch {}

    const toSave = { firstDayOfWeek, badges: cleaned };
    localStorage.setItem(CALENDAR_SETTINGS_KEY, JSON.stringify(toSave));
    setStatusMsg("カレンダーのバッジ設定を保存しました。");
  }

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "24px 16px 80px",
        maxWidth: "520px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
        {t("settingsTitle", lang)}
      </h1>

      {/* モード表示＋ログインにもどる */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "10px",
          marginBottom: "16px",
          background: role === "parent" ? "#f5ecff" : "#f0f9ff",
        }}
      >
        <div style={{ fontSize: "13px" }}>
          現在のモード：{" "}
          <strong>{role === "parent" ? "👤 親モード" : "🧒 子モード"}</strong>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          {role === "parent" ? (
            <button onClick={switchToChild} style={{ ...btnMini, flex: 1 }}>
              子モードにする
            </button>
          ) : (
            <button onClick={switchToParent} style={{ ...btnMini, flex: 1 }}>
              親モードにもどる
            </button>
          )}
          <button onClick={handleGoLogin} style={{ ...btnMini, flex: 1 }}>
            ログイン画面にもどる
          </button>
        </div>
      </section>

      {/* 表示言語＋大人の秘密コード（横並び） */}
      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* 言語 */}
          <div style={{ flex: 1, minWidth: "0" }}>
            <div style={sectionTitleStyle}>{t("settingsLang", lang)}</div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              disabled={role === "child"}
              style={inputStyle}
            >
              <option value="jp">にほんご（ふつう）</option>
              <option value="hiragana">にほんご（ひらがな）</option>
              <option value="en">English</option>
            </select>
            {role === "parent" && (
              <button style={purpleButtonStyle} onClick={handleSaveLang}>
                {t("settingsSave", lang)}
              </button>
            )}
          </div>

          {/* 親コード（親モードのときだけ） */}
          {role === "parent" && (
            <div style={{ flex: 1, minWidth: "0" }}>
              <div style={sectionTitleStyle}>{t("parentSecretCode", lang)}</div>
              <input
                type="password"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value)}
                style={{ ...inputStyle, letterSpacing: "0.3em" }}
                placeholder="1234"
              />
              <button
                style={gradientButtonStyle}
                onClick={handleSaveParentCode}
              >
                秘密コードを保存
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 子ども管理（親だけ） */}
      {role === "parent" && (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>{t("childrenSectionTitle", lang)}</h2>
          {children.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#777" }}>
              登録されていません
            </div>
          ) : (
            children.map((ch) => (
              <div
                key={ch.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  padding: "4px 0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{ch.name}</div>
                  {ch.birthday && (
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      🎂 {ch.birthday}
                    </div>
                  )}
                  {currentChildId === ch.id && (
                    <div style={chipStyle}>表示中</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => handleSetCurrentChild(ch.id)}
                    style={btnMini}
                  >
                    この子を表示
                  </button>
                  <button
                    onClick={() => handleDeleteChild(ch.id)}
                    style={{ ...btnMini, color: "#a00" }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: "10px" }}>
            <input
              type="text"
              placeholder="なまえ"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              style={inputStyle}
            />
            <input
              type="date"
              value={newChildBirthday}
              onChange={(e) => setNewChildBirthday(e.target.value)}
              style={inputStyle}
            />
            <button style={btnPurple} onClick={handleAddChild}>
              {t("addButton", lang)}
            </button>
          </div>
        </section>
      )}

      {/* タスク（カレンダー反映ボタン付き） */}
      {role === "parent" && (
        <section style={cardStyle}>
          <div style={sectionTitleStyle}>{t("tasksSectionTitle", lang)}</div>
          <div style={listBoxStyle}>
            {tasks.map((tTask, idx) => (
              <div key={tTask.id} style={listItemStyle}>
                <span>
                  {tTask.icon} {tTask.label}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => handleToggleCalendarTask(tTask.id)}
                    style={{
                      ...btnMini,
                      padding: "2px 6px",
                      background: isCalendarTaskChecked(tTask.id)
                        ? "#6a1b9a"
                        : "#fff",
                      color: isCalendarTaskChecked(tTask.id)
                        ? "#fff"
                        : "#333",
                      borderColor: isCalendarTaskChecked(tTask.id)
                        ? "#6a1b9a"
                        : "#ccc",
                    }}
                  >
                    カレンダーに反映
                  </button>
                  <button onClick={() => handleDeleteTask(idx)} style={btnMini}>
                    けす
                  </button>
                </div>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={newTaskIcon}
            onChange={(e) => setNewTaskIcon(e.target.value)}
            style={inputStyle}
            placeholder="🎻"
          />
          <input
            type="text"
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            style={inputStyle}
            placeholder="バイオリン"
          />
          <button style={purpleButtonStyle} onClick={handleAddTask}>
            タスクを追加
          </button>
        </section>
      )}

      {/* カレンダーのバッジ設定 */}
      {role === "parent" && (
        <section style={cardStyle}>
          <div style={sectionTitleStyle}>カレンダーのバッジ設定</div>
          <p style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}>
            ホーム画面のミニカレンダーと「カレンダー」画面で、
            1日の練習時間に応じて表示するバッジを決めます。
          </p>

          {calendarBadges.map((b) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                fontSize: "13px",
              }}
            >
              <div style={{ width: "110px" }}>{b.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="number"
                  min={0}
                  value={b.minMinutes}
                  onChange={(e) => handleChangeBadgeMin(b.id, e.target.value)}
                  style={{ ...inputStyle, width: "90px", marginBottom: 0 }}
                />
                <span style={{ fontSize: "12px" }}>分以上</span>
              </div>
              <input
                type="text"
                value={b.icon}
                onChange={(e) => handleChangeBadgeIcon(b.id, e.target.value)}
                style={{ ...inputStyle, width: "64px", marginBottom: 0 }}
              />
            </div>
          ))}

          <button
            style={{ ...purpleButtonStyle, marginTop: "10px" }}
            onClick={handleSaveCalendarBadges}
          >
            バッジ設定を保存
          </button>
        </section>
      )}

      {/* カレンダーに出すイベント（複数＋子ども別＋ホーム指定） */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>カレンダーに出すイベント（複数）</div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
          ここに追加したイベントはカレンダーに表示されます。子どもをえらんで登録できます。
          同じ子どもにつき1件だけ「ホームにも表示」をつけられます。
        </div>

        <div style={listBoxStyle}>
          {calendarEvents.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#777" }}>
              （まだありません）
            </div>
          ) : (
            calendarEvents.map((ev) => (
              <div key={ev.id} style={listItemStyle}>
                <div>
                  <div>
                    {ev.mark ? `${ev.mark} ` : ""}
                    {ev.title} {ev.date ? `(${ev.date})` : ""}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555" }}>
                    {ev.child_id && ev.child_id !== "all"
                      ? `👶 ${
                          children.find((c) => c.id === ev.child_id)?.name ||
                          "この子"
                        } のイベント`
                      : "👪 みんなのイベント"}
                  </div>
                  <label style={{ fontSize: "12px", color: "#444" }}>
                    <input
                      type="radio"
                      name={`home_event_${ev.child_id || "all"}`}
                      checked={ev.home === true}
                      onChange={() => handleSetHomeEvent(ev.id)}
                      style={{ marginRight: "4px" }}
                    />
                    この子のホームにも表示する
                  </label>
                </div>
                <button
                  onClick={() => handleDeleteCalendarEvent(ev.id)}
                  style={btnMini}
                >
                  けす
                </button>
              </div>
            ))
          )}
        </div>

        <input
          type="text"
          value={newCalEventTitle}
          onChange={(e) => setNewCalEventTitle(e.target.value)}
          style={inputStyle}
          placeholder="イベント名"
        />
        <input
          type="date"
          value={newCalEventDate}
          onChange={(e) => setNewCalEventDate(e.target.value)}
          style={inputStyle}
        />
        <select
          value={newCalEventChild}
          onChange={(e) => setNewCalEventChild(e.target.value)}
          style={inputStyle}
        >
          <option value="all">👪 全員に表示</option>
          {children.map((ch) => (
            <option key={ch.id} value={ch.id}>
              👶 {ch.name} に表示
            </option>
          ))}
        </select>
        <input
          type="text"
          value={newCalEventMark}
          onChange={(e) => setNewCalEventMark(e.target.value)}
          style={inputStyle}
          placeholder="🎵"
        />
        <button style={purpleButtonStyle} onClick={handleAddCalendarEvent}>
          追加
        </button>
      </section>

      {/* 法務・バージョン情報 */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>ℹ️ アプリ情報</div>
        <div style={{ fontSize: "13px", color: "#333", marginBottom: "4px" }}>
          <strong>pocoapoco</strong> v1.0.3（更新日：2025-11-04）
        </div>

        <div style={sectionTitleStyle}>📜 法律上の表示</div>
        <ul style={{ fontSize: "13px", lineHeight: 1.6, marginBottom: "12px" }}>
          <li>
            <a
              href="https://example.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6a1b9a", textDecoration: "underline" }}
            >
              利用規約
            </a>
          </li>
          <li>
            <a
              href="https://example.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6a1b9a", textDecoration: "underline" }}
            >
              プライバシーポリシー
            </a>
          </li>
          <li>
            <a
              href="https://example.com/law"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6a1b9a", textDecoration: "underline" }}
            >
              特定商取引法に基づく表記
            </a>
          </li>
        </ul>

        <div style={sectionTitleStyle}>💬 つかいかたガイド</div>
        <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
          くわしい使い方や最新情報は{" "}
          <a
            href="https://www.instagram.com/chocoonlabo"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#6a1b9a", fontWeight: "600" }}
          >
            Instagram @chocoonlabo
          </a>{" "}
          で発信しています。
        </p>
      </section>

      {statusMsg && <div style={statusBoxStyle}>{statusMsg}</div>}
    </main>
  );
}

/* ---- style ---- */
const inputStyle = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "13px",
  marginBottom: "6px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "16px",
  background: "#fff",
};

const sectionTitleStyle = {
  fontSize: "14px",
  fontWeight: 600,
  marginBottom: "8px",
};

const btnMini = {
  border: "1px solid #ccc",
  borderRadius: "6px",
  background: "#fff",
  fontSize: "12px",
  padding: "2px 8px",
  cursor: "pointer",
};

const btnPurple = {
  background: "#6a1b9a",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "6px 10px",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer",
};

const purpleButtonStyle = {
  width: "100%",
  backgroundColor: "#4a148c",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 12px",
  marginTop: "4px",
};

const pinkButtonStyle = {
  width: "100%",
  backgroundColor: "#d81b60",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 12px",
};

const gradientButtonStyle = {
  width: "100%",
  background: "linear-gradient(90deg, rgb(204,0,255), rgb(255,102,153))",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 12px",
};

const listBoxStyle = {
  border: "1px solid #eee",
  borderRadius: "8px",
  padding: "8px",
  marginBottom: "12px",
};

const listItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  padding: "4px 0",
};

const chipStyle = {
  display: "inline-block",
  fontSize: "11px",
  color: "#6a1b9a",
  background: "#e0ccff",
  borderRadius: "999px",
  padding: "1px 6px",
  marginTop: "2px",
};

const statusBoxStyle = {
  background: "#f5ecff",
  border: "1px solid #e0ccff",
  borderRadius: "8px",
  padding: "8px 12px",
  marginTop: "12px",
  fontSize: "13px",
};
