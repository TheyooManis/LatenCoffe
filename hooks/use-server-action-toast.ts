"use client";

import { useTransition } from "react";
import { toast } from "sonner";

type RunOptions<T> = {
  successMessage?: string;
  errorMessage: string;
  /** Prefer `error.message` over `errorMessage` when the thrown value is an Error instance. */
  useErrorMessage?: boolean;
  onSuccess?: (result: T) => void;
  onError?: () => void;
};

export function useServerActionToast() {
  const [isPending, startTransition] = useTransition();

  function run<T>(action: () => Promise<T>, options: RunOptions<T>) {
    startTransition(async () => {
      try {
        const result = await action();
        if (options.successMessage) toast.success(options.successMessage);
        options.onSuccess?.(result);
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
