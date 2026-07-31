-- Migration: Add Agent Portal Features

-- 1. Add 'agent' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'agent';

-- 2. Add 'commission_status' enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_status') THEN
    CREATE TYPE public.commission_status AS ENUM ('pending', 'paid');
  END IF;
END$$;

-- 3. Modify profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_details jsonb;

-- 4. Create commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  status public.commission_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(invoice_id)
);

-- Enable RLS on commissions
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for commissions
CREATE POLICY "Allow select commissions for agent or admin"
  ON public.commissions FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Allow admin to update commissions"
  ON public.commissions FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Allow admin all access on commissions"
  ON public.commissions FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 6. Update existing RLS policies to allow agents to see their referred clients
-- Profiles
CREATE POLICY "Allow agents to view referred clients"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (referred_by = auth.uid());

-- Services
CREATE POLICY "Allow agents to view referred clients' services"
  ON public.services FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE referred_by = auth.uid())
  );

-- Invoices
CREATE POLICY "Allow agents to view referred clients' invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE referred_by = auth.uid())
  );

-- 7. Trigger to auto-calculate commissions on invoice creation/update
CREATE OR REPLACE FUNCTION public.calculate_invoice_commission()
RETURNS trigger AS $$
DECLARE
  agent uuid;
  commission_amt numeric(12, 2);
BEGIN
  -- Check if the client was referred by an agent
  SELECT referred_by INTO agent FROM public.profiles WHERE id = NEW.client_id;
  
  -- If there is a referring agent
  IF agent IS NOT NULL THEN
    -- Calculate 30% of professional fees
    commission_amt := NEW.professional_fees * 0.30;
    
    -- Insert or update commission record
    INSERT INTO public.commissions (agent_id, invoice_id, client_id, amount)
    VALUES (agent, NEW.id, NEW.client_id, commission_amt)
    ON CONFLICT (invoice_id) 
    DO UPDATE SET amount = EXCLUDED.amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to invoices table
DROP TRIGGER IF EXISTS on_invoice_change ON public.invoices;
CREATE TRIGGER on_invoice_change
  AFTER INSERT OR UPDATE OF professional_fees ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_invoice_commission();
