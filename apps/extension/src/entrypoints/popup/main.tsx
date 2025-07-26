import { render } from 'solid-js/web';
import { Button } from '@repo/ui-components/button';
import '@repo/ui-components/styles';

function Popup() {
  return (
    <div class="p-4 w-64">
      <h1 class="text-lg font-bold mb-4">Extension Popup</h1>
      <Button onClick={() => console.log('Button clicked!')}>
        Click me
      </Button>
    </div>
  );
}

// Mount the app when the script loads
const root = document.getElementById('app');
if (root) {
  render(() => <Popup />, root);
}