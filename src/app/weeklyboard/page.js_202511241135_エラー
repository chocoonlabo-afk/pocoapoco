// src/app/weeklyboard/page.js
"use client";
export const dynamic = 'force-dynamic';
export const fetchCache = "default-no-store";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  LS_CHILDREN,
  LS_CURRENT_CHILD_ID,
  LS_ROLE,
  LS_WEEKLY_TIMETABLE,
} from "../constants";
import { t, getLangFromStorage } from "../lib/i18n";

const STORAGE_KEY = LS_WEEKLY_TIMETABLE;
const CHILDREN_KEY = LS_CHILDREN;
const CURRENT_CHILD_KEY = LS_CURRENT_CHILD_ID;
const ROLE_KEY = LS_ROLE;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABEL_DICT_KEYS = {
  sun: "weeklySun",
  mon: "weeklyMon",
  tue: "weeklyTue",
  wed: "weeklyWed",
  thu: "weeklyThu",
  fri: "weeklyFri",
  sat: "weeklySat",
};

const PERIOD_COUNT = 15;

// からの時間割（7日×15コマ）
function createEmptyCells() {
  const cells = {};
  DAY_KEYS.forEach((d) => {
    cells[d] = Array(PERIOD_COUNT).fill("");
  });
  return cells;
}

// localStorage から読み込み
function loadTimetablesFromStorage() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {
    console.error("Failed to parse timetable from storage", e);
  }
  return {};
}

// 曜日並び
function getDayOrder(weekStart) {
  if (weekStart === "sun") {
    return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  }
  // 月曜はじまり（デフォルト）
  return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
}

// CSV 1セル用
const escapeCSV = (value) => {
  const v = value ?? "";
  return `"${v.replace(/"/g, '""')}"`;
};

const parseCSVLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((v) => v.trim());
};

const getDayLabel = (dayKey, lang) => {
  const dictKey = DAY_LABEL_DICT_KEYS[dayKey];
  if (!dictKey) return dayKey;
  return t(dictKey, lang);
};

export default function WeeklyBoardPage() {
  const searchParams = useSearchParams();

  const [children, setChildren] = useState([]);
  const [currentChildId, setCurrentChildId] = useState("");
  const [role, setRole] = useState("parent"); // parent / child
  const [lang, setLang] = useState("jp");

  const queryChildId = searchParams.get("childId");
  const [selectedChildId, setSelectedChildId] = useState("");

  // childId => { weekStart: 'mon' | 'sun', cells: { [dayKey]: string[] } }
  const [timetablesByChild, setTimetablesByChild] = useState({});

  const [uiWeekStart, setUiWeekStart] = useState("mon");

  // 子ども情報・ロール・言語
  useEffect(() => {
    try {
      const rawChildren = localStorage.getItem(CHILDREN_KEY);
      if (rawChildren) {
        const arr = JSON.parse(rawChildren);
        if (Array.isArray(arr)) setChildren(arr);
      }

      const savedCurrentChild = localStorage.getItem(CURRENT_CHILD_KEY);
      if (savedCurrentChild) {
        setCurrentChildId(savedCurrentChild);
      }

      const savedRole = localStorage.getItem(ROLE_KEY);
      if (savedRole === "parent" || savedRole === "child") {
        setRole(savedRole);
      }

      const storedLang = getLangFromStorage();
      setLang(storedLang);
    } catch (e) {
      console.error("weeklyboard: children/role/lang load error", e);
    }
  }, []);

  // 時間割読み込み
  useEffect(() => {
    const data = loadTimetablesFromStorage();
    setTimetablesByChild(data);

    if (queryChildId && data[queryChildId]) {
      const childCfg = data[queryChildId];
      if (
        childCfg &&
        (childCfg.weekStart === "mon" || childCfg.weekStart === "sun")
      ) {
        setUiWeekStart(childCfg.weekStart);
      }
    }
  }, [queryChildId]);

  // 表示する子どもを決定
  useEffect(() => {
    if (queryChildId) {
      setSelectedChildId(queryChildId);
      return;
    }

    if (role === "child" && currentChildId) {
      setSelectedChildId(currentChildId);
      return;
    }

    if (role === "parent") {
      if (currentChildId) {
        setSelectedChildId(currentChildId);
      } else if (!selectedChildId && children.length > 0) {
        setSelectedChildId(children[0].id);
      }
    }
  }, [queryChildId, role, currentChildId, children, selectedChildId]);

  // 選択子どもの weekStart
  useEffect(() => {
    if (!selectedChildId) return;
    const cfg = timetablesByChild[selectedChildId];
    if (cfg && (cfg.weekStart === "mon" || cfg.weekStart === "sun")) {
      setUiWeekStart(cfg.weekStart);
    }
  }, [selectedChildId, timetablesByChild]);

  const currentConfig =
    (selectedChildId && timetablesByChild[selectedChildId]) || {
      weekStart: uiWeekStart,
      cells: createEmptyCells(),
    };

  const weekStart = currentConfig.weekStart || uiWeekStart;
  const dayOrder = getDayOrder(weekStart);
  const cells = currentConfig.cells || createEmptyCells();

  const saveTimetables = (updater) => {
    setTimetablesByChild((prev) => {
      const next = updater(prev);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleWeekStartChange = (start) => {
    setUiWeekStart(start);
    if (!selectedChildId) return;
    saveTimetables((prev) => {
      const prevCfg = prev[selectedChildId] || {
        weekStart: start,
        cells: createEmptyCells(),
      };
      return {
        ...prev,
        [selectedChildId]: {
          ...prevCfg,
          weekStart: start,
        },
      };
    });
  };

  const handleHeaderClick = (dayKey) => {
    if (dayKey === "mon") {
      handleWeekStartChange("mon");
    } else if (dayKey === "sun") {
      handleWeekStartChange("sun");
    }
  };

  const handleCellChange = (dayKey, periodIndex, value) => {
    if (!selectedChildId) return;
    saveTimetables((prev) => {
      const prevCfg = prev[selectedChildId] || {
        weekStart: uiWeekStart,
        cells: createEmptyCells(),
      };
      const prevCells = prevCfg.cells || createEmptyCells();
      const dayRow = [...(prevCells[dayKey] || Array(PERIOD_COUNT).fill(""))];
      dayRow[periodIndex] = value;

      return {
        ...prev,
        [selectedChildId]: {
          weekStart: prevCfg.weekStart || uiWeekStart,
          cells: {
            ...prevCells,
            [dayKey]: dayRow,
          },
        },
      };
    });
  };

  // ③ CSV 出力：UTF-8 + BOM をバイト列で生成（Excel の文字化け対策）
  const handleExportCSV = () => {
    if (!selectedChildId) {
      alert("子どもが選択されていません。");
      return;
    }

    const cfg = timetablesByChild[selectedChildId];
    if (!cfg) {
      alert("時間割がまだ入力されていません。");
      return;
    }

    const dayKeys = getDayOrder(cfg.weekStart || "mon");
    const header =
      ["コマ"].concat(dayKeys.map((d) => getDayLabel(d, lang))).join(",");

    const lines = [];
    for (let i = 0; i < PERIOD_COUNT; i++) {
      const row = [];
      row.push(String(i + 1)); // コマ番号
      dayKeys.forEach((d) => {
        const value = (cfg.cells?.[d] || [])[i] ?? "";
        row.push(escapeCSV(value));
      });
      lines.push(row.join(","));
    }

    const csvBody = [header, ...lines].join("\r\n");

    // TextEncoder で UTF-8 のバイト列をつくり、先頭に BOM を手で乗せる
    const encoder = new TextEncoder(); // UTF-8 固定
    const csvBytes = encoder.encode(csvBody);
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]); // UTF-8 BOM

    const blob = new Blob([bom, csvBytes], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const childName =
      children.find((c) => c.id === selectedChildId)?.name ?? "unknown";

    const a = document.createElement("a");
    a.href = url;
    a.download = `pocoapoco_timetable_${childName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV 取込
  const handleImportCSV = async (e) => {
    if (!selectedChildId) {
      alert("子どもが選択されていません。");
      e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // ② ファイル名に子どもの名前が含まれているかチェック
    const selectedChild = children.find((c) => c.id === selectedChildId);
    if (selectedChild && !file.name.includes(selectedChild.name)) {
      alert(
        `選択中の子どもとファイル名が一致しません。\n\n選択中: ${selectedChild.name}\nCSV: ${file.name}`
      );
      e.target.value = "";
      return;
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length <= 1) {
      alert("有効なデータ行がありません。");
      e.target.value = "";
      return;
    }

    const headerRaw = parseCSVLine(lines[0]);
    if (headerRaw.length < 2) {
      alert("ヘッダー行の形式が想定と異なります。");
      e.target.value = "";
      return;
    }

    const header = headerRaw.map((h) =>
      h.replace(/["']/g, "").trim()
    );

    // ② タイトル（ヘッダー）が期待どおりかチェック
    const expectedDayOrder = getDayOrder(uiWeekStart);
    const expectedHeader = ["コマ"].concat(
      expectedDayOrder.map((d) => getDayLabel(d, lang))
    );

    const headerMatches =
      header.length === expectedHeader.length &&
      header.every((v, idx) => v === expectedHeader[idx]);

    if (!headerMatches) {
      alert(
        `この画面で使用できない形式のCSVです。\nヘッダー行が現在の設定と一致していません。\n\n期待するヘッダー:\n${expectedHeader.join(
          ", "
        )}\n\n読み込んだヘッダー:\n${header.join(", ")}`
      );
      e.target.value = "";
      return;
    }

    const dayCols = header.slice(1);
    const expectedOrder = expectedDayOrder;
    const colToDayKey = dayCols.map((label) => {
      const found = expectedOrder.find(
        (d) => getDayLabel(d, lang) === label
      );
      return found || null;
    });

    const newCells = createEmptyCells();

    for (let i = 1; i < lines.length && i <= PERIOD_COUNT; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) continue;

      const periodIndex = i - 1;
      for (let col = 1; col < cols.length; col++) {
        const dayKey = colToDayKey[col - 1];
        if (!dayKey) continue;
        newCells[dayKey][periodIndex] = cols[col];
      }
    }

    saveTimetables((prev) => ({
      ...prev,
      [selectedChildId]: {
        weekStart: uiWeekStart,
        cells: newCells,
      },
    }));

    e.target.value = "";
    alert("時間割を読み込みました。");
  };

  // ---- style ----

  const card = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.03)",
  };

  const controlButton = {
    borderRadius: "999px",
    border: "1px solid #ddd",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 500,
    background: "#fafafa",
    color: "#555",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  // 3コマごとのグループ＋土日専用色
  const groupColors = [
    { weekday: "#ffffff", sat: "#e0f2fe", sun: "#ffe4e6" },
    { weekday: "#faf5ff", sat: "#e5f0ff", sun: "#ffe9f2" },
    { weekday: "#fef9c3", sat: "#fdf3c4", sun: "#ffe9d5" },
    { weekday: "#e0f2fe", sat: "#dbeafe", sun: "#e5e7ff" },
    { weekday: "#fce7f3", sat: "#f9d7eb", sun: "#ffd6e7" },
  ];

  const getCellBackground = (dayKey, rowIndex) => {
    const groupIndex = Math.min(
      Math.floor(rowIndex / 3),
      groupColors.length - 1
    );
    const group = groupColors[groupIndex];

    if (dayKey === "sat") return group.sat;
    if (dayKey === "sun") return group.sun;
    return group.weekday;
  };

  const dayHeaderStyle = (dayKey) => {
    const clickable = dayKey === "mon" || dayKey === "sun";
    const isActive =
      (weekStart === "mon" && dayKey === "mon") ||
      (weekStart === "sun" && dayKey === "sun");

    return {
      borderBottom: isActive ? "2px solid #a855f7" : "1px solid #eee",
      padding: "6px 4px",
      textAlign: "center",
      minWidth: "70px",
      cursor: clickable ? "pointer" : "default",
      color: clickable ? "#4b5563" : "#6b7280",
      fontWeight: 600,
      backgroundColor: "#faf5ff",
      userSelect: "none",
    };
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={card}>
        {/* 上部：子ども選択＋CSVボタン */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          {/* ① 子モードでは選択ボタン非表示 */}
          {role === "parent" ? (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              style={{
                borderRadius: "999px",
                border: "1px solid #ddd",
                padding: "8px 14px",
                fontSize: "13px",
                background: "#fff",
                minWidth: "120px",
              }}
            >
              {children.length === 0 && (
                <option value="">子ども未登録</option>
              )}
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          ) : (
            <div
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                border: "1px solid #ddd",
                fontSize: "13px",
                background: "#f5ecff",
              }}
            >
              🧒 {selectedChild?.name || "この子"} の週間ボード
            </div>
          )}

          <button type="button" onClick={handleExportCSV} style={controlButton}>
            {t("weeklyCsvExport", lang)}
          </button>

          <label
            style={{
              ...controlButton,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{t("weeklyCsvImport", lang)}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCSV}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* テーブル本体 */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              minWidth: 70 * 7,
            }}
          >
            <thead>
              <tr>
                {dayOrder.map((dayKey) => (
                  <th
                    key={dayKey}
                    style={dayHeaderStyle(dayKey)}
                    onClick={() => handleHeaderClick(dayKey)}
                  >
                    {getDayLabel(dayKey, lang)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: PERIOD_COUNT }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {dayOrder.map((dayKey) => (
                    <td
                      key={dayKey}
                      style={{
                        borderBottom: "1px solid #f2f2f2",
                        padding: "4px 4px",
                        backgroundColor: getCellBackground(dayKey, rowIndex),
                      }}
                    >
                      <input
                        type="text"
                        value={cells[dayKey]?.[rowIndex] ?? ""}
                        onChange={(e) =>
                          handleCellChange(dayKey, rowIndex, e.target.value)
                        }
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          padding: "4px 6px",
                          fontSize: "11px",
                          boxSizing: "border-box",
                          backgroundColor: "rgba(255,255,255,0.8)",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "#9ca3af",
            lineHeight: 1.5,
          }}
        >
          {t("weeklyColorNote", lang)}
          <br />
          {t("weeklyUsageNote", lang)}
        </p>
      </div>
    </div>
  );
}
