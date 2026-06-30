-- =====================================================================
-- DATABASE SEED DATA FOR INNOVISE CONSULTANT PORTAL
-- =====================================================================

-- Enable pgcrypto extension if not already enabled
create extension if not exists pgcrypto;

-- 1. Insert Demo Admin User (email: officialtaxinn@gmail.com, phone: +919506166560, password: password123)
-- Trigger "on_auth_user_created" will automatically insert a profile row.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  phone,
  phone_confirmed_at,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'officialtaxinn@gmail.com',
  '+919506166560',
  now(),
  crypt('password123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email","phone"]}',
  '{"full_name":"Innovise Admin Staff","phone":"+919506166560","role":"admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- Ensure role is strictly set to 'admin' in profiles
update public.profiles 
set role = 'admin' 
where id = '11111111-1111-1111-1111-111111111111';


-- 2. Insert Demo Client User (email: client@innovise.in, password: password123)
-- Trigger "on_auth_user_created" will automatically insert a profile row.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  phone,
  phone_confirmed_at,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'client@innovise.in',
  '+919876543210',
  now(),
  crypt('password123', gen_salt('bf', 10)),
  now(),
  '{"provider":"phone","providers":["phone"]}',
  '{"full_name":"Acme Corporate Solutions","phone":"+919876543210","address":"12, Industrial Area, Kanpur, UP","role":"client"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;


-- 3. Seed Services for Client (Acme Corporate Solutions)
insert into public.services (id, client_id, service_name, status, start_date, expected_completion, notes)
values 
  (
    '33333333-3333-3333-3333-333333333333', 
    '22222222-2222-2222-2222-222222222222', 
    'Pvt Ltd Company Registration', 
    'in_progress', 
    current_date - 10, 
    current_date + 5, 
    'Incorporation paperwork has been submitted to ROC. Waiting for approval.'
  ),
  (
    '44444444-4444-4444-4444-444444444444', 
    '22222222-2222-2222-2222-222222222222', 
    'GST Registration & Onboarding', 
    'docs_pending', 
    current_date - 2, 
    current_date + 8, 
    'Filing cannot proceed. Please upload your office electricity utility bill as address proof.'
  )
on conflict (id) do nothing;


-- 4. Seed Invoices for Client (Acme Corporate Solutions)
insert into public.invoices (id, client_id, service_id, description, professional_fees, government_fees, total, status, due_date, paid_date)
values 
  (
    '55555555-5555-5555-5555-555555555555', 
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333', 
    'Pvt Ltd Registration Service Fee & ROC stamp duty charges', 
    6000.00, 
    3500.00, 
    9500.00, 
    'pending', 
    current_date + 7, 
    null
  ),
  (
    '66666666-6666-6666-6666-666666666666', 
    '22222222-2222-2222-2222-222222222222', 
    '44444444-4444-4444-4444-444444444444', 
    'GST Registration Consultation Charges', 
    2500.00, 
    0.00, 
    2500.00, 
    'paid', 
    current_date - 15, 
    current_date - 15
  )
on conflict (id) do nothing;


-- 5. Seed Document Requests Checklist (Acme Corporate Solutions)
insert into public.document_requests (id, client_id, service_id, title, description, fulfilled)
values 
  (
    '77777777-7777-7777-7777-777777777777', 
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333', 
    'Director PAN Card', 
    'Clear scan copy of PAN card for director', 
    true
  ),
  (
    '88888888-8888-8888-8888-888888888888', 
    '22222222-2222-2222-2222-222222222222', 
    '44444444-4444-4444-4444-444444444444', 
    'Electricity Utility Address Proof', 
    'Electricity bill of the registered corporate office address, not older than 2 months', 
    false
  )
on conflict (id) do nothing;


-- 6. Seed Documents (Vault)
insert into public.documents (id, client_id, service_id, file_name, storage_path, doc_type, status, uploaded_by)
values 
  (
    '99999999-9999-9999-9999-999999999999', 
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333', 
    'pan_card_rahul.pdf', 
    '22222222-2222-2222-2222-222222222222/pan_card_rahul.pdf', 
    'Director PAN Card', 
    'verified', 
    'client'
  )
on conflict (id) do nothing;
