import jsPDF from 'jspdf';
import type { Report } from '../types';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

export const pdfService = {
  async generateReportPDF(report: Report, userName: string): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    drawReportPage(doc, report, userName);

    const fileName = generateFileName(report);
    doc.save(fileName);
  },

  async generateBatchPDF(reports: Report[], userNames: Map<string, string>): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    reports.forEach((report, index) => {
      if (index > 0) {
        doc.addPage();
      }
      const userName = userNames.get(report.user_id) || '不明';
      drawReportPage(doc, report, userName);
    });

    const fileName = `警備報告書一括_${formatDateForFile(new Date())}.pdf`;
    doc.save(fileName);
  },
};

function drawReportPage(doc: jsPDF, report: Report, userName: string): void {
  let yPos = MARGIN;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  const titleWidth = doc.getTextWidth('警備報告書（当社控）');
  doc.text('警備報告書（当社控）', (PAGE_WIDTH - titleWidth) / 2, yPos);
  yPos += 10;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  
  const col1X = MARGIN;
  const col2X = MARGIN + (CONTENT_WIDTH * 0.75);
  const rowHeight = 10;

  doc.setFontSize(10);
  
  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, rowHeight);
  doc.rect(col2X, yPos, CONTENT_WIDTH * 0.25, rowHeight);
  doc.text('契約先', col1X + 2, yPos + 7);
  doc.text(report.contract_name, col1X + 20, yPos + 7);
  doc.text('ご署名', col2X + 2, yPos + 7);
  yPos += rowHeight;

  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, rowHeight);
  doc.rect(col2X, yPos, CONTENT_WIDTH * 0.25, rowHeight);
  doc.text('警備場所', col1X + 2, yPos + 7);
  doc.text(report.guard_location, col1X + 20, yPos + 7);
  doc.text(userName, col2X + 10, yPos + 7);
  yPos += rowHeight;

  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, 8);
  doc.rect(col2X, yPos, CONTENT_WIDTH * 0.25, 8);
  doc.setFillColor(220, 220, 220);
  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, 8, 'F');
  doc.rect(col2X, yPos, CONTENT_WIDTH * 0.25, 8, 'F');
  doc.setFontSize(9);
  doc.text('勤務時間', col1X + 2, yPos + 5);
  doc.text('天気', col2X + 2, yPos + 5);
  yPos += 8;

  doc.setFontSize(10);
  const fromDate = new Date(report.work_date_from);
  const toDate = new Date(report.work_date_to);
  
  const timeRow1Height = 10;
  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, timeRow1Height);
  doc.rect(col2X, yPos, CONTENT_WIDTH * 0.25, timeRow1Height);
  doc.text('（自）', col1X + 2, yPos + 7);
  doc.text(formatWarekiDateTime(fromDate), col1X + 15, yPos + 7);
  doc.text('休憩', col2X + 8, yPos + 7);
  yPos += timeRow1Height;

  const timeRow2Height = 10;
  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, timeRow2Height);
  doc.rect(col2X, yPos, CONTENT_WIDTH * 0.25, timeRow2Height);
  doc.text('（至）', col1X + 2, yPos + 7);
  doc.text(formatWarekiDateTime(toDate), col1X + 15, yPos + 7);
  doc.text('残業', col2X + 8, yPos + 7);
  yPos += timeRow2Height;

  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, 8);
  doc.setFillColor(220, 220, 220);
  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, 8, 'F');
  doc.setFontSize(9);
  doc.text('業    務', col1X + 2, yPos + 5);
  doc.text('時間', col2X + 2, yPos + 5);
  yPos += 8;

  const workTypes = [
    '道路工事に於ける交通誘導',
    '建設工事現場に於ける交通誘導',
    '工事関係車両の出入口に伴う交通誘導',
    'イベントに伴う交通誘導',
    '駐車場の出入りに伴う交通誘導',
    '人の雑踏する場所に於ける負傷者等の事故発生を警戒・防止業務',
  ];

  doc.setFontSize(9);
  workTypes.forEach((type) => {
    const workRowHeight = 8;
    doc.rect(col1X, yPos, CONTENT_WIDTH, workRowHeight);
    const checkbox = type === report.work_type ? '☑' : '☐';
    doc.text(checkbox, col1X + 5, yPos + 6);
    doc.text(type, col1X + 12, yPos + 6);
    yPos += workRowHeight;
  });

  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, 8);
  doc.setFillColor(220, 220, 220);
  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.75, 8, 'F');
  doc.setFontSize(9);
  doc.text('担当業務詳細', col1X + 2, yPos + 5);
  yPos += 8;

  const detailGridRows = 3;
  const detailGridCols = 2;
  const detailCellWidth = CONTENT_WIDTH / detailGridCols;
  const detailCellHeight = 15;

  doc.setFontSize(8);
  for (let row = 0; row < detailGridRows; row++) {
    for (let col = 0; col < detailGridCols; col++) {
      const cellX = col1X + (col * detailCellWidth);
      const cellY = yPos + (row * detailCellHeight);
      const cellNum = row * detailGridCols + col + 1;
      
      doc.rect(cellX, cellY, detailCellWidth, detailCellHeight);
      doc.text(cellNum.toString(), cellX + 2, cellY + 5);
      
      if (report.work_detail && row === 0 && col === 0) {
        const lines = doc.splitTextToSize(report.work_detail, detailCellWidth - 8);
        const maxLines = Math.floor((detailCellHeight - 5) / 4);
        const displayLines = lines.slice(0, maxLines);
        displayLines.forEach((line: string, idx: number) => {
          doc.text(line, cellX + 8, cellY + 5 + (idx * 4));
        });
      }
    }
  }
  yPos += detailGridRows * detailCellHeight;

  const specialNotesHeight = 12;
  doc.rect(col1X, yPos, CONTENT_WIDTH * 0.25, specialNotesHeight);
  doc.rect(col1X + CONTENT_WIDTH * 0.25, yPos, CONTENT_WIDTH * 0.75, specialNotesHeight);
  doc.setFontSize(9);
  doc.text('特記事項', col1X + 2, yPos + 8);
  const hasSpecialNotes = report.special_notes === 'yes' || (report.special_notes_detail && report.special_notes_detail.length > 0);
  const specialNotesCheckbox = hasSpecialNotes ? '☑ あり    ☐ なし' : '☐ あり    ☑ なし';
  doc.text(specialNotesCheckbox, col1X + CONTENT_WIDTH * 0.25 + 5, yPos + 8);
  yPos += specialNotesHeight;

  if (hasSpecialNotes && report.special_notes_detail) {
    const notesContentHeight = 20;
    doc.rect(col1X, yPos, CONTENT_WIDTH, notesContentHeight);
    doc.setFontSize(8);
    doc.text('特記事項の内容', col1X + 2, yPos + 5);
    const notesLines = doc.splitTextToSize(report.special_notes_detail, CONTENT_WIDTH - 8);
    notesLines.slice(0, 3).forEach((line: string, idx: number) => {
      doc.text(line, col1X + 4, yPos + 10 + (idx * 5));
    });
    yPos += notesContentHeight;
  }

  const certHeight = 10;
  doc.rect(col1X, yPos, CONTENT_WIDTH, certHeight);
  doc.setFontSize(9);
  const trafficCheckbox = report.traffic_guide_assigned ? '☑ あり    ☐ なし' : '☐ あり    ☑ なし';
  doc.text('交通誘導検定合格者配置', col1X + 2, yPos + 7);
  doc.text(trafficCheckbox, col1X + 50, yPos + 7);
  if (report.traffic_guide_assignee_name) {
    doc.text(`検定合格者氏名: ${report.traffic_guide_assignee_name}`, col1X + 90, yPos + 7);
  }
  yPos += certHeight;

  doc.rect(col1X, yPos, CONTENT_WIDTH, certHeight);
  const miscCheckbox = report.misc_guard_assigned ? '☑ あり    ☐ なし' : '☐ あり    ☑ なし';
  doc.text('雑踏警備検定合格者配置', col1X + 2, yPos + 7);
  doc.text(miscCheckbox, col1X + 50, yPos + 7);
  if (report.misc_guard_assignee_name) {
    doc.text(`検定合格者氏名: ${report.misc_guard_assignee_name}`, col1X + 90, yPos + 7);
  }
  yPos += certHeight;

  const remarksHeight = 20;
  doc.rect(col1X, yPos, CONTENT_WIDTH, remarksHeight);
  doc.setFontSize(9);
  doc.text('備考', col1X + 2, yPos + 7);
  if (report.remarks) {
    doc.setFontSize(8);
    const remarksLines = doc.splitTextToSize(report.remarks, CONTENT_WIDTH - 8);
    remarksLines.slice(0, 3).forEach((line: string, idx: number) => {
      doc.text(line, col1X + 4, yPos + 12 + (idx * 5));
    });
  }

  doc.setFontSize(9);
  doc.text('セリュートラスト株式会社', MARGIN, PAGE_HEIGHT - 15);
  doc.setFontSize(8);
  doc.text('〒674-0058 兵庫県明石市大久保町駅前二丁目1番地の10', MARGIN, PAGE_HEIGHT - 10);
  doc.text('TEL 078-945-5628  FAX 078-945-5629', MARGIN, PAGE_HEIGHT - 5);
}

function formatWarekiDateTime(date: Date): string {
  const year = date.getFullYear();
  const warekiYear = year - 2018;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  const hour = date.getHours();
  const minute = date.getMinutes();

  return `令和${warekiYear}年${month}月${day}日${dayOfWeek}曜${hour}時${String(minute).padStart(2, '0')}分`;
}

function formatDateForFile(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function generateFileName(report: Report): string {
  const date = new Date(report.created_at);
  const dateStr = formatDateForFile(date);
  const timeStr = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
  return `セリュートラスト株式会社_${dateStr}_${timeStr}.pdf`;
}
