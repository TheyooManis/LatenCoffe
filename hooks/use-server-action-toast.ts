"use client";

import { useTransition } from "react";
import { toast } from "sonner";

type RunOptions = {
  successMessage?: string;
  errorMessage: string;
  /** Prefer `error.message` over `errorMessage` when the thrown value is an Error instance. */
  useErrorMessage?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
};

export function useServerActionToast() {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>, options: RunOptions) {
    startTransition(async () => {
      try {
        await action();
        if (options.successMessage) toast.success(options.successMessage);
        options.onSuccess?.();
      } catch (error) {
        options.onError?.();
        const message =
          options.useErrorMessage && error instanceof Error
            ? error.message
            : options.errorMessage;
        toast.error(message);
      }
    });
  }

  return { isPending, run };
}
