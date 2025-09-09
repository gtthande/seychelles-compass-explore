-- Enable real-time for tables to support live updates (set replica identity only)
ALTER TABLE public.businesses REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;