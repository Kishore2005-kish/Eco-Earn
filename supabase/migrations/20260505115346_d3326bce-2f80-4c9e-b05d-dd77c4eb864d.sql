
-- Revoke public/anon execute on security definer functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_points(uuid, integer, numeric) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.increment_points(uuid, integer, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
