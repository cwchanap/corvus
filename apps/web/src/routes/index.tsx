import { Button } from '@repo/ui-components/button';
import { Card } from '@repo/ui-components/card';

export default function Home() {
  return (
    <main class="container mx-auto p-8">
      <h1 class="text-4xl font-bold mb-8">Welcome to SolidStart</h1>
      <Card class="p-6">
        <h2 class="text-2xl font-semibold mb-4">Getting Started</h2>
        <p class="mb-4">This is a SolidStart web application with shared UI components.</p>
        <Button onClick={() => alert('Hello from SolidStart!')}>
          Click me
        </Button>
      </Card>
    </main>
  );
}