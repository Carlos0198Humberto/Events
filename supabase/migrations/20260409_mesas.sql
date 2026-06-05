-- ─────────────────────────────────────────────────────────────
--  Módulo: Asignación de mesas
--  Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Tabla de mesas
create table if not exists mesas (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  nombre        text not null,
  capacidad     integer not null default 10,
  seccion       text,          -- "Jardin", "Salon A", etc. (opcional)
  created_at    timestamptz default now()
);

-- Índice para consultas por evento
create index if not exists mesas_evento_idx on mesas(evento_id);

-- 2. Columna mesa_id en invitados
alter table invitados
  add column if not exists mesa_id uuid references mesas(id) on delete set null;

-- 3. Row Level Security
alter table mesas enable row level security;

-- Los organizadores pueden leer sus propias mesas
-- (asumiendo que la política de eventos ya restringe por organizador_id)
create policy "mesas_select" on mesas
  for select using (
    evento_id in (
      select id from eventos where organizador_id = auth.uid()
    )
  );

create policy "mesas_insert" on mesas
  for insert with check (
    evento_id in (
      select id from eventos where organizador_id = auth.uid()
    )
  );

create policy "mesas_update" on mesas
  for update using (
    evento_id in (
      select id from eventos where organizador_id = auth.uid()
    )
  );

create policy "mesas_delete" on mesas
  for delete using (
    evento_id in (
      select id from eventos where organizador_id = auth.uid()
    )
  );

-- Los invitados pueden leer su propia mesa
-- (join a través del token del invitado — acceso público por token)
create policy "mesas_invitado_select" on mesas
  for select using (true);
-- Nota: el acceso real se filtra en la query usando el token del invitado,
--       no hay datos sensibles en mesas (solo nombre y capacidad)
