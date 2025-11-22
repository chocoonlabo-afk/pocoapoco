// src/app/songs/edit/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STORAGE_KEY = "pocoapoco_songs_by_child";

// 仮の子どもデータ（songs/page.js と合わせる）
const initialChildren = [
  { id: "child1", name: "ゆくも" },
  { id: "child2", name: "あまね" },
];

export default function SongEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [children] = useState(initialChildren);
  const [childId, setChildId] = useState("child1");
  const [songId, setSongId] = useState(null);

  const [composer, setComposer] = useState("");
  const [title, setTitle] = useState("");
  const [performanceDate, setPerformanceDate] = useState("");
  const [venue, setVenue] = useState("");
  const [memo, setMemo] = useState("");

  const [notFound, setNotFound] = useState(false);

  // 初期読み込み
  useEffect(() => {
    const qChild = searchParams.get("childId");
    const qId = searchParams.get("id");

    if (qChild) setChildId(qChild);
    if (!qId) {
      setNotFound(true);
      return;
    }
    setSongId(qId);

    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setNotFound(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        setNotFound(true);
        return;
      }
      const list = parsed[qChild || "child1"] || [];
      const target = list.find((s) => String(s.id) === String(qId));
      if (!target) {
        setNotFound(true);
        return;
      }

      setComposer(target.composer || "");
      setTitle(target.title || "");
      setPerformanceDate(target.performanceDate || "");
      setVenue(target.venue || "");
      setMemo(target.memo || "");
    } catch (e) {
      console.error(e);
      setNotFound(true);
    }
  }, [searchParams]);

  const sectionCard = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "4px",
    color: "#555",
  };

  const inputStyle = {
    width: "100%",
    borderRadius: "10px",
    border: "1px solid " + (notFound ? "#f87171" : "#ddd"),
    padding: "8px 10px",
    fontSize: "13px",
    boxSizing: "border-box",
  };

  const buttonPrimary = {
    borderRadius: "999px",
    border: "none",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    background:
      "linear-gradient(135deg, rgba(186,104,200,1), rgba(103,58,183,1))",
    color: "#fff",
    cursor: "pointer",
  };

  const buttonSecondary = {
    borderRadius: "999px",
    border: "1px solid #ccc",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 500,
    background: "#fafafa",
    color: "#555",
    cursor: "pointer",
  };

  const handleCancel = () => {
    router.push(`/songs?childId=${encodeURIComponent(childId)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!songId) return;

    if (!title.trim()) {
      alert("曲名を入力してください。");
      return;
    }

    if (typeof window === "undefined") return;

    let songsByChild = {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          songsByChild = parsed;
        }
      } catch (e) {
        console.error("Failed to parse songs from storage", e);
      }
    }

    const list = songsByChild[childId] ?? [];
    const newList = list.map((s) =>
      String(s.id) === String(songId)
        ? {
            ...s,
            title: title.trim(),
            composer: composer.trim(),
            performanceDate,
            venue: venue.trim(),
            memo: memo.trim(),
          }
        : s
    );

    songsByChild[childId] = newList;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(songsByChild));

    router.push(`/songs?childId=${encodeURIComponent(childId)}`);
  };

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h1
        style={{
          fontSize: "18px",
          fontWeight: 700,
          marginBottom: "4px",
        }}
      >
        曲を編集
      </h1>
      <p
        style={{
          fontSize: "12px",
          color: "#777",
          marginBottom: "16px",
        }}
      >
        リストに登録済みの曲データを修正できます。
      </p>

      <div style={sectionCard}>
        {notFound ? (
          <div>
            <p
              style={{
                fontSize: "13px",
                color: "#ef4444",
                marginBottom: "12px",
              }}
            >
              編集対象の曲データが見つかりませんでした。
            </p>
            <button
              type="button"
              onClick={handleCancel}
              style={buttonSecondary}
            >
              曲名リストに戻る
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "10px" }}>
              <label style={labelStyle}>子ども</label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                style={inputStyle}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={labelStyle}>作曲者名</label>
              <input
                type="text"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="例：ヴィヴァルディ"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={labelStyle}>
                曲名 <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：協奏曲 RV.399 第1楽章"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1.2fr",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div>
                <label style={labelStyle}>発表日</label>
                <input
                  type="date"
                  value={performanceDate}
                  onChange={(e) => setPerformanceDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>発表場所</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="例：○○ホール、○○コンクール"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>メモ</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例：初めての本選、テンポ速めで弾いた など"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={handleCancel}
                style={buttonSecondary}
              >
                キャンセル
              </button>
              <button type="submit" style={buttonPrimary}>
                更新
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
