import { onMount } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";

/**
 * Legacy redirect: `/register` was a deployed auth route before the rename to
 * `/signup`. Keep this alias so old links/bookmarks resolve instead of 404.
 * Query string and hash are forwarded to the new route.
 */
export default function RegisterRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  onMount(() => {
    navigate(`/signup${location.search}${location.hash}`, { replace: true });
  });

  return null;
}
