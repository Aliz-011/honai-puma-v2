import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Exceljs from 'exceljs'
import FileSaver from 'file-saver'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatToBillion(val: number) {
  if (val == undefined || val == null || !val) {
    return null
  }

  return Number(val).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
}

export function getGrowthColor(value: string) {
  const numeric = value ? parseFloat(value.replace('%', '')) : 0
  return numeric > 0;
};

export function getAchGrowthColor(value: string) {
  const numeric = value ? parseFloat(value.replace('%', '')) : 0
  return numeric >= 100;
};

export function gapToTarget(val: number) {
  return val > 0
}

export async function exportToExcel(data: Revenue[], date: string, fileName: string) {
  const workbook = new Exceljs.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')

  worksheet.columns = [
    { header: 'Territory', key: 'territory', width: 25 },
    { header: 'Target', key: 'target', width: 15 },
    { header: date, key: 'rev', width: 15 },
    { header: 'Ach FM', key: 'achFm', width: 8 },
    { header: 'DRR', key: 'drr', width: 8 },
    { header: 'Gap', key: 'gap', width: 15 },
    { header: 'MoM', key: 'mom', width: 8 },
    { header: 'Abs', key: 'abs', width: 15 },
    { header: 'YoY', key: 'yoy', width: 8 },
    { header: 'YtD', key: 'ytd', width: 8 },
    { header: 'QoQ', key: 'qoq', width: 8 },
  ]

  worksheet.getRow(1)
  data.forEach(item => {
    worksheet.addRow(item)
  })

  const buffer = await workbook.xlsx.writeBuffer()

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  FileSaver.saveAs(blob, `${fileName}.xlsx`);
}

type Revenue = {
  territory: string | null;
  target: number;
  rev: number;
  achFm: string;
  drr: string;
  gap: number;
  mom: string;
  abs: number;
  yoy: string;
  ytd: string;
  qoq: string;
}