-- HARD RESET OF ALL POLICIES

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.businesses          ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.business_products   ENABLE ROW LEVEL SECURITY;



-- DROP ALL POLICIES

DO $$

DECLARE r RECORD;

BEGIN

  FOR r IN

    SELECT tablename FROM pg_tables WHERE schemaname='public'

  LOOP

    EXECUTE format('DROP POLICY IF EXISTS ALL ON public.%I', r.tablename);

  END LOOP;

END $$;



-- PUBLIC READ ACCESS FOR EVERYTHING:

CREATE POLICY "public_read" ON public.businesses        FOR SELECT USING (true);

CREATE POLICY "public_read" ON public.categories        FOR SELECT USING (true);

CREATE POLICY "public_read" ON public.products          FOR SELECT USING (true);

CREATE POLICY "public_read" ON public.business_products FOR SELECT USING (true);

CREATE POLICY "public_read_profiles" ON public.profiles FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id);



-- USERS CAN UPDATE ONLY THEIR PROFILE

CREATE POLICY "user_update_profile" ON public.profiles

  FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id)

  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);



-- ADMINS HAVE FULL ACCESS

CREATE POLICY "admin_full" ON public.profiles            FOR ALL USING (is_admin OR role='admin');

CREATE POLICY "admin_full" ON public.businesses          FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND (p.is_admin OR p.role='admin')));

CREATE POLICY "admin_full" ON public.categories          FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND (p.is_admin OR p.role='admin')));

CREATE POLICY "admin_full" ON public.products            FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND (p.is_admin OR p.role='admin')));

CREATE POLICY "admin_full" ON public.business_products   FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND (p.is_admin OR p.role='admin')));


