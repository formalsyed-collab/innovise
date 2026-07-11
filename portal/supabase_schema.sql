-- =====================================================================
-- DATABASE SCHEMA & ROW LEVEL SECURITY FOR INNOVISE CONSULTANT PORTAL
-- =====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Define Enums
create type public.user_role as enum ('client', 'admin');
create type public.service_status as enum ('consultation', 'docs_pending', 'in_progress', 'filed', 'completed');
create type public.doc_status as enum ('submitted', 'verified', 'pending');
create type public.doc_uploader as enum ('client', 'admin');
create type public.invoice_status as enum ('paid', 'pending', 'partial');

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text unique,
  phone text,
  address text,
  role public.user_role not null default 'client',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- 2. Services Table
create table public.services (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  service_name text not null,
  status public.service_status not null default 'consultation',
  start_date date not null default current_date,
  expected_completion date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Services
alter table public.services enable row level security;

-- 3. Documents Table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  file_name text not null,
  storage_path text not null, -- format: "client_id/uuid-filename"
  doc_type text,
  status public.doc_status not null default 'submitted',
  uploaded_by public.doc_uploader not null default 'client',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Documents
alter table public.documents enable row level security;

-- 4. Document Requests Table
create table public.document_requests (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  description text,
  fulfilled boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Document Requests
alter table public.document_requests enable row level security;

-- 5. Invoices Table
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  professional_fees numeric(12, 2) not null default 0.00,
  government_fees numeric(12, 2) not null default 0.00,
  total numeric(12, 2) not null default 0.00,
  status public.invoice_status not null default 'pending',
  due_date date not null,
  paid_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Invoices
alter table public.invoices enable row level security;


-- =====================================================================
-- FUNCTIONS AND TRIGGERS (SECURITY DEFINER PATTERNS)
-- =====================================================================

-- Security Definer function to get a user's role without recursion
create or replace function public.get_user_role(user_id uuid)
returns public.user_role as $$
declare
  user_role_val public.user_role;
begin
  select role into user_role_val from public.profiles where id = user_id;
  return coalesce(user_role_val, 'client'::public.user_role);
end;
$$ language plpgsql security definer;

-- Trigger to automatically create a profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone, address, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Client Name'),
    new.email,
    coalesce(new.phone, new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'address', ''),
    'client'::public.user_role -- Force role to client for security (admins are elevated via SQL)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Bind the trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- --- Profiles Policies ---
create policy "Allow select profiles for owner or admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.get_user_role(auth.uid()) = 'admin');

create policy "Allow admin to insert profiles"
  on public.profiles for insert
  to authenticated
  with check (public.get_user_role(auth.uid()) = 'admin');

create policy "Allow update profiles for owner or admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.get_user_role(auth.uid()) = 'admin')
  with check (
    public.get_user_role(auth.uid()) = 'admin' or 
    (id = auth.uid() and role = 'client') -- Clients cannot escalate their role
  );

create policy "Allow admin to delete profiles"
  on public.profiles for delete
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');


-- --- Services Policies ---
create policy "Allow select services for owner or admin"
  on public.services for select
  to authenticated
  using (client_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin');

create policy "Allow admin all access on services"
  on public.services for all
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');


-- --- Documents Policies ---
create policy "Allow select documents for owner or admin"
  on public.documents for select
  to authenticated
  using (client_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin');

create policy "Allow insert documents for owner or admin"
  on public.documents for insert
  to authenticated
  with check (
    (client_id = auth.uid() and uploaded_by = 'client'::public.doc_uploader) or 
    public.get_user_role(auth.uid()) = 'admin'
  );

create policy "Allow admin full update/delete access on documents"
  on public.documents for all
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');


-- --- Document Requests Policies ---
create policy "Allow select document_requests for owner or admin"
  on public.document_requests for select
  to authenticated
  using (client_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin');

create policy "Allow owner update (fulfillment) or admin all access on document_requests"
  on public.document_requests for update
  to authenticated
  using (client_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin')
  with check (
    public.get_user_role(auth.uid()) = 'admin' or 
    (client_id = auth.uid() and fulfilled = true)
  );

create policy "Allow admin all access on document_requests"
  on public.document_requests for all
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');


-- --- Invoices Policies ---
create policy "Allow select invoices for owner or admin"
  on public.invoices for select
  to authenticated
  using (client_id = auth.uid() or public.get_user_role(auth.uid()) = 'admin');

create policy "Allow admin all access on invoices"
  on public.invoices for all
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');


-- =====================================================================
-- STORAGE BUCKETS AND STORAGE POLICIES
-- =====================================================================

-- Note: In Supabase, bucket creation is usually done through the dashboard
-- or storage.buckets API. Below are the insert statements and RLS policies
-- that must be configured on the storage schema.

-- Add a row to storage.buckets for the private 'documents' bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];

-- RLS policies for storage.objects
create policy "Allow client and admin read access to private storage folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents' and 
    (
      public.get_user_role(auth.uid()) = 'admin' or 
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Allow client and admin upload access to private storage folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents' and 
    (
      public.get_user_role(auth.uid()) = 'admin' or 
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Allow client and admin update access to private storage folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'documents' and 
    (
      public.get_user_role(auth.uid()) = 'admin' or 
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Allow admin delete access to private storage folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents' and 
    public.get_user_role(auth.uid()) = 'admin'
  );

-- =====================================================================
-- WHATSAPP INTEGRATION TABLES
-- =====================================================================

-- Enums
create type public.whatsapp_conversation_status as enum ('bot', 'human_requested', 'human_active');
create type public.whatsapp_message_sender as enum ('user', 'bot', 'admin');

-- 1. WhatsApp Conversations Table
create table public.whatsapp_conversations (
  id uuid default gen_random_uuid() primary key,
  phone_number text not null unique,
  profile_id uuid references public.profiles(id) on delete set null,
  status public.whatsapp_conversation_status not null default 'bot',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for WhatsApp Conversations
alter table public.whatsapp_conversations enable row level security;

-- 2. WhatsApp Messages Table
create table public.whatsapp_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.whatsapp_conversations(id) on delete cascade not null,
  sender public.whatsapp_message_sender not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for WhatsApp Messages
alter table public.whatsapp_messages enable row level security;

-- --- WhatsApp Conversations Policies ---
create policy "Allow admin all access on whatsapp_conversations"
  on public.whatsapp_conversations for all
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');

-- --- WhatsApp Messages Policies ---
create policy "Allow admin all access on whatsapp_messages"
  on public.whatsapp_messages for all
  to authenticated
  using (public.get_user_role(auth.uid()) = 'admin');
