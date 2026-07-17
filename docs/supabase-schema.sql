-- 給料計算アプリ クラウドDB(Supabase/PostgreSQL)スキーマ
-- SQL Editor で一度実行すればテーブルが作成される。
-- データ本体は各テーブルの data (jsonb) に格納される。

create table if not exists people (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists salary_records (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table people enable row level security;
alter table salary_records enable row level security;

create policy "app_all_people" on people
  for all to anon using (true) with check (true);

create policy "app_all_records" on salary_records
  for all to anon using (true) with check (true);
