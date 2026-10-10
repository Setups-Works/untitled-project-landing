"use client";

import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faListCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import { CALENDAR_VIEWS, type CalendarViewMode } from "../types";

export default function CalendarHeader({
  title,
  viewMode,
  showTasks,
  onViewChange,
  onToggleTasks,
  onToday,
  onPrev,
  onNext,
  onNewEvent,
}: {
  title: string;
  viewMode: CalendarViewMode;
  showTasks: boolean;
  onViewChange: (mode: CalendarViewMode) => void;
  onToggleTasks: () => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNewEvent: () => void;
}) {
  const round =
    "grid size-[38px] shrink-0 place-items-center rounded-full text-[14px] text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg";
  return (
    <header className="mb-[18px] flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="min-w-0 font-serif text-[clamp(30px,3.4vw,42px)] leading-[1.04] font-normal tracking-[-0.03em] text-balance">
          {title}
        </h1>
        <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={onNewEvent}>
          <FA icon={faPlus} />
          <span>New event</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5">
          <button type="button" className={round} aria-label="Previous period" onClick={onPrev}>
            <FA icon={faChevronLeft} />
          </button>
          <button
            type="button"
            className="glass glass-hover inline-flex h-[38px] items-center rounded-pill px-4 text-[13.5px] transition-[background-color,box-shadow,transform] duration-300 active:scale-95"
            onClick={onToday}
          >
            Today
          </button>
          <button type="button" className={round} aria-label="Next period" onClick={onNext}>
            <FA icon={faChevronRight} />
          </button>
        </div>

        {/* Same white-pill-on-glass look as the section switcher in the top bar. */}
        <Tabs value={viewMode} onValueChange={(v) => onViewChange(v as CalendarViewMode)} className="ml-auto max-sm:ml-0">
          <TabsList aria-label="Calendar view" className="glass inline-flex rounded-pill p-1">
            {CALENDAR_VIEWS.map((v) => (
              <TabsTrigger
                key={v.id}
                value={v.id}
                className="h-[34px] rounded-pill px-3.5 text-[13.5px] text-fg-muted transition-[background-color,color,box-shadow] duration-200 hover:text-fg data-[state=active]:bg-white data-[state=active]:text-fg data-[state=active]:shadow-e1"
              >
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <button
          type="button"
          aria-pressed={showTasks}
          onClick={onToggleTasks}
          title="Show tasks that have a due date"
          className={`inline-flex h-[38px] items-center gap-2 rounded-pill px-3.5 text-[13.5px] transition-[background-color,box-shadow] duration-300 ${
            showTasks ? "at-amber tint" : "glass glass-hover text-fg-muted"
          }`}
        >
          <FA icon={faListCheck} className="text-[12px]" />
          Tasks
        </button>
      </div>
    </header>
  );
}
