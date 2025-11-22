"use client";

import { useEffect, useState } from "react";
import { useHistoryPageLogic } from "./historyHooks";
import {
  HistoryHeader,
  HistoryChildSelector,
  HistoryFilterSection,
  HistoryGraphCard,
  HistorySummaryCard,
  HistoryListSection,
  CsvHiddenInput,
  TaskSelectorModal,
} from "./HistoryComponents";
import { getLangFromStorage } from "../lib/i18n";

export default function HistoryPage() {
  const [lang, setLang] = useState("jp");

  useEffect(() => {
    setLang(getLangFromStorage());
  }, []);

  const {
    // state
    records,
    summary,
    taskDict,
    songsDict,
    children,
    currentChildId,
    setCurrentChildId,
    role,
    availableTasks,
    selectedTaskIds,
    setSelectedTaskIds,
    isTaskSelectorOpen,
    setIsTaskSelectorOpen,
    periodType,
    setPeriodType,
    fileInputRef,
    // derived
    decoratedList,
    chartData,
    // handlers
    handleEditClick,
    handleExportCsv,
    handleImportClick,
    handleImportChange,
  } = useHistoryPageLogic();

  return (
    <main
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "24px 16px 80px",
        maxWidth: "500px",
        margin: "0 auto",
        backgroundColor: "#f7f0ff",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <HistoryHeader role={role} lang={lang} />

      <HistoryChildSelector
        role={role}
        childrenList={children}
        currentChildId={currentChildId}
        setCurrentChildId={setCurrentChildId}
      />

      <HistoryFilterSection
        selectedTaskIds={selectedTaskIds}
        availableTasks={availableTasks}
        setIsTaskSelectorOpen={setIsTaskSelectorOpen}
        handleExportCsv={handleExportCsv}
        handleImportClick={handleImportClick}
        periodType={periodType}
        setPeriodType={setPeriodType}
        lang={lang}
      />

      <HistoryGraphCard chartData={chartData} lang={lang} />

      <HistorySummaryCard summary={summary} lang={lang} />

      <HistoryListSection
        role={role}
        currentChildId={currentChildId}
        childrenList={children}
        decoratedList={decoratedList}
        taskDict={taskDict}
        songsDict={songsDict}
        onEditClick={handleEditClick}
        lang={lang}
      />

      {/* 「ホームにもどる」ボタンは仕様どおり削除 */}

      <CsvHiddenInput
        fileInputRef={fileInputRef}
        handleImportChange={handleImportChange}
      />

      <TaskSelectorModal
        isOpen={isTaskSelectorOpen}
        onClose={() => setIsTaskSelectorOpen(false)}
        availableTasks={availableTasks}
        selectedTaskIds={selectedTaskIds}
        setSelectedTaskIds={setSelectedTaskIds}
      />
    </main>
  );
}
