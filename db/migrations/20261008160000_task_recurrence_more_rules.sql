-- More repeat rules: every 2 weeks ('biweekly') and the last weekday of the month ('nth:last:fri').
alter table public.tasks drop constraint if exists tasks_recurrence_check;
alter table public.tasks
  add constraint tasks_recurrence_check check (
    recurrence is null
    or recurrence in ('daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'yearly')
    or recurrence ~ '^nth:([1-4]|last):(sun|mon|tue|wed|thu|fri|sat)$'
  );
