-- A repeating to-do without a due date never showed up in any day view and could not advance to its next date.
-- Give those a first date (the day they were created) so they appear and repeat from there.
update public.tasks
set due_date = (created_at at time zone 'utc')::date
where recurrence is not null and due_date is null;
