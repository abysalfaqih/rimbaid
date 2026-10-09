-- Fungsi admin: hanya user login (authenticated) yang boleh memanggil
revoke execute on function public.set_new_update_app(uuid) from public, anon;
revoke execute on function public.clear_new_update_app(uuid) from public, anon;

-- Rate limit: hanya dipanggil dari server lewat admin client (service_role)
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;