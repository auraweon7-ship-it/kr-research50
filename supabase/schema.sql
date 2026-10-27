-- 연구진 공유 저장소. Supabase SQL 편집기에서 한 번 실행한 뒤,
-- assets/config.js 의 SUPABASE_URL 과 SUPABASE_ANON_KEY 를 채우면 플랫폼이 이 표로 동기화한다.
--
-- 한 행이 한 종류의 상태다: status(검증 단계), evidence(근거 패키지), review(선정위 심의),
-- interviews(인터뷰), imported(가져온 데이터), linked(데이터 검색 결과를 성과·연구자 항목에 연결한 자료).

create table if not exists public.nrf50_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.nrf50_state enable row level security;

-- 주의: 아래 정책은 anon 키를 가진 누구나 읽고 쓸 수 있게 한다.
-- anon 키는 브라우저에 노출되므로, 주소가 알려진 공개 배포에서는 그대로 쓰면 안 된다.
-- 실제 운영에서는 Supabase Auth 로 연구진 로그인을 붙이고 정책의 대상을 authenticated 로 바꿔야 한다.
create policy "nrf50_state read"   on public.nrf50_state for select using (true);
create policy "nrf50_state insert" on public.nrf50_state for insert with check (true);
create policy "nrf50_state update" on public.nrf50_state for update using (true) with check (true);
