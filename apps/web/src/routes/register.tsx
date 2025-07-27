import { Title } from "@solidjs/meta";
import { RegisterForm } from "../components/auth/RegisterForm";

export default function Register() {
  return (
    <>
      <Title>Create Account - Corvus</Title>
      <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm />
      </div>
    </>
  );
}
