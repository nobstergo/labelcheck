import jsPDF from 'jspdf';
import { InspectionResult, InspectionSession, ApprovedProduct } from '../types';

export interface ReportData {
  session?: InspectionSession | null;
  product?: ApprovedProduct | null;
  records: InspectionResult[];
  productName: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
  counters: {
    totalChecked: number;
    passed: number;
    flagged: number;
    review: number;
  };
}

export function generateInspectionPDF(data: ReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LEGAL METROLOGY COMPLIANCE - QUALITY INSPECTION REPORT', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Automated Vision & OCR Packaging Verification | Legal Metrology Rules, 2011', margin + 6, y + 16);

  y += 28;

  // Session & Product Info Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(margin, y, pageWidth - margin * 2, 28, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('REFERENCE PROFILE:', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(data.productName || 'General Packaged Commodity', margin + 44, y + 7);

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const reportTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'bold');
  doc.text('REPORT DATE & TIME:', margin + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportDate} at ${reportTime}`, margin + 44, y + 14);

  const durationStr = data.sessionStartTime
    ? `${new Date(data.sessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${data.sessionEndTime ? new Date(data.sessionEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}`
    : 'Active Session';

  doc.setFont('helvetica', 'bold');
  doc.text('SESSION DURATION:', margin + 4, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(durationStr, margin + 44, y + 21);

  // Stats Box on right
  const rightX = margin + 115;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PACKETS:', rightX, y + 7);
  doc.text(String(data.counters.totalChecked), rightX + 38, y + 7);

  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text('PASSED PACKETS:', rightX, y + 14);
  doc.text(String(data.counters.passed), rightX + 38, y + 14);

  const unresolved = data.counters.flagged;
  doc.setTextColor(unresolved > 0 ? 185 : 100, unresolved > 0 ? 28 : 116, unresolved > 0 ? 28 : 139);
  doc.text('FLAGGED / REVIEW:', rightX, y + 21);
  doc.text(`${data.counters.flagged} flagged, ${data.counters.review} review`, rightX + 38, y + 21);

  y += 34;

  // Table Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('PACKET-BY-PACKET INSPECTION LOG', margin, y);

  y += 4;

  // Table Headers
  const colPacketX = margin;
  const colTimeX = margin + 24;
  const colStatusX = margin + 46;
  const colMatchX = margin + 74;
  const colNotesX = margin + 104;
  const colWidth = pageWidth - margin * 2;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, colWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 7, margin + colWidth, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PACKET ID', colPacketX + 2, y + 4.8);
  doc.text('TIME', colTimeX + 2, y + 4.8);
  doc.text('STATUS', colStatusX + 2, y + 4.8);
  doc.text('PARAMETERS MATCHED', colMatchX + 2, y + 4.8);
  doc.text('DISCREPANCY / RESOLUTION DETAILS', colNotesX + 2, y + 4.8);

  y += 7;

  // Render Table Rows (ordered by packet number ascending if available, or chronological)
  const sortedRecords = [...data.records].reverse(); // from earliest to latest

  for (let i = 0; i < sortedRecords.length; i++) {
    const rec = sortedRecords[i];
    const packetNum = rec.packetNumber || i + 1;
    const timeStr = new Date(rec.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const isResolved = rec.isResolved;
    const isPass = rec.status === 'PASS';
    const isFlag = rec.status === 'FLAG';
    const isForeign = rec.status === 'FOREIGN_PRODUCT' || rec.isForeignProduct;

    const matched = typeof rec.matchedCount === 'number'
      ? rec.matchedCount
      : rec.fields.filter((f) => f.status === 'MATCH').length;
    const totalParams = typeof rec.totalParametersCount === 'number'
      ? rec.totalParametersCount
      : Math.max(rec.fields.length, 8);

    const matchText = `${matched} / ${totalParams} Matched (${Math.round((matched / Math.max(totalParams, 1)) * 100)}%)`;

    let displayStatus: string = rec.status;
    if (isResolved) {
      displayStatus = 'PASSED (Resolved)';
    } else if (isForeign) {
      displayStatus = 'FOREIGN';
    }

    let notes = rec.mismatchSummary || 'All declarations match parent benchmark';
    if (isResolved) {
      notes = `[DISCREPANCY RESOLVED BY OPERATOR] ${rec.resolutionNote || rec.mismatchSummary || 'Manual inspection approved'}`;
    }

    // Check page overflow
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 16;

      // Repeat mini header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, colWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('PACKET ID', colPacketX + 2, y + 4.2);
      doc.text('TIME', colTimeX + 2, y + 4.2);
      doc.text('STATUS', colStatusX + 2, y + 4.2);
      doc.text('PARAMETERS MATCHED', colMatchX + 2, y + 4.2);
      doc.text('DISCREPANCY / RESOLUTION DETAILS', colNotesX + 2, y + 4.2);
      y += 6;
    }

    // Row zebra background
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, colWidth, 7, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Packet #${packetNum}`, colPacketX + 2, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(timeStr, colTimeX + 2, y + 4.8);

    // Status Pill text
    if (isPass) {
      doc.setTextColor(22, 101, 52); // emerald
      doc.setFont('helvetica', 'bold');
    } else if (isFlag) {
      doc.setTextColor(185, 28, 28); // rose
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(161, 98, 7); // amber
      doc.setFont('helvetica', 'bold');
    }
    doc.text(displayStatus, colStatusX + 2, y + 4.8);

    // Matched parameters
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(matchText, colMatchX + 2, y + 4.8);

    // Notes truncated to fit line
    const truncatedNotes = notes.length > 55 ? `${notes.slice(0, 52)}...` : notes;
    if (isResolved) {
      doc.setTextColor(4, 120, 87); // emerald-700
    } else if (isFlag) {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(71, 85, 105);
    }
    doc.text(truncatedNotes, colNotesX + 2, y + 4.8);

    y += 7;
  }

  // Footer / Compliance Sign-off
  const footerY = Math.max(y + 8, pageHeight - 22);
  if (footerY > pageHeight - 16) {
    doc.addPage();
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'LabelCheck Automated Packaging & Legal Metrology Inspection System | Verified under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011',
    margin,
    footerY + 5
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Certified By Quality Inspector: ______________________    Signature / Seal: ______________________', margin, footerY + 10);

  // Save the PDF
  const safeName = (data.productName || 'Inspection')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const fileName = `LabelCheck_Inspection_Report_${safeName}_${Date.now().toString(36).toUpperCase()}.pdf`;
  doc.save(fileName);
}
