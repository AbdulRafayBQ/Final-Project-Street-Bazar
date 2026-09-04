create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  phone text,
  role text not null default 'customer',
  seller_status text not null default 'none',
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key,
  name text not null,
  email text unique not null,
  role text not null default 'customer',
  avatar text,
  created_at timestamptz default now()
);

insert into profiles (id, full_name, email)
select id, coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)), email
from auth.users
on conflict (id) do update set email = excluded.email;

create table if not exists stores (
  id text primary key,
  owner_id uuid references users(id),
  name text, slug text unique, tagline text, type text, description text,
  logo text, banner text, theme jsonb, categories text[], socials jsonb,
  address text, city text, sale jsonb, status text default 'pending',
  rating numeric default 0, created_at timestamptz default now()
);

create table if not exists products (
  id text primary key, store_id text references stores(id), title text,
  description text, price numeric, compare_at numeric, media jsonb,
  categories text[], tags text[], stock int default 0, sku text,
  customizable jsonb, wholesale jsonb, sales int default 0,
  status text default 'active', created_at timestamptz default now()
);

create table if not exists reviews (
  id text primary key, product_id text, store_id text, user_id uuid references users(id),
  rating int, text text, created_at timestamptz default now()
);

create table if not exists orders (
  id text primary key, user_id uuid references users(id), items jsonb,
  total numeric, status text, timeline jsonb, eta text, address jsonb,
  store_ids text[], created_at timestamptz default now()
);

create table if not exists follows (
  id text primary key, user_id uuid references users(id), store_id text,
  created_at timestamptz default now()
);

create table if not exists threads (
  id text primary key,
  product_id text,
  store_id text,
  customer_id uuid references users(id),
  messages jsonb,
  updated_at timestamptz default now()
);

create table if not exists cart_items (
  id text primary key, user_id uuid references users(id),
  product_id text, store_id text, title text, image text,
  qty int default 1, options jsonb, unit_price numeric,
  updated_at timestamptz default now()
);

create table if not exists saved_products (
  id text primary key, user_id uuid references users(id),
  product_id text, created_at timestamptz default now()
);

create table if not exists app_state (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table users enable row level security;
alter table profiles enable row level security;
alter table stores enable row level security;
alter table products enable row level security;
alter table reviews enable row level security;
alter table orders enable row level security;
alter table follows enable row level security;
alter table threads enable row level security;
alter table cart_items enable row level security;
alter table saved_products enable row level security;
alter table app_state enable row level security;
