import { onMount } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";

/**
 * Legacy redirect: `/login` was the auth route in production (and is still
 * hardcoded by the published `extension-v1.0.0-*` builds and existing
 * bookmarks/links). It was renamed to `/signin`; keep this alias so deployed
 * clients do not land on an unmatched route. Query string and hash are
 * forwarded so `?source=extension` and OAuth `?error=...` flows keep working.
 */
export default function LoginRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  onMount(() => {
    navigate(`/signin${location.search}${location.hash}`, { replace: true });
  });

  return null;
}
