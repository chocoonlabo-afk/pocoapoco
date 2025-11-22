// src/app/settings/calendar-settings.js
"use client";

import { useEffect, useState } from "react";
import { LS_CALENDAR_SETTINGS } from "@/app/constants";

const DEFAULT_BADGES = [
  { id: "level1", name: "少しでも練習した日", minMinutes: 1, icon: "🌸" },
  { id: "level2", name: "たくさん練習（銅）", minMinutes: 30, icon: "🥉" },
  { id: "level3", name: "もっとたくさん（銀）", minMinutes: 60, icon: "🥈" },
  { id: "level4", name: "すごくがんばった（金）", minMinutes: 90, icon: "🥇" },
];

export default function CalendarSettingsSection() {
  const [firstDayOfWeek, setFirstDayOfWeek] = useState("sun");
  const [badges, setBadges] = useState(DEFAULT_BADGES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_CALENDAR_SETTINGS);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.firstDayOfWeek === "mon") setFirstDayOfWeek("mon");
      if (Array.isArray(data.badges) && data.badges.length > 0) {
        setBadges(
          DEFAULT_BADGES.map((def) => {
            const found = data.badges.find((b) => b.id === def.id);
            return found ? { ...def, ...found } : def;
          })
        );
      }
    } catch (e) {
      console.warn("calendar settings load error", e);
    }
  }, []);

  const updateBadge = (id, field, value) => {
    setBadges((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              [field]:
                field === "minMinutes" ? Number(value || 0) : String(value || ""),
            }
          : b
      )
    );
  };

  const handleSave = () => {
    const payload = {
      firstDayOfWeek,
      badges,
    };
    localStorage.setItem(LS_CALENDAR_SETTINGS, JSON.stringify(payload));
    alert("カレンダー設定を保存しました。ホーム画面に戻ると反映されます。");
  };

  return (
    <section
      style={{
        marginTop: "16px",
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#fff",
      }}
    >
      <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
        カレンダー設定
      </h2>

      {/* 週の始まり */}
      <div style={{ marginBottom: "12px", fontSize: "13px" }}>
        <div style={{ marginBottom: "4px" }}>週の始まり</div>
        <label style={{ marginRight: "12px" }}>
          <input
            type="radio"
            name="firstDayOfWeek"
            value="sun"
            checked={firstDayOfWeek === "sun"}
            onChange={() => setFirstDayOfWeek("sun")}
          />{" "}
          日曜はじまり
        </label>
        <label>
          <input
            type="radio"
            name="firstDayOfWeek"
            value="mon"
            checked={firstDayOfWeek === "mon"}
            onChange={() => setFirstDayOfWeek("mon")}
          />{" "}
          月曜はじまり
        </label>
      </div>

      {/* バッジ設定 */}
      <div style={{ fontSize: "13px" }}>
        <div style={{ marginBottom: "4px" }}>
          日ごとの合計練習時間に応じて表示するマーク
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "4px",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "4px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                名前
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "4px",
                  borderBottom: "1px solid #e5e7eb",
                  width: "80px",
                }}
              >
                何分以上
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "4px",
                  borderBottom: "1px solid #e5e7eb",
                  width: "70px",
                }}
              >
                マーク
              </th>
            </tr>
          </thead>
          <tbody>
            {badges.map((b) => (
              <tr key={b.id}>
                <td style={{ padding: "4px" }}>{b.name}</td>
                <td style={{ padding: "4px", textAlign: "right" }}>
                  <input
                    type="number"
                    min={0}
                    value={b.minMinutes}
                    onChange={(e) =>
                      updateBadge(b.id, "minMinutes", e.target.value)
                    }
                    style={{
                      width: "60px",
                      fontSize: "12px",
                      padding: "2px 4px",
                    }}
                  />{" "}
                  分
                </td>
                <td style={{ padding: "4px" }}>
                  <input
                    type="text"
                    value={b.icon}
                    onChange={(e) =>
                      updateBadge(b.id, "icon", e.target.value)
                    }
                    style={{
                      width: "50px",
                      fontSize: "16px",
                      textAlign: "center",
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: "11px", color: "#6b7280",
