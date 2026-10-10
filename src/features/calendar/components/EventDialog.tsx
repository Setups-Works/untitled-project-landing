"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { CALENDAR_TONES, type CalendarEventItem, type CalendarTone, type EventDraft } from "../types";
import { isoDate } from "../../../lib/dates";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faClock, faLocationDot, faAlignLeft, faTrash, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function EventDialog({
  isOpen,
  event,
  defaultSlot,
  onClose,
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  event: CalendarEventItem | null;
  defaultSlot: { date: string; time?: string } | null;
  onClose: () => void;
  onSave: (draft: EventDraft) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState(isoDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(isoDate());
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState<CalendarTone | string>("blue");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setAllDay(event.all_day);
      const s = new Date(event.start_at);
      const e = new Date(event.end_at);
      setStartDate(isoDate(s));
      setEndDate(isoDate(e));
      setStartTime(`${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`);
      setEndTime(`${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`);
      setColor(event.color || "blue");
      setLocation(event.location || "");
      setDescription(event.description || "");
    } else if (defaultSlot) {
      setTitle("");
      setAllDay(false);
      setStartDate(defaultSlot.date);
      setEndDate(defaultSlot.date);
      const t = defaultSlot.time || "09:00";
      setStartTime(t);
      const [h, m] = t.split(":").map(Number);
      const endH = (h + 1) % 24;
      setEndTime(`${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      setColor("blue");
      setLocation("");
      setDescription("");
    } else {
      const now = new Date();
      setTitle("");
      setAllDay(false);
      setStartDate(isoDate(now));
      setEndDate(isoDate(now));
      setStartTime("09:00");
      setEndTime("10:00");
      setColor("blue");
      setLocation("");
      setDescription("");
    }
    setError(null);
  }, [event, defaultSlot, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        all_day: allDay,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        color,
        location: location.trim(),
        description: description.trim(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save event";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!event || !onDelete) return;
    setBusy(true);
    try {
      await onDelete(event.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete event";
      setError(msg);
      setBusy(false);
    }
  }

  return (
    <Modal label={event ? "Edit Event" : "New Event"} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-base font-medium text-fg">{event ? "Edit event" : "New event"}</h2>
          {event && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              aria-label="Delete event"
              className="flex h-8 w-8 items-center justify-center rounded-pill text-fg-muted hover:bg-clay-bg/20 hover:text-clay-fg"
            >
              <FA icon={faTrash} className="text-xs" />
            </button>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-r1 bg-clay-bg/15 px-3 py-2 text-xs text-clay-fg">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="event-title" className="sr-only">
            Event title
          </label>
          <input
            id="event-title"
            type="text"
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            className="w-full rounded-r1 border border-line bg-surface px-3 py-2 text-sm font-medium text-fg placeholder:text-fg-faint focus:border-line-strong focus:outline-none"
          />
        </div>

        {/* Date and Time */}
        <div className="space-y-3 rounded-r2 border border-line bg-surface-muted/30 p-3">
          <div className="flex items-center justify-between">
            <label htmlFor="event-all-day" className="flex items-center gap-2 text-xs font-medium text-fg">
              <FA icon={faClock} className="text-fg-muted" />
              <span>All-day event</span>
            </label>
            <input
              id="event-all-day"
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-line text-blue-fg focus:ring-0"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <span className="block text-[11px] font-medium text-fg-muted mb-1">Starts</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full rounded-r1 border border-line bg-surface px-2.5 py-1.5 text-xs text-fg focus:outline-none"
                />
                {!allDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-24 rounded-r1 border border-line bg-surface px-2 py-1.5 text-xs text-fg focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-fg-muted mb-1">Ends</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-r1 border border-line bg-surface px-2.5 py-1.5 text-xs text-fg focus:outline-none"
                />
                {!allDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-24 rounded-r1 border border-line bg-surface px-2 py-1.5 text-xs text-fg focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Color / Calendar tint */}
        <div>
          <span className="block text-xs font-medium text-fg-muted mb-1.5">Color tint</span>
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Event color">
            {CALENDAR_TONES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={color === t}
                aria-label={`Color ${t}`}
                onClick={() => setColor(t)}
                className={`relative flex h-7 w-7 items-center justify-center rounded-full border transition-transform ${
                  color === t ? "scale-110 border-fg-strong shadow-e1" : "border-transparent opacity-80 hover:opacity-100"
                } at-${t}`}
              >
                <span className="h-4 w-4 rounded-full bg-current opacity-80" />
                {color === t && (
                  <span className="absolute inset-0 flex items-center justify-center text-fg-strong">
                    <FA icon={faCheck} className="text-[10px]" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FA icon={faLocationDot} className="text-xs text-fg-muted" />
            <label htmlFor="event-location" className="text-xs font-medium text-fg-muted">
              Location
            </label>
          </div>
          <input
            id="event-location"
            type="text"
            placeholder="Room, office, or meet link..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-r1 border border-line bg-surface px-3 py-1.5 text-xs text-fg placeholder:text-fg-faint focus:border-line-strong focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FA icon={faAlignLeft} className="text-xs text-fg-muted" />
            <label htmlFor="event-desc" className="text-xs font-medium text-fg-muted">
              Description & notes
            </label>
          </div>
          <textarea
            id="event-desc"
            rows={3}
            placeholder="Agenda, notes, or details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-r1 border border-line bg-surface px-3 py-1.5 text-xs text-fg placeholder:text-fg-faint focus:border-line-strong focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-line pt-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-pill px-4 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-sunken hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-pill bg-fg px-4 py-1.5 text-xs font-medium text-surface shadow-e1 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving..." : event ? "Save changes" : "Create event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
