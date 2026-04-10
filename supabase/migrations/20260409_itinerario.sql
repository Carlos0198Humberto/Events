-- ─────────────────────────────────────────────────────────────
--  Módulo: Programa del evento (itinerario)
--  Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

create table if not exists itinerario (
  id          uuid default gen_random_uuid() primary key,
  evento_id   uuid not null references eventos(id) on delete cascade,
  hora        text,               -- "18:00" — puede ser nulo
  titulo      text not null,
  descripcion text,
  icono       text default '✨',   -- emoji del ítem
  orden       integer default 0,
  created_at  timestamptz default now()
);

create index if not exists idx_itinerario_evento_id on itinerario(evento_id);

-- RLS: solo el dueño del evento puede gestionar su itinerario
alter table itinerario enable row level security;

-- Política de inserción/modificación (autenticados)
create policy "itinerario_owner_all"
  on itinerario for all
  using (
    evento_id in (
      select id from eventos where user_id = auth.uid()
    )
  );

-- Política de lectura pública (los invitados necesitan verlo)
create policy "itinerario_public_read"
  on itinerario for select
  using (true);
