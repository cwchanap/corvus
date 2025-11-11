import { Show, type JSX } from "solid-js";
import { Button } from "./button.tsx";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  children?: JSX.Element;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const handleConfirm = () => {
    props.onConfirm();
    props.onOpenChange(false);
  };

  const handleCancel = () => {
    props.onOpenChange(false);
  };

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleCancel}
        />

        {/* Dialog */}
        <div class="relative z-50 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
          <div class="space-y-4">
            <div class="space-y-2">
              <h2 class="text-lg font-semibold text-card-foreground">
                {props.title}
              </h2>
              <Show when={props.description}>
                <p class="text-sm text-muted-foreground">{props.description}</p>
              </Show>
              <Show when={props.children}>
                <div class="text-sm text-muted-foreground">
                  {props.children}
                </div>
              </Show>
            </div>

            <div class="flex gap-3">
              <Button variant="outline" onClick={handleCancel} class="flex-1">
                {props.cancelText || "Cancel"}
              </Button>
              <Button
                variant={props.variant || "destructive"}
                onClick={handleConfirm}
                class="flex-1"
              >
                {props.confirmText || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
