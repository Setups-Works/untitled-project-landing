-- Each note can carry its own colour (one of the site's tints). Null = a colour picked from the note id.
alter table public.notes
  add column if not exists color text check (color in ('violet', 'blue', 'green', 'amber', 'clay', 'sand', 'mint', 'gold'));
