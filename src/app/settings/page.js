// src/app/settings/page.js
"use client";

import { useState, useEffect } from "react";
import { t, getLangFromStorage, setLangToStorage } from "@/app/lib/i18n";
import {
  LS_ROLE,
  LS_PARENT_CODE,
  LS_PARENT_AUTHED,
  LS_TASKS,
  LS_CHILDREN,
  LS_CURRENT_CHILD_ID,
  LS_EVENTS,
  LS_EVENT_LEGACY,
  LS_CALENDAR_TASK_FILTER,
  LS_CALENDAR_SETTINGS,
  MAX_CHILDREN,
  ROUTE_LOGIN,
} from "@/app/constants";

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
    const raw = localStorage.getItem(LS_CALENDAR_SETTINGS);
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

export default function SettingsPage() {
  const [role, setRole] = useState("parent");
  const [lang, setLang] = useState("jp");
  const [parentCode, setParentCode] = useState("");

  const [tasks, setTasks] = useState([]);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskIcon, setNewTaskIcon] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

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
      const savedRole = localStorage.getItem(LS_ROLE);
      if (savedRole === "parent" || savedRole === "child") {
        setRole(savedRole);
      }

      const savedLang = getLangFromStorage();
      setLang(savedLang);

      const savedCode = localStorage.getItem(LS_PARENT_CODE);
      if (savedCode) setParentCode(savedCode);

      // tasks
      const rawTasks = localStorage.getItem(LS_TASKS);
      if (rawTasks) {
        const parsedTasks = JSON.parse(rawTasks);
        const normalized = normalizeTasksForSettings(parsedTasks);
        setTasks(normalized);
        localStorage.setItem(LS_TASKS, JSON.stringify(normalized));
      } else {
        setTasks(DEFAULT_TASKS);
        localStorage.setItem(LS_TASKS, JSON.stringify(DEFAULT_TASKS));
      }

      // children
      const rawChildren = localStorage.getItem(LS_CHILDREN);
      if (rawChildren) {
        const arr = JSON.parse(rawChildren);
        if (Array.isArray(arr)) setChildren(arr);
      }
      const savedCurrentChild = localStorage.getItem(LS_CURRENT_CHILD_ID);
      if (savedCurrentChild) setCurrentChildId(savedCurrentChild);

      // events（新方式）
      const rawCalEvents = localStorage.getItem(LS_EVENTS);
      let loadedEvents = [];
      if (rawCalEvents) {
        const arr = JSON.parse(rawCalEvents);
        if (Array.isArray(arr)) loadedEvents = arr;
      }

      // 旧ぽこぽこ_event を吸収
      const rawSingle = localStorage.getItem(LS_EVENT_LEGACY);
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

      const rawCalTaskFilter = localStorage.getItem(LS_CALENDAR_TASK_FILTER);
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
    const savedCode = localStorage.getItem(LS_PARENT_CODE) || "";
    if (!savedCode) {
      localStorage.setItem(LS_ROLE, "parent");
      setRole("parent");
      setStatusMsg("親モードになりました");
      return;
    }
    const input = window.prompt(t("parentCodePrompt", lang));
    if (input === savedCode) {
      localStorage.setItem(LS_ROLE, "parent");
      localStorage.setItem(LS_PARENT_AUTHED, "yes");
      setRole("parent");
      setStatusMsg("親モードになりました");
    } else if (input !== null) {
      alert(t("parentCodeMismatch", lang));
    }
  }

  function switchToChild() {
    localStorage.setItem(LS_ROLE, "child");
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
    if (children.length >= MAX_CHILDREN) {
      setStatusMsg("こどもは5人まで登録できます");
      return;
    }
    const id = "child_" + Date.now().toString(36);
    const newC = { id, name, birthday: newChildBirthday || "" };
    const next = [...children, newC];
    setChildren(next);
    localStorage.setItem(LS_CHILDREN, JSON.stringify(next));
    setNewChildName("");
    setNewChildBirthday("");
    setStatusMsg(`${name} を登録しました`);
  }

  function handleDeleteChild(id) {
    if (!window.confirm("このこどもを削除しますか？")) return;
    const next = children.filter((c) => c.id !== id);
    setChildren(next);
    localStorage.setItem(LS_CHILDREN, JSON.stringify(next));
    if (currentChildId === id) {
      localStorage.removeItem(LS_CURRENT_CHILD_ID);
      setCurrentChildId("");
    }
    setStatusMsg("削除しました");
  }

  function handleSetCurrentChild(id) {
    setCurrentChildId(id);
    localStorage.setItem(LS_CURRENT_CHILD_ID, id);
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
    localStorage.setItem(LS_PARENT_CODE, parentCode);
    setStatusMsg("秘密コードを保存しました。");
  }

  // タスク
  function persistTasks(nextTasks) {
    setTasks(nextTasks);
    localStorage.setItem(LS_TASKS, JSON.stringify(nextTasks));
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
    localStorage.setItem(LS_EVENTS, JSON.stringify(next));
    setNewCalEventTitle("");
    setNewCalEventDate("");
    setNewCalEventMark("");
    setNewCalEventChild("all");
    setStatusMsg("カレンダーイベントを追加しました");
  }

  function handleDeleteCalendarEvent(id) {
    const next = calendarEvents.filter((ev) => ev.id !== id);
    setCalendarEvents(next);
    localStorage.setItem(LS_EVENTS, JSON.stringify(next));
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
    localStorage.setItem(LS_EVENTS, JSON.stringify(next));
    setStatusMsg("ホームに表示するイベントを変更しました");
  }

  // カレンダーに反映するタスク
  function handleToggleCalendarTask(id) {
    if (!calendarTaskFilter) {
      const next = [id];
      setCalendarTaskFilter(next);
      localStorage.setItem(LS_CALENDAR_TASK_FILTER, JSON.stringify(next));
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
        LS_CALENDAR_TASK_FILTER,
        JSON.stringify(finalVal)
      );
    } else {
      localStorage.removeItem(LS_CALENDAR_TASK_FILTER);
    }
    setStatusMsg("カレンダーのタスクしぼりこみを更新しました");
  }

  function isCalendarTaskChecked(id) {
    if (!calendarTaskFilter) return false;
    return calendarTaskFilter.includes(id);
  }

  function handleGoLogin() {
    localStorage.removeItem(LS_ROLE);
    localStorage.removeItem(LS_PARENT_AUTHED);
    localStorage.removeItem(LS_CURRENT_CHILD_ID);
    window.location.href = ROUTE_LOGIN;
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
      const raw = localStorage.getItem(LS_CALENDAR_SETTINGS);
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
    localStorage.setItem(LS_CALENDAR_SETTINGS, JSON.stringify(toSave));
    setStatusMsg(t("badgeSettingsSavedMessage", lang));
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
          {t("settingsCurrentModeLabel", lang)}：{" "}
          <strong>
            {role === "parent"
              ? `👤 ${t("settingsParentModeLabel", lang)}`
              : `🧒 ${t("settingsChildModeLabel", lang)}`}
          </strong>
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
              {t("settingsSwitchToChild", lang)}
            </button>
          ) : (
            <button onClick={switchToParent} style={{ ...btnMini, flex: 1 }}>
              {t("settingsSwitchToParent", lang)}
            </button>
          )}
          <button onClick={handleGoLogin} style={{ ...btnMini, flex: 1 }}>
            {t("settingsReturnToLogin", lang)}
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
              <div style={sectionTitleStyle}>
                {t("parentSecretCode", lang)}
              </div>
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
                {t("saveSecretCode", lang)}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 子ども管理（親だけ） */}
      {role === "parent" && (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            {t("childrenSectionTitle", lang)}
          </h2>
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
                    {t("showThisChild", lang)}
                  </button>
                  <button
                    onClick={() => handleDeleteChild(ch.id)}
                    style={{ ...btnMini, color: "#a00" }}
                  >
                    {t("deleteLabel", lang)}
                  </button>
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: "10px" }}>
            <input
              type="text"
              placeholder={t("nameLabel", lang)}
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
          <div style={sectionTitleStyle}>
            {t("tasksSectionTitle", lang)}
          </div>
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
                    {t("calendarTaskReflect", lang)}
                  </button>
                  <button onClick={() => handleDeleteTask(idx)} style={btnMini}>
                    {t("deleteTaskLabel", lang)}
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
            placeholder={t("violinLabel", lang)}
          />
          <button style={purpleButtonStyle} onClick={handleAddTask}>
            {t("addTaskButton", lang)}
          </button>
        </section>
      )}

      {/* カレンダーのバッジ設定 */}
      {role === "parent" && (
        <section style={cardStyle}>
          <div style={sectionTitleStyle}>
            {t("badgeSettingsTitle", lang)}
          </div>
          <p style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}>
            {t("badgeSettingsDescription", lang)}
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <input
                  type="number"
                  min={0}
                  value={b.minMinutes}
                  onChange={(e) =>
                    handleChangeBadgeMin(b.id, e.target.value)
                  }
                  style={{ ...inputStyle, width: "90px", marginBottom: 0 }}
                />
                <span style={{ fontSize: "12px" }}>
                  {t("minutesOrMore", lang)}
                </span>
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
            {t("badgeSettingsSaveButton", lang)}
          </button>
        </section>
      )}

      {/* カレンダーに出すイベント（複数＋子ども別＋ホーム指定） */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>
          {t("calendarEventsTitle", lang)}
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
          {t("calendarEventsDescription", lang)}
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
                          t("showThisChild", lang)
                        }`
                      : `👪 ${t("everyoneEventsTitle", lang)}`}
                  </div>
                  <label style={{ fontSize: "12px", color: "#444" }}>
                    <input
                      type="radio"
                      name={`home_event_${ev.child_id || "all"}`}
                      checked={ev.home === true}
                      onChange={() => handleSetHomeEvent(ev.id)}
                      style={{ marginRight: "4px" }}
                    />
                    {t("displayOnChildHome", lang)}
                  </label>
                </div>
                <button
                  onClick={() => handleDeleteCalendarEvent(ev.id)}
                  style={btnMini}
                >
                  {t("deleteLabel", lang)}
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
          placeholder={t("eventNameLabel", lang)}
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
          <option value="all">👪 {t("visibleToEveryone", lang)}</option>
          {children.map((ch) => (
            <option key={ch.id} value={ch.id}>
              👶 {ch.name} {t("shownInLabel", lang)}
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
          {t("addButton", lang)}
        </button>
      </section>

      {/* 法務・バージョン情報 */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>
          ℹ️ {t("appInfoTitle", lang)}
        </div>
        <div
          style={{ fontSize: "13px", color: "#333", marginBottom: "4px" }}
        >
          <strong>pocoapoco</strong> v1.0.3（
          {t("appUpdateDateLabel", lang)}：2025-11-04）
        </div>

        <div style={sectionTitleStyle}>
          📜 {t("appLegalNotice", lang)}
        </div>
        <ul
          style={{ fontSize: "13px", lineHeight: 1.6, marginBottom: "12px" }}
        >
          <li>
            <a
              href="https://example.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6a1b9a", textDecoration: "underline" }}
            >
              {t("appTermsOfService", lang)}
            </a>
          </li>
          <li>
            <a
              href="https://example.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6a1b9a", textDecoration: "underline" }}
            >
              {t("appPrivacyPolicy", lang)}
            </a>
          </li>
          <li>
            <a
              href="https://example.com/law"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6a1b9a", textDecoration: "underline" }}
            >
              {t("appSctaDescription", lang)}
            </a>
          </li>
        </ul>

        <div style={sectionTitleStyle}>
          💬 {t("appUsageGuide", lang)}
        </div>
        <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
          {t("appInstagramDescription", lang)}
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
