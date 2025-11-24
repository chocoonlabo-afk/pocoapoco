// src/app/layout.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "./globals.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [role, setRole] = useState("parent");

  // ロールをローカルストレージから読む
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pocopoco_role");
      if (saved === "parent" || saved === "child") {
        setRole(saved);
      }
    } catch (e) {
      // 何もしない（初期はparent扱い）
    }
  }, [pathname]);

  // このパスではタブを表示しない
  const hiddenTabRoutes = ["/login"];
  const hideTabs = hiddenTabRoutes.some((p) => pathname?.startsWith(p));

  // タブ定義（ここから子の場合は設定を消す）
  const baseTabs = [
    { href: "/", label: "ホーム", emoji: "🏠" },
    { href: "/history", label: "履歴", emoji: "📜" },
    { href: "/calendar", label: "カレンダー", emoji: "📅" },
    { href: "/weeklyboard", label: "週間ボード", emoji: "🗂️" },  // ★ 追加
    { href: "/songs", label: "曲リスト", emoji: "🎵" }, // ← 追加
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
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* コンテンツ本体 */}
        <div
          style={{
            flex: 1,
            paddingBottom: hideTabs ? 0 : "64px", // タブぶんの余白（ログインではなし）
            maxWidth: "480px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </div>

        {/* 固定フッターナビ（ログインでは出さない） */}
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
                // "/" と "/history" みたいな時の一致をゆるくするなら startsWith にしてもOK
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    style={{
                      textDecoration: "none",
                      fontSize: "12px",
                      color: active ? "#6a00a0" : "#444",
                      fontWeight: active ? "600" : "400",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: "64px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "20px",
                        lineHeight: 1.2,
                        marginBottom: "4px",
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
