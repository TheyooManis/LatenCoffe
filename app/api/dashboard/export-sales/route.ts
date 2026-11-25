import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getWitaRange(range: string, customStart?: string | null, customEnd?: string | null) {
  // WITA is UTC+8
  const WITA_OFFSET = 8 * 60 * 60 * 1000;
  const now = new Date();
  const nowWita = new Date(now.getTime() + WITA_OFFSET);

  let startDate: Date;
  let endDate: Date = now;

  if (range === "today") {
    const startOfTodayWita = new Date(
      Date.UTC(
        nowWita.getUTCFullYear(),
        nowWita.getUTCMonth(),
        nowWita.getUTCDate(),
        0, 0, 0, 0
      ) - WITA_OFFSET
    );
    startDate = startOfTodayWita;
  } else if (range === "week") {
    // 7 days ago 00:00 WITA
    const sevenDaysAgo = new Date(nowWita.getTime() - 6 * 24 * 60 * 60 * 1000);
    startDate = new Date(
      Date.UTC(
        sevenDaysAgo.getUTCFullYear(),
        sevenDaysAgo.getUTCMonth(),
        sevenDaysAgo.getUTCDate(),
        0, 0, 0, 0
      ) - WITA_OFFSET
    );
  } else if (range === "month") {
    // 30 days ago 00:00 WITA
    const thirtyDaysAgo = new Date(nowWita.getTime() - 29 * 24 * 60 * 60 * 1000);
    startDate = new Date(
      Date.UTC(
        thirtyDaysAgo.getUTCFullYear(),
        thirtyDaysAgo.getUTCMonth(),
        thirtyDaysAgo.getUTCDate(),
        0, 0, 0, 0
      ) - WITA_OFFSET
    );
  } else if (range === "custom" && customStart && customEnd) {
    const [sY, sM, sD] = customStart.split("-").map(Number);
    const [eY, eM, eD] = customEnd.split("-").map(Number);
    startDate = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0) - WITA_OFFSET);
    endDate = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999) - WITA_OFFSET);
  } else {
    // Default today
    const startOfTodayWita = new Date(
      Date.UTC(
        nowWita.getUTCFullYear(),
        nowWita.getUTCMonth(),
        nowWita.getUTCDate(),
        0, 0, 0, 0
      ) - WITA_OFFSET
    );
    startDate = startOfTodayWita;
  }

  return { startDate, endDate };
}

function formatWitaDateTime(date: Date) {
  const wita = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const YYYY = wita.getUTCFullYear();
  const MM = String(wita.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(wita.getUTCDate()).padStart(2, "0");
  const HH = String(wita.getUTCHours()).padStart(2, "0");
  const mm = String(wita.getUTCMinutes()).padStart(2, "0");
  return `${DD}/${MM}/${YYYY} ${HH}:${mm} WITA`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "OWNER") {
    return new Response("Unauthorized. Hanya owner yang dapat mengunduh laporan.", {
      status: 403,
    });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "today";
  const customStart = searchParams.get("from");
  const customEnd = searchParams.get("to");

  const { startDate, endDate } = getWitaRange(range, customStart, customEnd);

  // Fetch all completed orders in the range (based on completion time / updatedAt)
  const orders = await prisma.order.findMany({
    where: {
      status: "SELESAI",
      updatedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { updatedAt: "asc" },
    include: {
      items: {
        orderBy: { nameSnapshot: "asc" },
        include: {
          options: true,
        },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Laten Coffee Shop System";
  workbook.created = new Date();

  // --------------------------------------------------------------------------
  // SHEET 1: RINGKASAN PENJUALAN
  // --------------------------------------------------------------------------
  const summarySheet = workbook.addWorksheet("Ringkasan Penjualan", {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 32 },
  ];

  // Header Title
  summarySheet.mergeCells("A1:B1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = "LATEN COFFEE SHOP";
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF27272A" }, // Zinc-800
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 36;

  summarySheet.mergeCells("A2:B2");
  const subtitleCell = summarySheet.getCell("A2");
  subtitleCell.value = "Laporan Rekapitulasi Penjualan & Pendapatan";
  subtitleCell.font = { name: "Segoe UI", size: 11, italic: true, color: { argb: "FF71717A" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(2).height = 22;

  summarySheet.addRow([]); // Blank row

  const totalOmzet = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPesanan = orders.length;
  const aov = totalPesanan > 0 ? Math.round(totalOmzet / totalPesanan) : 0;

  const qrisOrders = orders.filter((o) => o.paymentMethod === "QRIS");
  const qrisTotal = qrisOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const vaOrders = orders.filter((o) => o.paymentMethod === "VIRTUAL_ACCOUNT");
  const vaTotal = vaOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const summaryData = [
    ["Periode Laporan", `${formatWitaDateTime(startDate)} s/d ${formatWitaDateTime(endDate)}`],
    ["Waktu Unduh", formatWitaDateTime(new Date())],
    ["Total Transaksi Selesai", totalPesanan],
    ["Total Pendapatan (Omzet)", totalOmzet],
    ["Rata-rata Nilai Pesanan (AOV)", aov],
    ["Pembayaran QRIS", `${qrisOrders.length} transaksi (${qrisTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })})`],
    ["Pembayaran Virtual Account", `${vaOrders.length} transaksi (${vaTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })})`],
  ];

  summaryData.forEach(([label, value], idx) => {
    const row = summarySheet.addRow([label, value]);
    row.height = 24;
    row.getCell(1).font = { name: "Segoe UI", bold: true, size: 10, color: { argb: "FF3F3F46" } };
    row.getCell(2).font = { name: "Segoe UI", size: 10 };
    row.getCell(1).border = { bottom: { style: "thin", color: { argb: "FFE4E4E7" } } };
    row.getCell(2).border = { bottom: { style: "thin", color: { argb: "FFE4E4E7" } } };

    // Format currency for omzet and aov
    if (idx === 3 || idx === 4) {
      row.getCell(2).numFmt = '"Rp "#,##0';
    }
  });

  // --------------------------------------------------------------------------
  // SHEET 2: DETAIL TRANSAKSI
  // --------------------------------------------------------------------------
  const detailSheet = workbook.addWorksheet("Detail Transaksi", {
    views: [{ showGridLines: true }],
  });

  detailSheet.columns = [
    { header: "No. Antrean", key: "queue", width: 14 },
    { header: "Waktu (WITA)", key: "time", width: 20 },
    { header: "No. Meja", key: "table", width: 12 },
    { header: "Item Menu", key: "item", width: 26 },
    { header: "Pilihan / Topping", key: "options", width: 24 },
    { header: "Catatan Item", key: "itemNote", width: 20 },
    { header: "Qty", key: "quantity", width: 8 },
    { header: "Harga Satuan", key: "unitPrice", width: 16 },
    { header: "Subtotal", key: "subtotal", width: 18 },
    { header: "Metode Bayar", key: "payment", width: 16 },
    { header: "Catatan Pesanan", key: "orderNote", width: 22 },
  ];

  // Style Header Row
  const headerRow = detailSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF18181B" }, // Zinc-900
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
    };
  });

  let rowIndex = 2;
  orders.forEach((order) => {
    const timeLabel = formatWitaDateTime(order.updatedAt).split(" ")[1]; // extract time
    const dateLabel = formatWitaDateTime(order.updatedAt).split(" ")[0]; // extract date
    const fullTime = `${dateLabel} ${timeLabel}`;

    order.items.forEach((item) => {
      const optionsText = item.options.length > 0
        ? item.options.map((opt) => `${opt.nameSnapshot} (+${opt.priceDeltaSnapshot})`).join(", ")
        : "-";

      const optionPriceSum = item.options.reduce((sum, opt) => sum + opt.priceDeltaSnapshot, 0);
      const unitPrice = item.priceSnapshot + optionPriceSum;
      const subtotal = unitPrice * item.quantity;

      const row = detailSheet.addRow({
        queue: `#${order.queueNumber}`,
        time: fullTime,
        table: `Meja ${order.tableId}`,
        item: item.nameSnapshot,
        options: optionsText,
        itemNote: item.note || "-",
        quantity: item.quantity,
        unitPrice: unitPrice,
        subtotal: subtotal,
        payment: order.paymentMethod === "QRIS" ? "QRIS" : "Virtual Account",
        orderNote: order.note || "-",
      });

      row.height = 20;

      // Alignments & Fonts
      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(2).alignment = { horizontal: "center" };
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(7).alignment = { horizontal: "center" };
      row.getCell(8).alignment = { horizontal: "right" };
      row.getCell(9).alignment = { horizontal: "right" };
      row.getCell(10).alignment = { horizontal: "center" };

      // Number formatting
      row.getCell(8).numFmt = '"Rp "#,##0';
      row.getCell(9).numFmt = '"Rp "#,##0';

      // Zebra striping
      const isEven = rowIndex % 2 === 0;
      row.eachCell((cell) => {
        cell.font = { name: "Segoe UI", size: 9.5 };
        if (isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAFAFA" },
          };
        }
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE4E4E7" } },
        };
      });

      rowIndex++;
    });
  });

  // Total summary row at bottom
  const totalRow = detailSheet.addRow({
    queue: "TOTAL",
    time: "",
    table: "",
    item: "",
    options: "",
    itemNote: "",
    quantity: "",
    unitPrice: "",
    subtotal: totalOmzet,
    payment: "",
    orderNote: "",
  });
  totalRow.height = 24;
  totalRow.getCell(1).font = { name: "Segoe UI", bold: true, size: 10 };
  totalRow.getCell(9).font = { name: "Segoe UI", bold: true, size: 10 };
  totalRow.getCell(9).numFmt = '"Rp "#,##0';
  totalRow.getCell(9).alignment = { horizontal: "right" };
  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: "medium", color: { argb: "FF18181B" } },
      bottom: { style: "double", color: { argb: "FF18181B" } },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const fileDate = formatWitaDateTime(startDate).split(" ")[0].replace(/\//g, "-");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Laporan_Penjualan_LatenCoffee_${fileDate}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
