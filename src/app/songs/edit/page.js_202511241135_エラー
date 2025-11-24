"use client";
export const dynamic = 'force-dynamic';
export const fetchCache = "default-no-store";

import { useEffect, useState } from "react";
import { t as translate, getLangFromStorage } from "../../lib/i18n";
import { useSearchParams, useRouter } from "next/navigation";

const SONGS_KEY = "pocopoco_songs";

export default function EditSongPage() {
  const router = useRouter();
  const params = useSearchParams();

  const childId = params.get("childId");
  const index = Number(params.get("index"));

  const [composer, setComposer] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [memo, setMemo] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [lang, setLang] = useState("jp");

  const t = (key) => translate(key, lang);

  useEffect(() => {
    setLang(getLangFromStorage());
  }, []);

  /** 読み込み */
  useEffect(() => {
    if (!childId || index < 0) {
      setNotFound(true);
      return;
    }

    const data = JSON.parse(localStorage.getItem(SONGS_KEY) || "{}");

    if (!data[childId] || !data[childId][index]) {
      setNotFound(true);
      return;
    }

    const song = data[childId][index];

    setComposer(song.composer || "");
    setTitle(song.title || "");
    setDate(song.date || "");
    setPlace(song.place || "");
    setMemo(song.memo || "");

    setLoaded(true);
  }, [childId, index]);

  /** 更新処理 */
  const handleUpdate = () => {
    if (title.trim() === "") {
      alert(t("editSongAlertTitleRequired"));
      return;
    }

    const data = JSON.parse(localStorage.getItem(SONGS_KEY) || "{}");
    if (!data[childId]) data[childId] = [];

    data[childId][index] = {
      composer,
      title,
      date,
      place,
      memo,
    };

    localStorage.setItem(SONGS_KEY, JSON.stringify(data));

    router.push(`/songs?childId=${childId}`);
  };

  /** キャンセル */
  const handleCancel = () => {
    router.push(`/songs?childId=${childId}`);
  };

  // 編集対象なし
  if (notFound) {
    return (
      <div style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px" }}>
          {t("editSongPageTitle")}
        </h2>

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #eee",
            color: "red",
            fontSize: "15px",
          }}
        >
          {t("editSongNotFoundMessage")}
          <br />
          <button
            onClick={handleCancel}
            style={{
              marginTop: "20px",
              padding: "10px 18px",
              background: "#eee",
              borderRadius: "8px",
              border: "none",
            }}
          >
            {t("editSongBackToList")}
          </button>
        </div>
      </div>
    );
  }

  if (!loaded) return null;

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "20px" }}>
        {t("editSongPageTitle")}
      </h2>

      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid #eee",
        }}
      >
        {/* 作曲者 */}
        <label style={{ fontSize: "14px" }}>{t("songsHeaderComposer")}</label>
        <input
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          style={inputStyle}
        />

        {/* 曲名 */}
        <label style={{ fontSize: "14px", marginTop: "18px" }}>
          {t("songsHeaderTitle")} *
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        {/* 日付 */}
        <label style={{ fontSize: "14px", marginTop: "18px" }}>{t("songsHeaderDate")}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />

        {/* 場所 */}
        <label style={{ fontSize: "14px", marginTop: "18px" }}>{t("songsHeaderPlace")}</label>
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          style={inputStyle}
        />

        {/* メモ */}
        <label style={{ fontSize: "14px", marginTop: "18px" }}>{t("songsHeaderMemo")}</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          style={{
            ...inputStyle,
            height: "120px",
            resize: "vertical",
          }}
        />

        {/* ボタン */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={handleCancel}
            style={{
              padding: "12px 18px",
              background: "#e0e0e0",
              borderRadius: "10px",
              border: "none",
            }}
          >
            {t("newSongCancel")}
          </button>

          <button
            onClick={handleUpdate}
            style={{
              padding: "12px 18px",
              background: "linear-gradient(90deg,#a56eff,#d57bff)",
              color: "#fff",
              borderRadius: "10px",
              border: "none",
            }}
          >
            {t("editSongUpdate")}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #bbb",
  fontSize: "15px",
  marginTop: "6px",
  background: "#fff",
};
