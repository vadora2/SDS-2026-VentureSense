-- Venture Sense Group Buy Prototype Schema
-- Suitable as a starting point for Supabase/PostgreSQL.

create table group_buys (
  id text primary key,
  title text not null,
  status text not null check (status in ('draft', 'active', 'closed', 'fulfilled', 'cancelled')),
  cutoff_at timestamptz not null,
  collection_slot text not null,
  location text not null,
  minimum_order_note text,
  payment_note text,
  order_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table products (
  id text primary key,
  sku text not null unique,
  name text not null,
  category text not null,
  unit text not null,
  price numeric(10, 2) not null,
  emoji text,
  stock_note text,
  min_qty integer default 1,
  max_qty integer default 99,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table buyers (
  id text primary key,
  name text not null,
  phone text not null,
  address text,
  collection_preference text not null check (collection_preference in ('collection', 'delivery')),
  notes text,
  created_at timestamptz default now()
);

create table orders (
  id text primary key,
  group_buy_id text references group_buys(id),
  buyer_id text references buyers(id),
  order_status text not null default 'pending' check (order_status in ('pending', 'confirmed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'payment_sent', 'paid', 'refunded')),
  fulfillment_status text not null default 'not_packed' check (fulfillment_status in ('not_packed', 'packed', 'collected', 'delivered')),
  subtotal numeric(10, 2) not null default 0,
  discount numeric(10, 2) default 0,
  final_total numeric(10, 2),
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id text primary key,
  order_id text references orders(id),
  product_id text references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null,
  substitution_preference text not null check (substitution_preference in ('allow_substitute', 'contact_first', 'refund_item')),
  item_status text not null default 'pending' check (item_status in ('pending', 'confirmed', 'substituted', 'refunded', 'cancelled'))
);

create table payments (
  id text primary key,
  order_id text references orders(id),
  payment_method text,
  payment_link text,
  amount numeric(10, 2) not null,
  paid_at timestamptz,
  refund_status text default 'none',
  payment_notes text
);

create table fulfillment (
  id text primary key,
  order_id text references orders(id),
  packed_status text not null default 'not_packed',
  collected_status text not null default 'not_collected',
  delivered_status text not null default 'not_delivered',
  delivery_batch_id text,
  exception_notes text,
  updated_at timestamptz default now()
);
