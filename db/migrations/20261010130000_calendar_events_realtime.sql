-- Realtime for the Calendar: emit a change notification (table + owner, never row content) so open tabs refresh when an event
-- is created, edited or deleted elsewhere. Same trigger the other workspace tables use (see 20261007080000_realtime.sql).

drop trigger if exists calendar_events_notify on public.calendar_events;
create trigger calendar_events_notify
  after insert or update or delete on public.calendar_events
  for each row execute function public.notify_row_change();
