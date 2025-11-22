'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function EditSessionPage() {
  return (
    <Suspense fallback={<p>読み込み中…</p>}>
      <EditSessionInner />
    </Suspense>
  )
}

function EditSessionInner() {
  const searchParams = useSearchParams()
  const idStr = searchParams.get('id')
  const index = idStr ? parseInt(idStr, 10) : null

  const [taskId, setTaskId] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [minutes, setMinutes] = useState('')
  const [count, setCount] = useState('')
  const [memo, setMemo] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [taskList, setTaskList] = useState([])
  const [adminCodeInput, setAdminCodeInput] = useState('')
  const [requiredCode, setRequiredCode] = useState('1234')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // ひみつコード
    try {
      const stored = localStorage.getItem('pocopoco_parentCode')
      if (stored && /^[0-9]{4}$/.test(stored)) setRequiredCode(stored)
    } catch {}

    // タスク一覧
    try {
      const raw = localStorage.getItem('pocopoco_tasks')
      if (raw) {
        const list = JSON.parse(raw)
        if (Array.isArray(list)) setTaskList(list)
      }
    } catch (e) {
      console.warn('タスクリスト読み込み失敗', e)
    }

    // 編集対象レコード
    try {
      const rawHist = localStorage.getItem('pocopoco_history')
      if (!rawHist) {
        setLoaded(true)
        return
      }
      const arr = JSON.parse(rawHist)
      const rec = arr[index]
      if (!rec) {
        setLoaded(true)
        return
      }

      if (rec.task_id) setTaskId(rec.task_id)
      if (rec.task_title) setTaskTitle(rec.task_title)
      if (rec.task) setTaskTitle(rec.task)

      setMinutes(String(Math.floor((rec.seconds || 0) / 60)))
      setCount(String(rec.count ?? 0))
      setMemo(rec.memo || '')
      setStartedAt(rec.startedAt || '')
    } catch (e) {
      console.error('edit load error', e)
    } finally {
      setLoaded(true)
    }
  }, [index])

  function handleSave() {
    if (adminCodeInput !== requiredCode) {
      alert('ひみつコードがちがいます。')
      return
    }

    try {
      const raw = localStorage.getItem('pocopoco_history')
      if (!raw) return alert('元データが見つかりません。')
      const arr = JSON.parse(raw)
      if (!arr[index]) return alert('記録が見つかりません。')

      const secs = parseInt(minutes || '0', 10) * 60
      const countNum = parseInt(count || '0', 10)

      arr[index] = {
        ...arr[index],
        task_id: taskId || arr[index].task_id || '',
        task_title:
          taskTitle ||
          (taskList.find((t) => t.id === taskId)?.label ??
            arr[index].task_title) ||
          '',
        seconds: secs,
        count: countNum,
        memo,
        startedAt: startedAt || arr[index].startedAt,
      }

      localStorage.setItem('pocopoco_history', JSON.stringify(arr))
      alert('更新しました。')
      window.location.href = '/history'
    } catch (e) {
      console.error('save error', e)
      alert('保存に失敗しました。')
    }
  }

  function handleDelete() {
    if (adminCodeInput !== requiredCode) {
      alert('ひみつコードがちがいます。')
      return
    }
    try {
      const raw = localStorage.getItem('pocopoco_history')
      if (!raw) return
      const arr = JSON.parse(raw)
      if (!arr[index]) return alert('この記録は見つかりません。')

      arr.splice(index, 1)
      localStorage.setItem('pocopoco_history', JSON.stringify(arr))
      alert('この記録を削除しました。')
      window.location.href = '/history'
    } catch (e) {
      console.error('delete error', e)
      alert('削除に失敗しました。')
    }
  }

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '24px 16px 80px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
        記録の編集
      </h1>

      {!loaded ? (
        <p>読み込み中…</p>
      ) : index === null || isNaN(index) ? (
        <p style={{ color: '#c00' }}>
          記録がみつかりません（URLに ?id=数字 が必要です）
        </p>
      ) : (
        <>
          <section style={sectionStyle}>
            <label style={labelStyle}>タスク名</label>
            <select
              value={taskId}
              onChange={(e) => {
                setTaskId(e.target.value)
                const t = taskList.find((tt) => tt.id === e.target.value)
                setTaskTitle(t?.label || '')
              }}
              style={inputStyle}
            >
              <option value="">（えらんでください）</option>
              {taskList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon || '🎵'} {t.label}
                </option>
              ))}
            </select>
          </section>

          <section style={sectionStyle}>
            <label style={labelStyle}>時間（分）</label>
            <input
              type="number"
              value={minutes}
              min={0}
              onChange={(e) => setMinutes(e.target.value)}
              style={inputStyle}
            />
          </section>

          <section style={sectionStyle}>
            <label style={labelStyle}>回数</label>
            <input
              type="number"
              value={count}
              min={0}
              onChange={(e) => setCount(e.target.value)}
              style={inputStyle}
            />
          </section>

          <section style={sectionStyle}>
            <label style={labelStyle}>メモ</label>
            <textarea
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.4 }}
            />
          </section>

          <section style={sectionStyle}>
            <label style={{ ...labelStyle, color: '#c00' }}>
              おとなのひみつコード（4けた）
            </label>
            <input
              type="password"
              value={adminCodeInput}
              onChange={(e) => setAdminCodeInput(e.target.value)}
              placeholder="****"
              style={{
                ...inputStyle,
                fontSize: '16px',
                letterSpacing: '0.3em',
              }}
            />
          </section>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <button onClick={handleSave} style={saveBtnStyle}>
              💾 ほぞん
            </button>
            <button onClick={handleDelete} style={delBtnStyle}>
              🗑 けす
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => (window.location.href = '/history')}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                textDecoration: 'underline',
                fontSize: '14px',
              }}
            >
              ← 履歴にもどる
            </button>
          </div>
        </>
      )}
    </main>
  )
}

const sectionStyle = {
  border: '1px solid #ddd',
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '4px',
}

const inputStyle = {
  width: '100%',
  border: '1px solid #bbb',
  borderRadius: '8px',
  fontSize: '14px',
  padding: '8px 10px',
  backgroundColor: '#fff',
}

const saveBtnStyle = {
  background: 'linear-gradient(90deg, rgb(204,0,255), rgb(255,102,153))',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
}

const delBtnStyle = {
  backgroundColor: '#aaa',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px',
}
