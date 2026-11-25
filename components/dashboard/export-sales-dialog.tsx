"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type PresetRange = "today" | "week" | "month" | "custom";

export function ExportSalesDialog() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<PresetRange>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (range === "custom") {
      if (!startDate || !endDate) {
        toast.error("Pilih tanggal awal dan akhir terlebih dahulu.");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        toast.error("Tanggal awal tidak boleh melewati tanggal akhir.");
        return;
      }
    }

    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      params.set("range", range);
      if (range === "custom") {
        params.set("from", startDate);
        params.set("to", endDate);
      }

      const response = await fetch(`/api/dashboard/export-sales?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal mengunduh laporan penjualan.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Penjualan_LatenCoffee_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Laporan Excel berhasil diunduh!", {
        description: "File telah disimpan ke perangkat Anda.",
      });
      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengunduh.";
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2 text-xs font-medium" />
        }
      >
        <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
        <span>Ekspor Excel</span>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-emerald-600" />
            Ekspor Laporan Penjualan (.xlsx)
          </DialogTitle>
          <DialogDescription>
            Pilih rentang waktu transaksi penjualan selesai yang ingin diekspor ke file Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Pilihan Cepat (Preset)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={range === "today" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setRange("today")}
              >
                Hari Ini
              </Button>
              <Button
                type="button"
                variant={range === "week" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setRange("week")}
              >
                7 Hari Terakhir
              </Button>
              <Button
                type="button"
                variant={range === "month" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setRange("month")}
              >
                30 Hari Terakhir
              </Button>
            </div>
          </div>

          {/* Custom Date Range Toggle */}
          <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Opsi Rentang Tanggal Khusus
              </Label>
              <Button
                type="button"
                variant={range === "custom" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setRange("custom")}
                className="text-xs"
              >
                {range === "custom" ? "✓ Dipilih" : "Pilih Kustom"}
              </Button>
            </div>

            {range === "custom" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="from-date" className="text-xs text-zinc-500">
                    Dari Tanggal
                  </Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="to-date" className="text-xs text-zinc-500">
                    Sampai Tanggal
                  </Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isDownloading}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Menyiapkan File...</span>
              </>
            ) : (
              <>
                <Download className="size-4" />
                <span>Unduh Excel</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
