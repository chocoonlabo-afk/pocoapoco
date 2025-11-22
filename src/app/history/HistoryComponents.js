import {
  formatDate,
  getTaskTitle,
  getSongTitle,
  renderChildNameFromId,
} from "./historyUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { t } from "../lib/i18n";

export function HistoryHeader({ role, lang }) {
  return (
    <header style={{ marginBottom: "16px" }}>
      {role === "child" && (
        <p style={{ fontSize: "11px", color: "#c06", marginTop: "4px" }}>
          {t("historyChildModeNotice", lang)}
        </p>
      )}
    </header>
  );
}

export function HistoryChildSelector({
  role,
  childrenList,
  currentChildId,
  setCurrentChildId,
}) {
  if (!childrenList || childrenList.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: "10px",
        display: "flex",
        gap: "6px",
        flexWrap: "wrap",
      }}
    >
      {role !== "child" ? (
        <>
          <button
            onClick={() => setCurrentChildId("all")}
            style={{
              border:
                currentChildId === "all"
                  ? "1px solid #6a1b9a"
                  : "1px solid #ccc",
              background: "#fff",
              borderRadius: "999px",
              padding: "4px 10px",
              fontSize: "12px",
              color: currentChildId === "all" ? "#6a1b9a" : "#555",
            }}
          >
            ぜんいん
          </button>
          {childrenList.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setCurrentChildId(ch.id)}
              style={{
                border:
                  currentChildId === ch.id
                    ? "1px solid #6a1b9a"
                    : "1px solid #ccc",
                background: "#fff",
                borderRadius: "999px",
                padding: "4px 10px",
                fontSize: "12px",
                color: currentChildId === ch.id ? "#6a1b9a" : "#555",
              }}
            >
              {ch.name}
            </button>
          ))}
        </>
      ) : (
        // 子モード：自分だけ表示（クリック不可）
        childrenList
          .filter((ch) => String(ch.id) === String(currentChildId))
          .map((ch) => (
            <span
              key={ch.id}
              style={{
                border: "1px solid #6a1b9a",
                color: "#6a1b9a",
                backgroundColor: "#fff",
                borderRadius: "999px",
                padding: "4px 10px",
                fontSize: "12px",
              }}
            >
              {ch.name}
            </span>
          ))
      )}
    </div>
  );
}

export function HistoryFilterSection({
  selectedTaskIds,
  availableTasks,
  setIsTaskSelectorOpen,
  handleExportCsv,
  handleImportClick,
  periodType,
  setPeriodType,
  lang,
}) {
  const allTasksSelected =
    selectedTaskIds.length === 0 ||
    selectedTaskIds.length === availableTasks.length;

  return (
    <section
      style={{
        borderRadius: "12px",
        background: "#faf5ff",
        border: "1px solid #e0ccff",
        padding: "10px 12px",
        marginBottom: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* 上段：タスク選択＋CSV */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setIsTaskSelectorOpen(true)}
          style={{
            flex: 1,
            borderRadius: "999px",
            border: "1px solid #6a1b9a",
            padding: "4px 10px",
            fontSize: "13px",
            background: "#fff",
            textAlign: "left",
          }}
        >
          {allTasksSelected
            ? t("historyAllTasks", lang)
            : `${selectedTaskIds.length} ${t(
                "historySelectedTasksSuffix",
                lang
              )}`}
        </button>

        <div
          style={{
            display: "flex",
            gap: "4px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleExportCsv}
            style={{
              borderRadius: "999px",
              border: "1px solid #bbb",
              padding: "4px 8px",
              fontSize: "11px",
              background: "#fff",
            }}
          >
            {t("historyCsvExport", lang)}
          </button>
          <button
            onClick={handleImportClick}
            style={{
              borderRadius: "999px",
              border: "1px solid #bbb",
              padding: "4px 8px",
              fontSize: "11px",
              background: "#fff",
            }}
          >
            {t("historyCsvImport", lang)}
          </button>
        </div>
      </div>

      {/* 下段：期間ボタン */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
        }}
      >
        {[
          { id: "day", key: "historyDay" },
          { id: "week", key: "historyWeek" },
          { id: "month", key: "historyMonth" },
          { id: "all", key: "historyAllRange" },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodType(p.id)}
            style={{
              borderRadius: "999px",
              padding: "4px 10px",
              fontSize: "12px",
              border:
                periodType === p.id
                  ? "1px solid #6a1b9a"
                  : "1px solid #ccc",
              background:
                periodType === p.id ? "rgba(106,27,154,0.08)" : "#fff",
            }}
          >
            {t(p.key, lang)}
          </button>
        ))}
      </div>
    </section>
  );
}

export function HistoryGraphCard({ chartData, lang }) {
  const minutesUnit = t("historyMinutesUnit", lang);

  return (
    <section
      style={{
        borderRadius: "12px",
        background: "#fff",
        border: "1px solid #eee",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
        padding: "10px 12px 4px",
        marginBottom: "20px",
      }}
    >
      <h3
        style={{
          fontSize: "14px",
          marginBottom: "4px",
          color: "#6a1b9a",
        }}
      >
        {t("historyChartTitle", lang)}
      </h3>
      <p style={{ fontSize: "11px", color: "#777", marginBottom: "8px" }}>
        {t("historyChartDescription", lang)}
      </p>
      <div style={{ width: "100%", height: 180 }}>
        {chartData.length === 0 ? (
          <div
            style={{
              fontSize: "12px",
              color: "#999",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            まだグラフにできる きろくがありません。
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <defs>
                <linearGradient
                  id="minutesPurple"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#ce93d8" />
                  <stop offset="100%" stopColor="#6a1b9a" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval={0}
                height={30}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                width={32}
                tickFormatter={(v) => `${v}${minutesUnit}`}
              />
              <Tooltip
                formatter={(value) => [
                  `${value} ${minutesUnit}`,
                  t("historyTotalTime", lang),
                ]}
                labelFormatter={(label) => label}
              />
              <Bar
                dataKey="minutes"
                fill="url(#minutesPurple)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export function HistorySummaryCard({ summary, lang }) {
  const minutesUnit = t("historyMinutesUnit", lang);
  const timesUnit = t("historyTimesUnit", lang);
  const itemUnit = t("historyItemUnit", lang);

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, rgba(240,230,255,0.9), rgba(230,245,255,0.8))",
        border: "1px solid #e0ccff",
        borderRadius: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
        padding: "16px",
        marginBottom: "20px",
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          marginBottom: "8px",
          color: "#6a1b9a",
        }}
      >
        {t("historyTodaySummary", lang)}
      </h3>
      <p style={{ fontSize: "14px", margin: "4px 0", color: "#333" }}>
        {t("historyTotalTime", lang)}：
        <strong>{summary.totalMinutes}</strong>
        {minutesUnit}
      </p>
      <p style={{ fontSize: "14px", margin: "4px 0", color: "#333" }}>
        {t("historyTotalCounts", lang)}：
        <strong>{summary.totalCount}</strong>
        {timesUnit}
      </p>
      <p style={{ fontSize: "14px", margin: "4px 0", color: "#333" }}>
        {t("historyItemsCount", lang)}：
        <strong>{summary.todayCount}</strong>
        {itemUnit}
      </p>
    </section>
  );
}

export function HistoryListSection({
  role,
  currentChildId,
  childrenList,
  decoratedList,
  taskDict,
  songsDict,
  onEditClick,
  lang,
}) {
  let titleKey;
  if (role === "child") {
    titleKey = "historyMyRecordsTitle";
  } else if (currentChildId === "all") {
    titleKey = "historyAllRecordsTitle";
  } else {
    titleKey = "historyChildRecordTitle";
  }

  const minutesUnit = t("historyMinutesUnit", lang);
  const timesUnit = t("historyTimesUnit", lang);

  return (
    <section>
      <h3
        style={{
          fontSize: "16px",
          marginBottom: "12px",
          color: "#6a1b9a",
        }}
      >
        {t(titleKey, lang)}
      </h3>

      {decoratedList.length === 0 ? (
        <p style={{ fontSize: "14px", color: "#777" }}>
          まだきろくがありません。
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {decoratedList.map(({ absoluteIndex, record }) => {
            const taskTitle = getTaskTitle(record, taskDict);
            const songTitle = getSongTitle(record, songsDict);
            const minutes = Math.floor((record.seconds || 0) / 60);

            return (
              <div
                key={absoluteIndex}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                  padding: "12px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  columnGap: "8px",
                }}
              >
                {/* 左側：内容 */}
                <div
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.4,
                    color: "#333",
                    wordBreak: "break-word",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    {formatDate(record.startedAt)}
                  </div>

                  {role !== "child" &&
                    currentChildId === "all" &&
                    record.child_id && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6a1b9a",
                          marginBottom: "2px",
                        }}
                      >
                        {renderChildNameFromId(record.child_id, childrenList)}
                      </div>
                    )}

                  {songTitle && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        marginBottom: "2px",
                      }}
                    >
                      ♪ {songTitle}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#4a148c",
                    }}
                  >
                    {taskTitle}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#333",
                    }}
                  >
                    ⏱ {minutes}
                    {minutesUnit} ／ 🎯 {record.count || 0}
                    {timesUnit}
                  </div>

                  {record.memo && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "13px",
                        color: "#555",
                        background: "#fafafa",
                        borderRadius: "6px",
                        padding: "6px 8px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      📝 {record.memo}
                    </div>
                  )}
                </div>

                {/* 右側：編集ボタン（親だけ／鉛筆アイコンのみ） */}
                {role !== "child" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    <button
                      onClick={() => onEditClick(absoluteIndex)}
                      aria-label={t("historyEditAria", lang)}
                      title={t("historyEditAria", lang)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "4px",
                        color: "#6a1b9a",
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// 戻るボタンコンポーネントは残しておくが、履歴画面では使わない
export function BackToHomeButton() {
  return null;
}

// CSV入力用 hidden input
export function CsvHiddenInput({ fileInputRef, handleImportChange }) {
  return (
    <input
      type="file"
      ref={fileInputRef}
      accept=".csv,text/csv"
      style={{ display: "none" }}
      onChange={handleImportChange}
    />
  );
}

// タスク選択モーダル（文言は現状のまま日本語）
export function TaskSelectorModal({
  isOpen,
  onClose,
  availableTasks,
  selectedTaskIds,
  setSelectedTaskIds,
}) {
  if (!isOpen) return null;

  const toggleTask = (id) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((x) => x !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleAllClear = () => {
    setSelectedTaskIds([]);
  };

  const handleAllSelect = () => {
    setSelectedTaskIds(availableTasks.map((t) => t.id));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "420px",
          maxHeight: "80vh",
          background: "#fff",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            marginBottom: "4px",
            color: "#4a148c",
          }}
        >
          タスクをえらぶ
        </h2>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <button
            onClick={handleAllSelect}
            style={{
              flex: 1,
              borderRadius: "999px",
              border: "1px solid #6a1b9a",
              padding: "4px 8px",
              fontSize: "12px",
              background: "#f3e5f5",
            }}
          >
            すべてえらぶ
          </button>
          <button
            onClick={handleAllClear}
            style={{
              flex: 1,
              borderRadius: "999px",
              border: "1px solid #ccc",
              padding: "4px 8px",
              fontSize: "12px",
              background: "#fafafa",
            }}
          >
            すべてはずす
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #eee",
            borderRadius: "8px",
            padding: "8px",
          }}
        >
          {availableTasks.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#777" }}>
              まだタスクがありません。
            </p>
          ) : (
            availableTasks.map((task) => {
              const checked = selectedTaskIds.includes(task.id);
              return (
                <label
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    marginBottom: "4px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span>{task.label}</span>
                </label>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: "8px",
            borderRadius: "999px",
            border: "none",
            padding: "8px 12px",
            fontSize: "14px",
            background: "#6a1b9a",
            color: "#fff",
          }}
        >
          とじる
        </button>
      </div>
    </div>
  );
}
