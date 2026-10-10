"use client";

import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faPlus, faListCheck, faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import type { CalendarViewMode } from "../types";

export default function CalendarHeader({
  currentDate,
  viewMode,
  showTasksLayer,
  onViewChange,
  onToggleTasks,
  onToday,
  onPrev,
  onNext,
  onNewEvent,
}: {
  currentDate: Date;
  viewMode: CalendarViewMode;
  showTasksLayer: boolean;
  onViewChange: (mode: CalendarViewMode) => void;
  onToggleTasks: () => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNewEvent: () => void;
}) {
  const monthYearLabel = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const views: { id: CalendarViewMode; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "day", label: "Day" },
    { id: "agenda", label: "Agenda" },
  ];

  return (
    <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Title & Navigation */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-serif text-fg">{monthYearLabel}</h1>

        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous period"
            className="flex h-8 w-8 items-center justify-center rounded-pill text-fg-muted hover:bg-surface-sunken hover:text-fg focus:outline-none"
          >
            <FA icon={faChevronLeft} className="text-xs" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-pill border border-line bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:bg-surface-sunken focus:outline-none"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next period"
            className="flex h-8 w-8 items-center justify-center rounded-pill text-fg-muted hover:bg-surface-sunken hover:text-fg focus:outline-none"
          >
            <FA icon={faChevronRight} className="text-xs" />
          </button>
        </div>
      </div>

      {/* Controls: Mode switcher + Tasks toggle + New Event */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View mode pill switcher */}
        <div
          role="tablist"
          aria-label="Calendar view"
          className="flex items-center rounded-pill border border-line bg-surface-muted/40 p-0.5"
        >
          {views.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={viewMode === v.id}
              onClick={() => onViewChange(v.id)}
              className={`rounded-pill px-3 py-1 text-xs font-medium transition-all ${
                viewMode === v.id ? "bg-surface text-fg shadow-e1" : "text-fg-muted hover:text-fg"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Tasks layer toggle */}
        <button
          type="button"
          aria-pressed={showTasksLayer}
          onClick={onToggleTasks}
          title="Toggle Tasks with due dates"
          className={`flex items-center gap-1.5 rounded-pill border border-line px-3 py-1 text-xs font-medium transition-colors ${
            showTasksLayer ? "bg-amber-bg/15 border-amber-fg/30 text-amber-fg" : "bg-surface text-fg-muted hover:text-fg"
          }`}
        >
          <FA icon={faListCheck} className="text-[11px]" />
          <span className="hidden sm:inline">Tasks</span>
        </button>

        {/* New event button */}
        <button
          type="button"
          onClick={onNewEvent}
          className="flex items-center gap-1.5 rounded-pill bg-fg px-3.5 py-1 text-xs font-medium text-surface shadow-e1 hover:opacity-90"
        >
          <FA icon={faPlus} className="text-[10px]" />
          <span>New event</span>
        </button>
      </div>
    </header>
  );
}
