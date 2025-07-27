import { Title } from "@solidjs/meta";
import { LoginForm } from "../components/auth/LoginForm";

export default function Login() {
  return (
    <>
      <Title>Sign In - Corvus</Title>
      <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </>
  );
}
