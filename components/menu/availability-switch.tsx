"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { setMenuItemAvailability } from "@/app/dashboard/menu/actions";
import { useServerActionToast } from "@/hooks/use-server-action-toast";

export function AvailabilitySwitch({
  itemId,
  isAvailable,
}: {
  itemId: string;
  isAvailable: boolean;
}) {
  const [checked, setChecked] = useState(isAvailable);
  const { isPending, run } = useServerActionToast();

  return (
    <Switch
      checked={checked}
      disabled={isPending}
      onCheckedChange={(value) => {
        setChecked(value);
        run(() => setMenuItemAvailability(itemId, value), {
          errorMessage: "Gagal memperbarui ketersediaan.",
          onError: () => setChecked(!value),
        });
      }}
    />
  );
}
