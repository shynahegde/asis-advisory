-- TechRescue Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  phone text not null unique,
  name text,
  role text not null default 'customer' check (role in ('customer', 'technician')),
  notification_preference text not null default 'sms' check (notification_preference in ('sms', 'whatsapp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TICKETS TABLE
-- ============================================================
create table if not exists public.tickets (
  id text primary key, -- TKT-XXXXXX format
  customer_id uuid not null references public.users(id) on delete cascade,
  technician_id uuid references public.users(id) on delete set null,
  title text not null,
  description text not null,
  device_type text not null check (device_type in ('Desktop', 'Laptop', 'Phone', 'Tablet', 'Smart Home', 'Network', 'Other')),
  os text,
  status text not null default 'submitted' check (status in ('submitted', 'triaging', 'assigned', 'in_progress', 'resolved')),
  severity text check (severity in ('remote', 'onsite')),
  ai_summary text,
  ai_first_steps jsonb,
  ai_estimated_time text,
  technician_notes text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ============================================================
-- NOTIFICATIONS LOG TABLE
-- ============================================================
create table if not exists public.notifications_log (
  id uuid primary key default uuid_generate_v4(),
  ticket_id text references public.tickets(id) on delete cascade,
  recipient_phone text not null,
  channel text not null check (channel in ('sms', 'whatsapp')),
  message text not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent' check (status in ('sent', 'failed', 'pending'))
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_tickets_customer_id on public.tickets(customer_id);
create index if not exists idx_tickets_technician_id on public.tickets(technician_id);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_severity on public.tickets(severity);
create index if not exists idx_tickets_created_at on public.tickets(created_at desc);
create index if not exists idx_notifications_ticket_id on public.notifications_log(ticket_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger handle_tickets_updated_at
  before update on public.tickets
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.tickets enable row level security;
alter table public.notifications_log enable row level security;

-- Users: each user can see/update their own row; technicians can see all
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Technicians can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'technician'
    )
  );

-- Tickets: customers see only their own; technicians see all
create policy "Customers can view own tickets"
  on public.tickets for select
  using (customer_id = auth.uid());

create policy "Customers can insert own tickets"
  on public.tickets for insert
  with check (customer_id = auth.uid());

create policy "Technicians can view all tickets"
  on public.tickets for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'technician'
    )
  );

create policy "Technicians can update tickets"
  on public.tickets for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'technician'
    )
  );

-- Service role can do everything (used by API routes)
-- This is handled automatically by using the service role key

-- Notifications: technicians can view; service role inserts
create policy "Technicians can view notifications"
  on public.notifications_log for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'technician'
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable realtime for tickets table
alter publication supabase_realtime add table public.tickets;
