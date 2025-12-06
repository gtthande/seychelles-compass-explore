Write-Host "Testing database policies..."
psql -c "SELECT COUNT(*) FROM public.categories;" 2>&1

Write-Host "Testing Supabase auth..."

# You may mock a login if needed

Write-Host "Testing Vite dev server..."
Invoke-WebRequest http://localhost:5173 -UseBasicParsing


