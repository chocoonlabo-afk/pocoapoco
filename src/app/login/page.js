"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [hasParentCode, setHasParentCode] = useState(false);
  const [parentCode, setParentCode] = useState("");
  const [inputParentCode, setInputParentCode] = useState("");
  const [children, setChildren] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    // 親コードがすでにあるかどうか
    try {
      const savedCode = localStorage.getItem("pocopoco_parentCode");
      if (savedCode) {
        setHasParentCode(true);
        setParentCode(savedCode);
      }
    } catch {}
    // 子ども一覧を読む
    try {
      const rawChildren = localStorage.getItem("pocopoco_children");
      if (rawChildren) {
        const arr = JSON.parse(rawChildren);
        if (Array.isArray(arr)) setChildren(arr);
      }
    } catch {}
  }, []);

  // 親で入る
  function handleParentLogin() {
    // 親コードが無い家はそのまま親モードにする
    if (!hasParentCode) {
      localStorage.setItem("pocopoco_role", "parent");
      // 編集でも使うフラグも立てておく
      localStorage.setItem("pocopoco_parentAuthed", "yes");
      window.location.href = "/";
      return;
    }

    // コードがある家は入力値と比べる
    if (inputParentCode.trim() === parentCode) {
      localStorage.setItem("pocopoco_role", "parent");
      localStorage.setItem("pocopoco_parentAuthed", "yes");
      setStatus("親としてログインしました。");
      window.location.href = "/";
    } else {
      setStatus("コードがちがいます。");
    }
  }

  // 親コードの新規セット（まだコードがない家で使う）
  function handleSetNewParentCode() {
    const code = inputParentCode.trim();
    if (!/^[0-9]{4}$/.test(code)) {
      setStatus("4けたの数字で入力してください。");
      return;
    }
    localStorage.setItem("pocopoco_parentCode", code);
    localStorage.setItem("pocopoco_role", "parent");
    localStorage.setItem("pocopoco_parentAuthed", "yes");
    setStatus("親コードを設定してログインしました。");
    window.location.href = "/";
  }

  // 子で入る
  function handleChildLogin(childId) {
    // 子で入ったら、表示中の子もこの子に揃える
    localStorage.setItem("pocopoco_role", "child");
    localStorage.setItem("pocopoco_current_child_id", childId);
    setStatus("子どもモードで開きます。");
    window.location.href = "/";
  }

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "460px",
        margin: "0 auto",
        padding: "32px 16px 80px",
      }}
    >
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>
        pocopoco に入る
      </h1>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "18px" }}>
        おうちの人か、こどもかをえらんでください。
      </p>

      {/* 親として入るセクション */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
          👤 おうちの人として入る
        </h2>
        {hasParentCode ? (
          <>
            <p style={{ fontSize: "12px", color: "#777", marginBottom: "6px" }}>
              4けたのひみつコードを入力してください。
            </p>
            <input
              type="password"
              value={inputParentCode}
              onChange={(e) => setInputParentCode(e.target.value)}
              placeholder="1234"
              style={{
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "16px",
                letterSpacing: "0.4em",
                marginBottom: "10px",
              }}
            />
            <button
              onClick={handleParentLogin}
              style={{
                width: "100%",
                background: "#6a1b9a",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              親としてログイン
            </button>
            <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
              ※ 設定画面の「おとなのひみつコード」と同じです。
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: "12px", color: "#777", marginBottom: "6px" }}>
              まだコードがありません。ここで4けたを決めてください。
            </p>
            <input
              type="password"
              value={inputParentCode}
              onChange={(e) => setInputParentCode(e.target.value)}
              placeholder="1234"
              style={{
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "16px",
                letterSpacing: "0.4em",
                marginBottom: "10px",
              }}
            />
            <button
              onClick={handleSetNewParentCode}
              style={{
                width: "100%",
                background: "linear-gradient(90deg,#cc00ff,#ff6699)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              このコードで親モードをつくる
            </button>
            <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
              あとで設定画面から変えられます。
            </p>
          </>
        )}
      </section>

      {/* 子として入るセクション */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
          🧒 こどもとして入る
        </h2>
        {children.length === 0 ? (
          <p style={{ fontSize: "12px", color: "#777" }}>
            まだこどもがとうろくされていません。親モードで設定から追加してください。
          </p>
        ) : (
          <>
            <p style={{ fontSize: "12px", color: "#777", marginBottom: "10px" }}>
              自分の名前をえらんでください。
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {children.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleChildLogin(ch.id)}
                  style={{
                    border: "1px solid #ccc",
                    background: "#f7f5ff",
                    borderRadius: "999px",
                    padding: "6px 14px",
                    fontSize: "13px",
                  }}
                >
                  {ch.name}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 戻る */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            background: "none",
            border: "none",
            color: "#666",
            fontSize: "13px",
            textDecoration: "underline",
          }}
        >
          ホームにもどる
        </button>
      </div>

      {status && (
        <div
          style={{
            marginTop: "16px",
            fontSize: "12px",
            color: "#4a148c",
            background: "#f5ecff",
            border: "1px solid #e0ccff",
            borderRadius: "8px",
            padding: "6px 10px",
          }}
        >
          {status}
        </div>
      )}
    </main>
  );
}
