"use client";

import { useEffect } from "react";
import { useCalendar } from "../useCalendar";
import ConnectCalendarBanner from "./ConnectCalendarBanner";
import CalendarHeader from "./CalendarHeader";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import AgendaView from "./AgendaView";
import EventDialog from "./EventDialog";

export default function CalendarApp() {
  const {
    currentDate,
    viewMode,
    setViewMode,
    showTasksLayer,
    setShowTasksLayer,
    events,
    tasks,
    loading,
    prefs,
    goToToday,
    goToPrev,
    goToNext,
    dialogOpen,
    editingEvent,
    defaultSlot,
    openNewEvent,
    openEditEvent,
    closeDialog,
    saveEvent,
    deleteEvent,
  } = useCalendar();

  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input, textarea or contenteditable
      const target = e.target as HTMLElement | null;
      if (dialogOpen || target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      switch (e.key) {
        case "t":
        case "T":
          goToToday();
          break;
        case "m":
        case "M":
          setViewMode("month");
          break;
        case "w":
        case "W":
          setViewMode("week");
          break;
        case "d":
        case "D":
          setViewMode("day");
          break;
        case "a":
        case "A":
          setViewMode("agenda");
          break;
        case "ArrowLeft":
          goToPrev();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "c":
        case "n":
          openNewEvent();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, goToToday, goToPrev, goToNext, setViewMode, openNewEvent]);

  // Responsive default: automatically select Agenda view on very narrow screens (e.g. mobile 375px) on first load
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("agenda");
    }
  }, [setViewMode]);

  return (
    <div className="mx-auto max-w-6xl w-full px-3 py-4 sm:px-6 sm:py-6">
      {/* Banner */}
      <ConnectCalendarBanner />

      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        showTasksLayer={showTasksLayer}
        onViewChange={setViewMode}
        onToggleTasks={() => setShowTasksLayer((prev) => !prev)}
        onToday={goToToday}
        onPrev={goToPrev}
        onNext={goToNext}
        onNewEvent={() => openNewEvent()}
      />

      {/* Main View Area */}
      <main className="relative min-h-[480px]">
        {loading && events.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-xs text-fg-muted">Loading calendar...</div>
        ) : viewMode === "month" ? (
          <MonthView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
            showTasksLayer={showTasksLayer}
            weekStart={prefs.weekStart}
            onSelectEvent={openEditEvent}
            onNewEventOnDate={(date) => openNewEvent(date)}
          />
        ) : viewMode === "week" ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
            showTasksLayer={showTasksLayer}
            weekStart={prefs.weekStart}
            onSelectEvent={openEditEvent}
            onNewEventOnSlot={(date, time) => openNewEvent(date, time)}
          />
        ) : viewMode === "day" ? (
          <DayView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
            showTasksLayer={showTasksLayer}
            onSelectEvent={openEditEvent}
            onNewEventOnSlot={(date, time) => openNewEvent(date, time)}
          />
        ) : (
          <AgendaView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
            showTasksLayer={showTasksLayer}
            onSelectEvent={openEditEvent}
            onNewEventOnDate={(date) => openNewEvent(date)}
          />
        )}
      </main>

      {/* Event Dialog */}
      <EventDialog
        isOpen={dialogOpen}
        event={editingEvent}
        defaultSlot={defaultSlot}
        onClose={closeDialog}
        onSave={saveEvent}
        onDelete={editingEvent ? deleteEvent : undefined}
      />
    </div>
  );
}
