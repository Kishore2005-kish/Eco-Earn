
REVOKE EXECUTE ON FUNCTION public.redeem_reward(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_reward(UUID, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_reward(UUID, UUID) TO authenticated;
