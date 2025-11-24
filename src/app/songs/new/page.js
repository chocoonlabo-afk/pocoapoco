// src/app/songs/new/page.js
"use client";
export const dynamic = 'force-dynamic';
export const fetchCache = "default-no-store";

import { useEffect, useState, Suspense } from "react";
import { t as translate, getLangFromStorage } from "../../lib/i18n";
import { useRouter, useSearchParams } from "next/navigation";

function NewSongPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIdFromQuery = searchParams.get("childId") || "";

  const [childId, setChildId] = useState(childIdFromQuery);
  const [children, setChildren] = useState([]);

  const [lang, setLang] = useState("jp");

  const [composer, setComposer] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [memo, setMemo] = useState("");

  const t = (key) => translate(key, lang);

  // 言語読込
  useEffect(() => {
    setLang(getLangFromStorage());
  }, []);

  // 子ども一覧読み込み
  useEffect(() => {
    try {
      const rawChildren = localStorage.getItem("pocopoco_children");
      if (rawChildren) {
        const arr = JSON.parse(rawChildren);
        if (Array.isArray(arr)) {
          setChildren(arr);
          // childId が未設定なら先頭を採用
          if (!childIdFromQuery && arr.length > 0) {
            setChildId(arr[0].id);
          }
        }
      }
    } catch (e) {
      console.warn("children load error", e);
    }
  }, [childIdFromQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!childId) {
      alert(t("songsAlertSelectChild"));
      return;
    }
    if (!title && !composer) {
      alert(t("newSongAlertRequireTitleOrComposer"));
      return;
    }

    const newSong = {
      composer: composer.trim(),
      title: title.trim(),
      date: date, // "YYYY-MM-DD"
      place: place.trim(),
      memo: memo.trim(),
    };

    // 既存の曲データを取得
    let allSongs = {};
    try {
      const raw = localStorage.getItem("pocopoco_songs");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === "object") {
          allSongs = obj;
        }
      }
    } catch (err) {
      console.warn("songs load error", err);
    }

    const currentList = Array.isArray(allSongs[childId])
      ? allSongs[childId]
      : [];

    allSongs[childId] = [...currentList, newSong];

    try {
      localStorage.setItem("pocopoco_songs", JSON.stringify(allSongs));
    } catch (err) {
      console.error("songs save error", err);
      alert(t("newSongAlertSaveFailed"));
      return;
    }

    // 登録完了 → 曲リスト画面へ戻る（子どもID付き）
    router.push(`/songs?childId=${childId}`);
  };

  const handleCancel = () => {
    if (childId) {
      router.push(`/songs?childId=${childId}`);
    } else {
      router.push("/songs");
    }
  };

  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "24px 16px 80px",
        maxWidth: "540px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#4a148c",
          marginBottom: "16px",
        }}
      >
        {t("newSongPageTitle")}
      </h1>

      <form onSubmit={handleSubmit}>
        {/* 子ども選択 */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              marginBottom: "4px",
              color: "#555",
            }}
          >
            {t("newSongChildLabel")}
          </label>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            style={{
              width: "100%",
              borderRadius: "999px",
              border: "1px solid #ccc",
              padding: "8px 12px",
              fontSize: "14px",
            }}
          >
            {children.length === 0 && (
              <option value="">{t("songsNoChildRegistered")}</option>
            )}
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 作曲者名 */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              marginBottom: "4px",
              color: "#555",
            }}
          >
            {t("songsHeaderComposer")}
          </label>
          <input
            type="text"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="例：ヴィヴァルディ"
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              padding: "8px 10px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* 曲名 */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              marginBottom: "4px",
              color: "#555",
            }}
          >
            {t("songsHeaderTitle")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：協奏曲 イ短調 第1楽章"
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              padding: "8px 10px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* 発表日 */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              marginBottom: "4px",
              color: "#555",
            }}
          >
            {t("songsHeaderDate")}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              padding: "8px 10px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* 発表場所 */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              marginBottom: "4px",
              color: "#555",
            }}
          >
            {t("songsHeaderPlace")}
          </label>
          <input
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="例：○○ホール，○○コンクール"
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              padding: "8px 10px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* メモ */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              marginBottom: "4px",
              color: "#555",
            }}
          >
            {t("songsHeaderMemo")}
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={4}
            placeholder="例：初めてのコンクール，本選でテンポ速めで弾いた など"
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              padding: "8px 10px",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </div>

        {/* ボタン */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            style={{
              borderRadius: "999px",
              border: "1px solid #ccc",
              padding: "8px 18px",
              fontSize: "13px",
              background: "#fff",
            }}
          >
            {t("newSongCancel")}
          </button>
          <button
            type="submit"
            style={{
              borderRadius: "999px",
              border: "none",
              padding: "8px 20px",
              fontSize: "13px",
              background: "linear-gradient(135deg, #a855f7, #ec4899)",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {t("newSongRegister")}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function NewSongPage() {
  return (
    <Suspense fallback={<div />}>
      <NewSongPageInner />
    </Suspense>
  );
}
