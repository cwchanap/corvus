import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";

export default function Home() {
  const navigate = useNavigate();

  onMount(() => {
    // Immediately redirect to signin page
    navigate("/signin", { replace: true });
  });

  return null;
}
