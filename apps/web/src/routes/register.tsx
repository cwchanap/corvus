import { onMount } from "solid-js";
import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";

export default function Register() {
  const navigate = useNavigate();

  onMount(() => {
    navigate("/login", { replace: true });
  });

  return <Title>Sign In - Corvus</Title>;
}
