"use client";

import { useState, useEffect, useRef } from "react";

// ---------- 定数・初期タスクセット ----------
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

// id がない古いタスクを読んだときに補う
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

// CSVエクスポート
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
    const task = r.task || "";

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

// CSV読み込み
function parseCSV(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSVの行がたりません。");
  }

  const header = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));

  if (
    header[0] !== "date" ||
    header[1] !== "task" ||
    header[2] !== "minutes" ||
    header[3] !== "count" ||
    header[4] !== "memo"
  ) {
    throw new Error("CSVのヘッダーが正しくありません。");
  }

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCells = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const cells = rawCells.map((c) => c.replace(/^"|"$/g, ""));

    const [dateStr, task, minutesStr, countStr, memo] = cells;

    const startedDate = new Date(dateStr);
    if (isNaN(startedDate.getTime())) {
      console.warn("日付がパースできません:", dateStr);
      continue;
    }

    const seconds = parseInt(minutesStr, 10) * 60 || 0;
    const count = parseInt(countStr, 10) || 0;

    records.push({
      task: task || "",
      seconds,
      count,
      memo: memo || "",
      startedAt: startedDate.toISOString(),
    });
  }

  return records;
}

// 重複を避けながら履歴をマージ
function mergeHistory(oldArr, newArr) {
  const result = [...oldArr];

  for (const rec of newArr) {
    const exists = result.some(
      (r) =>
        r.startedAt === rec.startedAt &&
        r.task === rec.task &&
        (r.seconds || 0) === (rec.seconds || 0) &&
        (r.count || 0) === (rec.count || 0)
    );
    if (!exists) {
      result.push(rec);
    }
  }

  return result;
}

export default function SettingsPage() {
  // 表示言語
  const [lang, setLang] = useState("jp");
  // 親コード
  const [parentCode, setParentCode] = useState("");
  // 旧仕様の「1件だけイベント」（ホーム用）
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  // 誕生日
  const [birthday, setBirthday] = useState("");
  // 履歴データ
  const [records, setRecords] = useState([]);
  // タスク一覧
  const [tasks, setTasks] = useState([]);
  // 新規タスク入力
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskIcon, setNewTaskIcon] = useState("");
  // UIメッセージ
  const [statusMsg, setStatusMsg] = useState("");
  // CSV用
  const fileInputRef = useRef(null);

  // ★ 新規：カレンダー用複数イベント
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [newCalEventTitle, setNewCalEventTitle] = useState("");
  const [newCalEventDate, setNewCalEventDate] = useState("");
  const [newCalEventMark, setNewCalEventMark] = useState("");

  // ★ 新規：カレンダーに反映するタスクID
  const [calendarTaskFilter, setCalendarTaskFilter] = useState(null);

  useEffect(() => {
    try {
      // 言語
      const savedLang = window.localStorage.getItem("pocopoco_lang");
      if (
        savedLang === "hiragana" ||
        savedLang === "jp" ||
        savedLang === "en"
      ) {
        setLang(savedLang);
      }

      // 親コード
      const savedCode = window.localStorage.getItem("pocopoco_parentCode");
      if (savedCode) {
        setParentCode(savedCode);
      }

      // 旧：1件だけのイベント（ホーム用）
      const rawEvent = window.localStorage.getItem("pocopoco_event");
      if (rawEvent) {
        try {
          const evt = JSON.parse(rawEvent);
          if (evt && typeof evt === "object") {
            setEventTitle(evt.title || "");
            setEventDate(evt.date || "");
          }
        } catch (e) {
          console.warn("イベント情報のJSON parseに失敗しました", e);
        }
      }

      // 誕生日
      const savedBirthday = window.localStorage.getItem("pocopoco_birthday");
      if (savedBirthday) {
        setBirthday(savedBirthday);
      }

      // 履歴
      const rawHistory = window.localStorage.getItem("pocopoco_history");
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
        }
      }

      // タスク一覧
      const rawTasks = window.localStorage.getItem("pocopoco_tasks");
      if (rawTasks) {
        try {
          const parsedTasks = JSON.parse(rawTasks);
          if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
            const normalized = normalizeTasksForSettings(parsedTasks);
            setTasks(normalized);
            window.localStorage.setItem(
              "pocopoco_tasks",
              JSON.stringify(normalized)
            );
          } else {
            setTasks(DEFAULT_TASKS);
            window.localStorage.setItem(
              "pocopoco_tasks",
              JSON.stringify(DEFAULT_TASKS)
            );
          }
        } catch (e) {
          console.warn("pocopoco_tasks parse失敗。初期値を採用します", e);
          setTasks(DEFAULT_TASKS);
          window.localStorage.setItem(
            "pocopoco_tasks",
            JSON.stringify(DEFAULT_TASKS)
          );
        }
      } else {
        setTasks(DEFAULT_TASKS);
        window.localStorage.setItem(
          "pocopoco_tasks",
          JSON.stringify(DEFAULT_TASKS)
        );
      }

      // ★ 複数イベント（カレンダー用）
      const rawCalEvents = window.localStorage.getItem("pocopoco_events");
      if (rawCalEvents) {
        try {
          const arr = JSON.parse(rawCalEvents);
          if (Array.isArray(arr)) {
            setCalendarEvents(arr);
          }
        } catch (e) {
          console.warn("pocopoco_events parse失敗", e);
        }
      }

      // ★ カレンダーに反映するタスクID
      const rawCalTaskFilter = window.localStorage.getItem(
        "pocopoco_calendar_task_filter"
      );
      if (rawCalTaskFilter) {
        try {
          const arr = JSON.parse(rawCalTaskFilter);
          if (Array.isArray(arr)) {
            setCalendarTaskFilter(arr);
          }
        } catch (e) {
          console.warn("calendar task filter parse失敗", e);
        }
      }
    } catch (e) {
      console.error("settings load error", e);
    }
  }, []);

  // -------- 保存系ハンドラ --------

  function handleSaveLang() {
    window.localStorage.setItem("pocopoco_lang", lang);
    setStatusMsg("ひょうじげんごを保存しました。");
  }

  function handleSaveParentCode() {
    if (!/^[0-9]{4}$/.test(parentCode)) {
      setStatusMsg("4けたの数字で入力してください。");
      return;
    }
    window.localStorage.setItem("pocopoco_parentCode", parentCode);
    setStatusMsg("ひみつコードを保存しました。");
  }

  // 旧：1件だけのイベントを保存（ホーム用）
  function handleSaveEvent() {
    const data = {
      title: eventTitle,
      date: eventDate,
    };
    window.localStorage.setItem("pocopoco_event", JSON.stringify(data));
    setStatusMsg("イベントを保存しました。");
  }

  function handleSaveBirthday() {
    window.localStorage.setItem("pocopoco_birthday", birthday);
    setStatusMsg("おたんじょうびを保存しました。");
  }

  // タスクをlocalStorageに反映
  function persistTasks(nextTasks) {
    setTasks(nextTasks);
    window.localStorage.setItem("pocopoco_tasks", JSON.stringify(nextTasks));
  }

  function handleAddTask() {
    const label = newTaskLabel.trim();
    const icon = newTaskIcon.trim();

    if (!label) {
      setStatusMsg("タスクめい をいれてください。");
      return;
    }
    if (!icon) {
      setStatusMsg("アイコン（えもじなど）をいれてください。");
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
    setStatusMsg(`「${label}」を ついかしました。`);
  }

  function handleDeleteTask(idx) {
    const ok = window.confirm(
      "このタスクをリストから けしますか？\n（これまでのきろくは のこります）"
    );
    if (!ok) return;

    const next = tasks.filter((_, i) => i !== idx);
    persistTasks(next);

    setStatusMsg("タスクを けしました。");
  }

  // -------- CSV入出力 --------

  function handleExportCSV() {
    try {
      exportToCSV(records);
      setStatusMsg("CSVをダウンロードしました。");
    } catch (e) {
      console.error("export error", e);
      setStatusMsg("エクスポートでエラーが発生しました。");
    }
  }

  function handleImportClick() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const text = loadEvent.target.result;
        const importedRecords = parseCSV(text);

        const merged = mergeHistory(records, importedRecords);

        window.localStorage.setItem(
          "pocopoco_history",
          JSON.stringify(merged)
        );

        setRecords(merged);

        setStatusMsg(`CSVから${importedRecords.length}件インポートしました。`);
      } catch (err) {
        console.error("import error", err);
        setStatusMsg(
          "CSVのよみこみに しっぱいしました。 けいしきを かくにんしてください。"
        );
      }
    };
    reader.readAsText(file, "utf-8");
  }

  // -------- 新規：カレンダーイベントの追加・削除 --------
  function handleAddCalendarEvent() {
    if (!newCalEventDate) {
      setStatusMsg("カレンダーのイベントは「日付」がひつようです。");
      return;
    }
    const ev = {
      id: "ev_" + Date.now().toString(36),
      title: newCalEventTitle || "イベント",
      date: newCalEventDate,
      mark: newCalEventMark || "EV",
    };
    const next = [...calendarEvents, ev];
    setCalendarEvents(next);
    window.localStorage.setItem("pocopoco_events", JSON.stringify(next));
    setNewCalEventTitle("");
    setNewCalEventDate("");
    setNewCalEventMark("");
    setStatusMsg("カレンダー用イベントを追加しました。");
  }

  function handleDeleteCalendarEvent(id) {
    const next = calendarEvents.filter((ev) => ev.id !== id);
    setCalendarEvents(next);
    window.localStorage.setItem("pocopoco_events", JSON.stringify(next));
    setStatusMsg("イベントを削除しました。");
  }

  // -------- 新規：カレンダー集計タスクの更新 --------
  function handleToggleCalendarTask(id) {
    // 今 null のときは全部対象なので、1つチェックされたらそこから配列にする
    if (!calendarTaskFilter) {
      const next = [id];
      setCalendarTaskFilter(next);
      window.localStorage.setItem(
        "pocopoco_calendar_task_filter",
        JSON.stringify(next)
      );
      setStatusMsg("カレンダーに表示するタスクを設定しました。");
      return;
    }

    const exists = calendarTaskFilter.includes(id);
    let next;
    if (exists) {
      next = calendarTaskFilter.filter((x) => x !== id);
    } else {
      next = [...calendarTaskFilter, id];
    }
    // 0件になったら null に戻して「全部集計」にしてもいい
    const finalVal = next.length === 0 ? null : next;
    setCalendarTaskFilter(finalVal);
    if (finalVal) {
      window.localStorage.setItem(
        "pocopoco_calendar_task_filter",
        JSON.stringify(finalVal)
      );
      setStatusMsg("カレンダーのタスクしぼりこみを更新しました。");
    } else {
      window.localStorage.removeItem("pocopoco_calendar_task_filter");
      setStatusMsg("カレンダーはすべてのタスクを集計します。");
    }
  }

  // UIでチェックされてるかどうか
  function isCalendarTaskChecked(id) {
    if (!calendarTaskFilter) return false; // nullなら「全部」扱いで未チェック表示にする
    return calendarTaskFilter.includes(id);
  }

  // -------------------------------------------
  // レンダリング
  // -------------------------------------------

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "24px 16px 80px",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "20px",
          fontWeight: "600",
          marginBottom: "8px",
          color: "#4a148c",
        }}
      >
        設定
      </h1>

      <p
        style={{
          fontSize: "12px",
          lineHeight: 1.4,
          color: "#666",
          marginBottom: "16px",
        }}
      >
        おうちのひと が つかう せっていです。こどもは さわらないでね。
      </p>

      {/* 表示言語 */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>ひょうじげんご / Language</div>

        <div style={sectionDescStyle}>
          こどもには ひらがな、
          おとなには ふつうの にほんご、
          きょうし・先生には えいご など えらべます。
        </div>

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={inputStyle}
        >
          <option value="hiragana">にほんご（ひらがな）</option>
          <option value="jp">にほんご（ふつう）</option>
          <option value="en">English</option>
        </select>

        <button style={purpleButtonStyle} onClick={handleSaveLang}>
          表示言語を保存
        </button>
      </section>

      {/* 親コード */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>おとなの ひみつコード（4けた）</div>

        <div style={sectionDescStyle}>
          このコードを しっているひと だけが
          「れんしゅうのきろく」を へんしゅう・さくじょ できます。
        </div>

        <input
          type="password"
          value={parentCode}
          onChange={(e) => setParentCode(e.target.value)}
          placeholder="1234"
          style={{
            ...inputStyle,
            fontSize: "16px",
            letterSpacing: "0.3em",
            marginBottom: "12px",
          }}
        />

        <button style={gradientButtonStyle} onClick={handleSaveParentCode}>
          ひみつコードを保存
        </button>
      </section>

      {/* タスクのせってい */}
      <section style={cardStyle}>
        <div style={sectionHeaderRowStyle}>
          <div style={sectionTitleStyle}>タスクのせってい</div>
          <div style={adultBadgeStyle}>おとな専用</div>
        </div>

        <div style={sectionDescStyle}>
          ホームに ならぶ ボタンを つくります。
          えもじ と なまえ を いれて ついかできます。
          いらないタスクは「けす」でひょうじから はずせます。
          （きろくデータは のこります）
        </div>

        {/* いま登録されているタスク一覧 */}
        <div
          style={{
            marginBottom: "16px",
            border: "1px solid #eee",
            borderRadius: "8px",
            padding: "8px 12px",
            maxHeight: "160px",
            overflowY: "auto",
            backgroundColor: "#fafafa",
          }}
        >
          {tasks.length === 0 ? (
            <div
              style={{
                fontSize: "12px",
                color: "#888",
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              （タスクは まだ ありません）
            </div>
          ) : (
            tasks.map((task, idx) => (
              <div
                key={task.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  padding: "6px 0",
                  borderBottom:
                    idx === tasks.length - 1
                      ? "none"
                      : "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    lineHeight: 1.3,
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{task.icon}</span>
                  <span style={{ fontWeight: 600, color: "#333" }}>
                    {task.label}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteTask(idx)}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    lineHeight: "1.2",
                    color: "#a00",
                    minWidth: "48px",
                  }}
                >
                  けす
                </button>
              </div>
            ))
          )}
        </div>

        {/* タスク追加フォーム */}
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          タスクをついか
        </div>

        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: "600",
            marginBottom: "4px",
          }}
        >
          アイコン（えもじ）
        </label>
        <input
          type="text"
          value={newTaskIcon}
          onChange={(e) => setNewTaskIcon(e.target.value)}
          placeholder="🎻 や 📖 など"
          style={{ ...inputStyle, marginBottom: "12px" }}
        />

        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: "600",
            marginBottom: "4px",
          }}
        >
          タスクめい
        </label>
        <input
          type="text"
          value={newTaskLabel}
          onChange={(e) => setNewTaskLabel(e.target.value)}
          placeholder="バイオリン / さんすう / えいご など"
          style={{ ...inputStyle, marginBottom: "12px" }}
        />

        <button style={purpleButtonStyle} onClick={handleAddTask}>
          タスクをついか
        </button>
      </section>

      {/* 旧：ホームに出す1件だけのイベント */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>イベント / 本番の日（ホーム用に1つ）</div>

        <div style={sectionDescStyle}>
          ホームに「◯◯まで あと◯日」と出す用の いちばん大事な日です。
        </div>

        <label style={labelStyle}>イベント名</label>
        <input
          type="text"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          placeholder="はっぴょうかい / コンクール本選 など"
          style={{ ...inputStyle, marginBottom: "12px" }}
        />

        <label style={labelStyle}>日付</label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          style={{ ...inputStyle, marginBottom: "12px" }}
        />

        <button style={deepPurpleButtonStyle} onClick={handleSaveEvent}>
          イベントを保存
        </button>
      </section>

      {/* おたんじょうび */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>おたんじょうび</div>

        <div style={sectionDescStyle}>
          この日に アプリをひらくと
          「🎂おたんじょうびおめでとう！」メッセージを
          こどもむけに ひょうじ します。
        </div>

        <label style={labelStyle}>日付</label>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          style={{ ...inputStyle, marginBottom: "12px" }}
        />

        <button style={pinkButtonStyle} onClick={handleSaveBirthday}>
          おたんじょうびを保存
        </button>
      </section>

      {/* データのバックアップ / ひっこし */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          backgroundColor: "#f9f9ff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
        }}
      >
        <div style={sectionHeaderRowStyle}>
          <div style={sectionTitleStyle}>データのバックアップ / ひっこし</div>
          <div style={adultBadgeStyle}>おとな専用</div>
        </div>

        <div style={sectionDescStyle}>
          きろくを ほかの きかい に うつす とき や、
          まいにち の バックアップようです。
        </div>

        <button style={purpleButtonStyle} onClick={handleExportCSV}>
          📤 きろくをCSVでダウンロード
        </button>

        <button style={greenButtonStyle} onClick={handleImportClick}>
          📥 CSVから よみこむ
        </button>

        <div
          style={{
            fontSize: "11px",
            color: "#444",
            lineHeight: 1.4,
            marginTop: "8px",
          }}
        >
          ※ まえにダウンロードした pocopoco_history_◯◯◯.csv を
          えらんでください。
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
      </section>

      {/* ★ 新規：カレンダーに表示するイベント一覧 */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>
          カレンダーに出すイベント（いくつでも）
        </div>
        <div style={sectionDescStyle}>
          カレンダー画面で ひづけのマスに ひょうじするイベントです。
          タイトル・日付・マーク（🎻やEVなど）を入れてください。
        </div>

        {/* 既存イベント一覧 */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: "8px",
            padding: "8px 10px",
            marginBottom: "12px",
            backgroundColor: "#fafafa",
            maxHeight: "140px",
            overflowY: "auto",
          }}
        >
          {calendarEvents.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#777" }}>
              （カレンダーイベントは まだありません）
            </div>
          ) : (
            calendarEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ fontSize: "12px", lineHeight: 1.3 }}>
                  <div>
                    <strong>{ev.mark || "📌"}</strong> {ev.title || "(タイトル)"}
                  </div>
                  <div style={{ color: "#666" }}>{ev.date}</div>
                </div>
                <button
                  onClick={() => handleDeleteCalendarEvent(ev.id)}
                  style={{
                    border: "1px solid #ccc",
                    background: "#fff",
                    borderRadius: "6px",
                    fontSize: "11px",
                    padding: "4px 8px",
                    color: "#a00",
                  }}
                >
                  けす
                </button>
              </div>
            ))
          )}
        </div>

        {/* 追加フォーム */}
        <label style={labelStyle}>イベント名</label>
        <input
          type="text"
          value={newCalEventTitle}
          onChange={(e) => setNewCalEventTitle(e.target.value)}
          placeholder="レッスン / はっぴょうかい など"
          style={{ ...inputStyle, marginBottom: "8px" }}
        />

        <label style={labelStyle}>日付</label>
        <input
          type="date"
          value={newCalEventDate}
          onChange={(e) => setNewCalEventDate(e.target.value)}
          style={{ ...inputStyle, marginBottom: "8px" }}
        />

        <label style={labelStyle}>マーク（🎻 / EV / L など）</label>
        <input
          type="text"
          value={newCalEventMark}
          onChange={(e) => setNewCalEventMark(e.target.value)}
          placeholder="🎻"
          style={{ ...inputStyle, marginBottom: "8px" }}
        />

        <button style={purpleButtonStyle} onClick={handleAddCalendarEvent}>
          カレンダーイベントを追加
        </button>
      </section>

      {/* ★ 新規：カレンダーに反映させるタスク */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>カレンダーに反映するタスク</div>
        <div style={sectionDescStyle}>
          カレンダーの「その日の合計時間」にふくめるタスクを
          えらびます。何もえらばない場合はすべてのタスクを合計します。
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          {tasks.map((t) => (
            <label
              key={t.id}
              style={{ display: "flex", gap: "6px", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={isCalendarTaskChecked(t.id)}
                onChange={() => handleToggleCalendarTask(t.id)}
              />
              <span>
                {t.icon} {t.label}
              </span>
            </label>
          ))}
        </div>

        <div style={{ fontSize: "11px", color: "#777" }}>
          ※ チェックが1つもないときは「全部合計」になります。
        </div>
      </section>

      {/* ステータス表示 */}
      {statusMsg && (
        <div
          style={{
            textAlign: "center",
            fontSize: "13px",
            lineHeight: 1.4,
            color: "#4a148c",
            backgroundColor: "#f5ecff",
            border: "1px solid #e0ccff",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        >
          {statusMsg}
        </div>
      )}

      {/* 戻る */}
      <div style={{ textAlign: "center", marginTop: "24px" }}>
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            background: "none",
            border: "none",
            color: "#666",
            fontSize: "14px",
            textDecoration: "underline",
            padding: "8px 12px",
          }}
        >
          ← ホームにもどる
        </button>
      </div>
    </main>
  );
}

// -------------------------------------------
// スタイル共通
// -------------------------------------------

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "24px",
  backgroundColor: "#fff",
  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
};

const sectionTitleStyle = {
  fontSize: "15px",
  fontWeight: "600",
  marginBottom: "8px",
};

const sectionHeaderRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "6px",
  marginBottom: "8px",
};

const sectionDescStyle = {
  fontSize: "12px",
  color: "#888",
  lineHeight: 1.4,
  marginBottom: "12px",
  whiteSpace: "pre-wrap",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "4px",
};

const inputStyle = {
  width: "100%",
  border: "1px solid #bbb",
  borderRadius: "8px",
  fontSize: "14px",
  padding: "8px 10px",
  backgroundColor: "#fff",
};

const adultBadgeStyle = {
  backgroundColor: "#fff8e1",
  color: "#a15a00",
  fontSize: "11px",
  fontWeight: "600",
  border: "1px solid #ffe0a1",
  borderRadius: "6px",
  padding: "2px 6px",
  lineHeight: 1.3,
};

const purpleButtonStyle = {
  width: "100%",
  backgroundColor: "#4a148c",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  marginBottom: "12px",
  textAlign: "center",
};

const deepPurpleButtonStyle = {
  width: "100%",
  backgroundColor: "#6a1b9a",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
};

const pinkButtonStyle = {
  width: "100%",
  backgroundColor: "#d81b60",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
};

const gradientButtonStyle = {
  width: "100%",
  background:
    "linear-gradient(90deg, rgb(204,0,255), rgb(255,102,153))",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
};

const greenButtonStyle = {
  width: "100%",
  backgroundColor: "#00695c",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  textAlign: "center",
};
