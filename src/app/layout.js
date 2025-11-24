// src/app/layout.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "./globals.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [role, setRole] = useState("parent");

  // ロール読込（初回 + ルート切替時のみ実行）
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pocopoco_role");
      if (saved === "parent" || saved === "child") {
        setRole(saved);
      }
    } catch (e) {
      // 何もしない：初期はparent扱い
    }
  }, [pathname]);

  // 特定ページではタブを非表示にする
  const hiddenTabRoutes = ["/login"];
  const hideTabs = hiddenTabRoutes.some((p) => pathname?.startsWith(p));

  // フッターのタブ
  const baseTabs = [
    { href: "/", label: "ホーム", emoji: "🏠" },
    { href: "/history", label: "履歴", emoji: "📜" },
    { href: "/calendar", label: "カレンダー", emoji: "📅" },
    { href: "/weeklyboard", label: "週間ボード", emoji: "🗂️" },
    { href: "/songs", label: "曲リスト", emoji: "🎵" },
    { href: "/settings", label: "設定", emoji: "⚙️" },
  ];

  const tabs =
    role === "child"
      ? baseTabs.filter((t) => t.href !== "/settings")
      : baseTabs;

  return (
    <html lang="ja">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#fafafa",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* メインコンテンツ */}
        <div
          style={{
            flex: 1,
            paddingBottom: hideTabs ? 0 : "64px",
            maxWidth: "480px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </div>

        {/* フッターナビ（ログイン画面は非表示） */}
        {!hideTabs && (
          <nav
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              background: "#ffffff",
              borderTop: "1px solid #ddd",
              height: "64px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              zIndex: 50,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                width: "100%",
                maxWidth: "480px",
                margin: "0 auto",
              }}
            >
              {tabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    style={{
                      textDecoration: "none",
                      color: active ? "#6a00a0" : "#444",
                      fontWeight: active ? "600" : "400",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: "64px",
                      fontSize: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "20px",
                        marginBottom: "4px",
                        lineHeight: 1.2,
                      }}
                    >
                      {tab.emoji}
                    </span>
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </body>
    </html>
  );
}
