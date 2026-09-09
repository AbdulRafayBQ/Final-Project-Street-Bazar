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
  address text, city text, sale jsonb, owner_phone text, cnic text, cnic_front text, cnic_back text, personal_address text,
  status text default 'pending',
  rating numeric default 0, created_at timestamptz default now()
);
alter table stores add column if not exists owner_phone text;
alter table stores add column if not exists cnic text;
alter table stores add column if not exists personal_address text;
alter table stores add column if not exists cnic_front text;
alter table stores add column if not exists cnic_back text;

-- Run this migration after the table already exists so REST schema cache is refreshed.
notify pgrst, 'reload schema';

create table if not exists products (
  id text primary key, store_id text references stores(id), title text,
  description text, price numeric, compare_at numeric, media jsonb,
  categories text[], tags text[], stock int default 0, sku text,
  sale jsonb, customizable jsonb, wholesale jsonb, delivery_charge numeric default 0, sales int default 0,
  status text default 'active', created_at timestamptz default now()
);
alter table products add column if not exists delivery_charge numeric default 0;
alter table products add column if not exists sale jsonb;

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
  read boolean default false,
  read_by_owner boolean default false,
  read_by_customer boolean default false,
  updated_at timestamptz default now()
);
alter table threads add column if not exists read boolean default false;
alter table threads add column if not exists read_by_owner boolean default false;
alter table threads add column if not exists read_by_customer boolean default false;

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

create table if not exists warehouse_items (
  id text primary key,
  owner_id uuid references users(id),
  name text not null,
  qty int not null default 0,
  sku text,
  cost numeric default 0,
  location text,
  image_url text,
  updated_at timestamptz default now()
);
alter table warehouse_items add column if not exists image_url text;

create table if not exists app_state (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists deletion_logs (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  item_id text not null,
  item_name text not null,
  owner_id uuid references users(id),
  reason text not null,
  deleted_by uuid references users(id),
  deleted_at timestamptz default now()
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
alter table warehouse_items enable row level security;
alter table app_state enable row level security;
alter table deletion_logs enable row level security;

-- Optional one-time fresh-start reset. Run manually in Supabase SQL Editor.
-- This removes marketplace data but keeps authentication accounts.
-- delete from app_state;
-- delete from warehouse_items;
-- delete from cart_items;
-- delete from saved_products;
-- delete from threads;
-- delete from follows;
-- delete from reviews;
-- delete from orders;
-- delete from products;
-- delete from stores;
