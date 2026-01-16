import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Report } from '../types';

export const pdfService = {
  async generateReportPDF(report: Report, userName: string): Promise<void> {
    const fileName = generateFileName(report);
    const pdf = await createPDFFromReport(report, userName);
    pdf.save(fileName);
  },

  async generateBatchPDF(reports: Report[], userNames: Map<string, string>): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let i = 0; i < reports.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      const report = reports[i];
      const userName = userNames.get(report.user_id) || '不明';
      await addReportPageToPDF(pdf, report, userName);
    }

    const fileName = `警備報告書一括_${formatDateForFile(new Date())}.pdf`;
    pdf.save(fileName);
  },
};

async function createPDFFromReport(report: Report, userName: string): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  await addReportPageToPDF(pdf, report, userName);
  return pdf;
}

async function addReportPageToPDF(pdf: jsPDF, report: Report, userName: string): Promise<void> {
  const container = createReportHTML(report, userName);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    // A4 dimensions in mm
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;
    const MARGIN = 10; // マージン

    // Calculate aspect ratio
    const canvasAspectRatio = canvas.width / canvas.height;

    // Calculate dimensions to fit within A4 with margins
    let imgWidth = A4_WIDTH - (MARGIN * 2);
    let imgHeight = imgWidth / canvasAspectRatio;

    // If height exceeds A4, scale down to fit height instead
    if (imgHeight > A4_HEIGHT - (MARGIN * 2)) {
      imgHeight = A4_HEIGHT - (MARGIN * 2);
      imgWidth = imgHeight * canvasAspectRatio;
    }

    // Center the image on the page
    const xOffset = (A4_WIDTH - imgWidth) / 2;
    const yOffset = (A4_HEIGHT - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
  } finally {
    document.body.removeChild(container);
  }
}

function createReportHTML(report: Report, userName: string): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    background: white;
    padding: 30px;
    font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
    font-size: 13px;
    line-height: 1.5;
  `;

  const hasSpecialNotes = report.special_notes === 'yes' || (report.special_notes_detail && report.special_notes_detail.length > 0);

  container.innerHTML = `
    <style>
      .pdf-container * {
        box-sizing: border-box;
      }
      .pdf-title {
        font-size: 22px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 15px;
      }
      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
      }
      .pdf-table td, .pdf-table th {
        border: 1px solid #000;
        padding: 6px;
      }
      .pdf-table th {
        background-color: #e0e0e0;
        font-weight: bold;
        text-align: left;
      }
      .pdf-checkbox {
        font-size: 16px;
      }
      .pdf-work-detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0;
        border: 1px solid #000;
        margin-bottom: 10px;
      }
      .pdf-work-detail-cell {
        border: 1px solid #000;
        padding: 8px;
        min-height: 50px;
      }
      .pdf-work-detail-number {
        font-size: 11px;
        color: #666;
        margin-bottom: 3px;
      }
      .pdf-footer {
        margin-top: 15px;
        font-size: 11px;
        line-height: 1.6;
      }
    </style>
    <div class="pdf-container">
      <div class="pdf-title">警備報告書（当社控）</div>

      <table class="pdf-table">
        <tr>
          <td style="width: 20%"><strong>契約先</strong></td>
          <td style="width: 55%">${escapeHtml(report.contract_name)}</td>
          <td style="width: 25%" rowspan="2" style="text-align: center; vertical-align: middle;">
            <div><strong>ご署名</strong></div>
            <div style="margin-top: 10px;">${escapeHtml(userName)}</div>
          </td>
        </tr>
        <tr>
          <td><strong>警備場所</strong></td>
          <td>${escapeHtml(report.guard_location)}</td>
        </tr>
      </table>

      <table class="pdf-table">
        <tr>
          <th style="width: 75%">勤務時間</th>
          <th style="width: 25%">天気</th>
        </tr>
        <tr>
          <td>（自） ${formatWarekiDateTime(new Date(report.work_date_from))}</td>
          <td style="text-align: center; vertical-align: top; padding-top: 8px;">
            ${report.weather ? escapeHtml(report.weather) : ''}
          </td>
        </tr>
        <tr>
          <td>（至） ${formatWarekiDateTime(new Date(report.work_date_to))}</td>
          <td style="text-align: center;">
            <div style="margin-bottom: 8px;">
              <div><strong>休憩</strong></div>
              <div>${report.break_time ? escapeHtml(report.break_time) : ''}</div>
            </div>
            <div>
              <div><strong>残業</strong></div>
              <div>${report.overtime_time ? escapeHtml(report.overtime_time) : ''}</div>
            </div>
          </td>
        </tr>
      </table>

      <table class="pdf-table">
        <tr>
          <th colspan="2">業　　務</th>
        </tr>
        ${generateWorkTypeRows(report.work_type)}
      </table>

      <table class="pdf-table">
        <tr>
          <th>担当警備員</th>
        </tr>
      </table>
      <div class="pdf-work-detail-grid">
        ${generateAssignedGuardsGrid(report.assigned_guards || '')}
      </div>

      <table class="pdf-table">
        <tr>
          <td style="width: 25%"><strong>特記事項</strong></td>
          <td style="width: 75%">
            <span class="pdf-checkbox">${hasSpecialNotes ? '☑' : '☐'}</span> あり
            <span class="pdf-checkbox">${hasSpecialNotes ? '☐' : '☑'}</span> なし
          </td>
        </tr>
        ${hasSpecialNotes && report.special_notes_detail ? `
        <tr>
          <td colspan="2">
            <strong>特記事項の内容</strong><br>
            ${escapeHtml(report.special_notes_detail)}
          </td>
        </tr>
        ` : ''}
      </table>

      <table class="pdf-table">
        <tr>
          <td style="width: 40%"><strong>交通誘導検定合格者配置</strong></td>
          <td style="width: 30%">
            <span class="pdf-checkbox">${report.traffic_guide_assigned ? '☑' : '☐'}</span> あり
            <span class="pdf-checkbox">${report.traffic_guide_assigned ? '☐' : '☑'}</span> なし
          </td>
          <td style="width: 30%">
            ${report.traffic_guide_assignee_name ? `検定合格者氏名: ${escapeHtml(report.traffic_guide_assignee_name)}` : ''}
          </td>
        </tr>
        <tr>
          <td><strong>雑踏警備検定合格者配置</strong></td>
          <td>
            <span class="pdf-checkbox">${report.misc_guard_assigned ? '☑' : '☐'}</span> あり
            <span class="pdf-checkbox">${report.misc_guard_assigned ? '☐' : '☑'}</span> なし
          </td>
          <td>
            ${report.misc_guard_assignee_name ? `検定合格者氏名: ${escapeHtml(report.misc_guard_assignee_name)}` : ''}
          </td>
        </tr>
      </table>

      <table class="pdf-table">
        <tr>
          <th>備考</th>
        </tr>
        <tr>
          <td style="min-height: 100px; vertical-align: top;">
            ${report.remarks ? escapeHtml(report.remarks) : ''}
          </td>
        </tr>
      </table>

      <div class="pdf-footer">
        <div><strong>セリュートラスト株式会社</strong></div>
        <div>〒674-0058 兵庫県明石市大久保町駅前二丁目1番地の10</div>
        <div>TEL 078-945-5628　FAX 078-945-5629</div>
      </div>
    </div>
  `;

  return container;
}

function generateWorkTypeRows(selectedType: string): string {
  const workTypes = [
    '道路工事に於ける交通誘導',
    '建設工事現場に於ける交通誘導',
    '工事関係車両の出入口に伴う交通誘導',
    'イベントに伴う交通誘導',
    '駐車場の出入りに伴う交通誘導',
    '人の雑踏する場所に於ける負傷者等の事故発生を警戒・防止業務',
  ];

  return workTypes
    .map((type) => {
      const isSelected = type === selectedType;
      const checkbox = isSelected ? '☑' : '☐';
      return `
        <tr>
          <td colspan="2">
            <span class="pdf-checkbox">${checkbox}</span> ${escapeHtml(type)}
          </td>
        </tr>
      `;
    })
    .join('');
}

function generateAssignedGuardsGrid(assignedGuards: string): string {
  const guards = assignedGuards ? assignedGuards.split('\n').filter(g => g.trim()) : [];
  const cells = [];

  for (let i = 1; i <= 6; i++) {
    const guardName = guards[i - 1] ? escapeHtml(guards[i - 1].trim()) : '';
    cells.push(`
      <div class="pdf-work-detail-cell">
        <div class="pdf-work-detail-number">${i}</div>
        <div>${guardName}</div>
      </div>
    `);
  }
  return cells.join('');
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

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
