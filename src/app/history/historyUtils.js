// 日付をきれいに表示
export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// タスク名を複数パターンから取る
export function getTaskTitle(record, taskDict) {
  if (record.task_title) return record.task_title; // 新
  if (record.task) return record.task; // 旧
  if (record.task_id && taskDict[record.task_id]) {
    return taskDict[record.task_id];
  }
  return "タスク不明";
}

// 曲名を取得（履歴 or 曲マスタから）
export function getSongTitle(record, songsDict) {
  if (!record) return "";
  if (record.song_title) return record.song_title;
  if (record.songTitle) return record.songTitle;
  if (record.song_name) return record.song_name;

  if (record.song_id && songsDict[record.song_id]) {
    return songsDict[record.song_id];
  }
  if (record.songId && songsDict[record.songId]) {
    return songsDict[record.songId];
  }
  return "";
}

// タスクキー（フィルタ用、一意にする）
export function getTaskKey(record) {
  if (record.task_id) return `id:${record.task_id}`;
  if (record.task_title) return `title:${record.task_title}`;
  if (record.task) return `name:${record.task}`;
  return "unknown";
}

// availableTasks を作る
export function collectAvailableTasks(allRecords, dict) {
  const map = new Map(); // key -> label
  allRecords.forEach((r) => {
    const key = getTaskKey(r);
    const label =
      r.task_title || r.task || (r.task_id && dict[r.task_id]) || "タスク不明";
    if (!map.has(key)) {
      map.set(key, label);
    }
  });
  const tasks = Array.from(map.entries()).map(([id, label]) => ({
    id,
    label,
  }));
  return { tasks };
}

// グラフ用データ作成
export function buildChartData(records, periodType) {
  if (!Array.isArray(records) || records.length === 0) return [];

  const map = new Map(); // key -> { label, seconds }

  records.forEach((r) => {
    if (!r.startedAt) return;
    const d = new Date(r.startedAt);
    if (Number.isNaN(d.getTime())) return;

    let key = "";
    let label = "";

    const yyyy = d.getFullYear();
    const mm = d.getMonth() + 1;
    const dd = d.getDate();

    if (periodType === "day") {
      key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      label = `${mm}/${dd}`;
    } else if (periodType === "week") {
      const weekStart = getMonday(d);
      const wmm = weekStart.getMonth() + 1;
      const wdd = weekStart.getDate();
      key = `W-${weekStart.toISOString().slice(0, 10)}`;
      label = `${wmm}/${wdd}週`;
    } else {
      // "month" or "all"
      key = `${yyyy}-${String(mm).padStart(2, "0")}`;
      label = `${yyyy}/${mm}`;
    }

    const before = map.get(key) || { label, seconds: 0 };
    before.seconds += r.seconds || 0;
    map.set(key, before);
  });

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([_, v]) => ({
      label: v.label,
      minutes: Math.round(v.seconds / 60),
    }));
}

// その週の月曜日（週集計用）
export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0:日
  const diff = (day + 6) % 7; // 月曜=0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// CSV → record[]
export function parseCsvToRecords(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(",").map((h) => h.trim());

  const idxStartedAt = headers.indexOf("startedAt");
  const idxChildId = headers.indexOf("child_id");
  const idxTaskId = headers.indexOf("task_id");
  const idxTaskTitle = headers.indexOf("task_title");
  const idxSeconds = headers.indexOf("seconds");
  const idxCount = headers.indexOf("count");
  const idxMemo = headers.indexOf("memo");

  if (idxStartedAt === -1) {
    // ヘッダなしとして全行をデータ扱い（簡易）
    return dataLines.map((line) => {
      const cols = line.split(",");
      return {
        startedAt: cols[0] || "",
        child_id: cols[1] || "",
        task_id: cols[2] || "",
        task_title: cols[3] || "",
        seconds: Number(cols[4] || "0") || 0,
        count: Number(cols[5] || "0") || 0,
        memo: cols[6] || "",
      };
    });
  }

  return dataLines.map((line) => {
    const cols = line.split(",");
    return {
      startedAt: cols[idxStartedAt] || "",
      child_id: idxChildId >= 0 ? cols[idxChildId] || "" : "",
      task_id: idxTaskId >= 0 ? cols[idxTaskId] || "" : "",
      task_title: idxTaskTitle >= 0 ? cols[idxTaskTitle] || "" : "",
      seconds:
        idxSeconds >= 0 ? Number(cols[idxSeconds] || "0") || 0 : 0,
      count: idxCount >= 0 ? Number(cols[idxCount] || "0") || 0 : 0,
      memo: idxMemo >= 0 ? cols[idxMemo] || "" : "",
    };
  });
}

// 子どもIDから名前を引く小さいヘルパ
export function renderChildNameFromId(childId, childrenList) {
  const found = childrenList.find((c) => c.id === childId);
  return found ? found.name : childId;
}
