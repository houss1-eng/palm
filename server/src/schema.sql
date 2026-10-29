-- Palm Beauty Centre — schéma PostgreSQL.
-- Exécuté automatiquement au démarrage du serveur (sans effacer les données).

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  password_hash text not null,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

-- Catalogue (services, prix, paramètres) stocké en JSON sous la clé 'catalog'.
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  name text not null,
  phone text not null,
  date date not null,
  time text not null,
  note text not null default '',
  services jsonb not null default '[]',
  total numeric not null default 0,
  status text not null default 'nouveau'
    check (status in ('nouveau', 'confirmé', 'terminé', 'annulé')),
  lang text not null default 'fr',
  created_at timestamptz not null default now()
);

create index if not exists bookings_date_idx on bookings (date, time);
create index if not exists bookings_user_idx on bookings (user_id);

-- Abonnements aux notifications Web Push : un par appareil/navigateur.
drop table if exists push_tokens; -- ancienne table, remplacée par push_subscriptions
create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references users (id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);

-- Photos des services ajoutées depuis l'admin (stockées en base : elles
-- survivent aux redéploiements, contrairement aux fichiers sur disque).
create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  mime text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);
