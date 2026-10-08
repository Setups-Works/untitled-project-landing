-- Repeating to-dos can now land on "the n-th weekday of every month" (for example the 2nd Wednesday): the rule is stored as
-- `nth:<1-4>:<sun|mon|tue|wed|thu|fri|sat>`, next to the simple rules that already existed.
alter table public.tasks drop constraint if exists tasks_recurrence_check;
alter table public.tasks
  add constraint tasks_recurrence_check check (
    recurrence is null
    or recurrence in ('daily', 'weekdays', 'weekly', 'monthly', 'yearly')
    or recurrence ~ '^nth:[1-4]:(sun|mon|tue|wed|thu|fri|sat)$'
  );
