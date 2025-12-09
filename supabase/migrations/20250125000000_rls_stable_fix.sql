-- Ensure public read on categories/products/businesses/business_products

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "public_select" ON public.categories;

DROP POLICY IF EXISTS "public_select" ON public.products;

DROP POLICY IF EXISTS "public_select" ON public.businesses;

DROP POLICY IF EXISTS "public_select" ON public.business_products;



CREATE POLICY "public_select" ON public.categories FOR SELECT USING (true);

CREATE POLICY "public_select" ON public.products FOR SELECT USING (true);

CREATE POLICY "public_select" ON public.businesses FOR SELECT USING (true);

CREATE POLICY "public_select" ON public.business_products FOR SELECT USING (true);



-- Fix profiles recursion

DROP POLICY IF EXISTS "profiles_user_select" ON public.profiles;

DROP POLICY IF EXISTS "profiles_admin" ON public.profiles;



CREATE POLICY "profiles_user_select"

ON public.profiles

FOR SELECT

USING (auth.uid() = id OR auth.uid() = user_id);



CREATE POLICY "profiles_admin"

ON public.profiles

FOR ALL

USING (EXISTS (

SELECT 1 FROM public.profiles p

WHERE (p.id = auth.uid() OR p.user_id = auth.uid())

AND (p.role = 'admin' OR p.is_admin = true)

))

WITH CHECK (EXISTS (

SELECT 1 FROM public.profiles p

WHERE (p.id = auth.uid() OR p.user_id = auth.uid())

AND (p.role = 'admin' OR p.is_admin = true)

));









