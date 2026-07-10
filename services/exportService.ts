
import { Detection } from '../types';
import { jsPDF } from 'jspdf';

export const downloadEvidence = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateEvidenceCard = async (
  bufferPrimary: string | null, 
  bufferSecondary: string | null, 
  detections: Detection[],
  geminiAnalysis: any // TODO: add proper type
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context failed");

  // Configuration
  const width = 1200;
  const headerH = 120;
  const imagesH = 500;
  const padding = 40;
  
  // Dynamic height calculation
  const listStart = headerH + imagesH + 60;
  const itemH = 60;
  let listH = Math.max(120, detections.length * itemH);
  
  // Extra space for gemini content
  const geminiH = geminiAnalysis ? 200 : 0;
  listH += geminiH;

  const footerH = 60;
  const totalHeight = listStart + listH + footerH;

  canvas.width = width;
  canvas.height = totalHeight;

  // 1. Background (Deep Indigo)
  ctx.fillStyle = '#1a052b'; 
  ctx.fillRect(0, 0, width, totalHeight);

  // 2. Tech Grid Pattern
  ctx.strokeStyle = '#2e1065'; // slightly lighter indigo
  ctx.lineWidth = 1;
  ctx.beginPath();
  for(let i=0; i<width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i, totalHeight); }
  for(let i=0; i<totalHeight; i+=40) { ctx.moveTo(0,i); ctx.lineTo(width, i); }
  ctx.stroke();

  // 3. Header
  ctx.fillStyle = '#10031c'; // Darker indigo for header
  ctx.fillRect(0, 0, width, headerH);
  
  // Title (Neon Cyan)
  ctx.fillStyle = '#00FFFF'; 
  ctx.font = '900 40px "Courier New", monospace';
  ctx.fillText("Purple Canary // FORENSIC LOG", padding, 70);
  
  // Timestamp ID
  ctx.fillStyle = '#8F00FF'; // Ultra Violet
  ctx.font = '20px "Courier New", monospace';
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  ctx.fillText(`ID: ${Date.now().toString(36).toUpperCase()} // ${timestamp}`, padding, 105);

  // 4. Images
  const loadImg = (b64: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = `data:image/png;base64,${b64}`;
  });

  try {
    if (bufferPrimary && bufferSecondary) {
        // --- DUAL BAND MODE (Camera) ---
        const [img365, img395] = await Promise.all([loadImg(bufferPrimary), loadImg(bufferSecondary)]);
        
        // Draw 365nm
        const imgW = 540;
        const imgX1 = padding;
        const imgY = 140;
        
        // Image Border (Ultra Violet)
        ctx.strokeStyle = '#8F00FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(imgX1 - 2, imgY - 2, imgW + 4, imagesH + 4);
        ctx.drawImage(img365, imgX1, imgY, imgW, imagesH);
        
        // Label 365
        ctx.fillStyle = '#1a052b';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(imgX1, imgY + imagesH - 50, 160, 50);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#8F00FF'; // Ultra Violet
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillText("365nm SCAN", imgX1 + 15, imgY + imagesH - 15);

        // Draw 395nm
        const imgX2 = width - padding - imgW;
        
        // Image Border (Neon Cyan)
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(imgX2 - 2, imgY - 2, imgW + 4, imagesH + 4);
        ctx.drawImage(img395, imgX2, imgY, imgW, imagesH);
        
        // Label 395
        ctx.fillStyle = '#1a052b';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(imgX2, imgY + imagesH - 50, 160, 50);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#00FFFF'; // Neon Cyan
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillText("395nm SCAN", imgX2 + 15, imgY + imagesH - 15);

    } else if (bufferPrimary) {
        // --- SINGLE SOURCE MODE (Upload) ---
        const img = await loadImg(bufferPrimary);
        
        const maxW = width - (padding * 2);
        const imgX = padding;
        const imgY = 140;
        
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(imgX - 2, imgY - 2, maxW + 4, imagesH + 4);
        
        // Draw full width preserved aspect ratio in future, for now fill container
        ctx.drawImage(img, imgX, imgY, maxW, imagesH);

        ctx.fillStyle = '#1a052b';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(imgX, imgY + imagesH - 50, 260, 50);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#00FFFF'; 
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillText("SOURCE CAPTURE", imgX + 15, imgY + imagesH - 15);
    }
  } catch (e) {
    console.error("Failed to load evidence images", e);
    ctx.fillStyle = '#ef4444';
    ctx.font = '30px "Courier New", monospace';
    ctx.fillText("ERROR: IMAGE DATA CORRUPT OR MISSING", padding, 300);
  }

  // 5. Analysis List
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px "Courier New", monospace';
  ctx.fillText("SPECTRAL DETECTIONS:", padding, listStart - 20);

  let currentY = listStart + 30;

  if (geminiAnalysis) {
      ctx.fillStyle = '#00FFFF'; // Neon Cyan
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillText(`AI VERDICT: ${geminiAnalysis.forensicVerdict}`, padding, currentY);
      currentY += 30;
      
      ctx.fillStyle = '#ffaa00'; // Amber
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillText(`Classes: ${geminiAnalysis.classesDetected.join(', ')}`, padding, currentY);
      currentY += 25;
      
      ctx.fillStyle = '#a78bfa'; // Purple
      ctx.font = '16px "Courier New", monospace';
      ctx.fillText(`Obs: ${geminiAnalysis.visualObservations.substring(0, 80)}...`, padding, currentY);
      currentY += 40;
  }

  if (detections.length === 0) {
     ctx.fillStyle = '#6b7280';
     ctx.font = 'italic 24px "Courier New", monospace';
     ctx.fillText("NO ANOMALIES DETECTED IN SCAN REGION.", padding, currentY);
  } else {
    detections.forEach((det, index) => {
      const y = currentY + (index * itemH);
      
      const hazardColor = det.hazard === 'LETHAL' ? '#ef4444' : 
                          det.hazard === 'CRITICAL' ? '#00FFFF' :
                          det.hazard === 'HIGH' ? '#eab308' : '#22c55e';
      
      // Hazard Tag
      ctx.fillStyle = hazardColor;
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillText(`[${det.hazard}]`, padding, y);
      
      // Name
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(det.name, padding + 180, y);
  
      // Meta Data (Rf + Hex)
      ctx.fillStyle = '#a78bfa'; // Light purple for text
      ctx.font = '18px "Courier New", monospace';
      const metaText = `Rf: ${det.rf.toFixed(3)} | Hex: ${det.hex}`;
      const metaWidth = ctx.measureText(metaText).width;
      ctx.fillText(metaText, width - padding - metaWidth, y);
  
      // Potency
      if (det.potency) {
        ctx.fillStyle = '#9ca3af'; // Gray-400
        ctx.font = 'bold 18px "Courier New", monospace';
        const potencyText = `CONFIDENCE: ${det.potency.toFixed(1)}%`;
        const potencyWidth = ctx.measureText(potencyText).width;
        // Draw it to the left of the meta text
        ctx.fillText(potencyText, width - padding - metaWidth - potencyWidth - 20, y);
      }
      
      // Divider line
      ctx.strokeStyle = '#4c1d95'; // Dark purple divider
      ctx.beginPath();
      ctx.moveTo(padding, y + 15);
      ctx.lineTo(width - padding, y + 15);
      ctx.stroke();
    });
  }
  
  // 6. Footer
  ctx.fillStyle = '#8F00FF';
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText("GENERATED BY Purple Canary // DO NOT TAMPER // DIGITAL POISON METER Beta", width/2, totalHeight - 20);

  return canvas.toDataURL('image/png');
};

export const generatePDFReport = async (
  bufferPrimary: string | null,
  bufferSecondary: string | null,
  detections: Detection[],
  geminiAnalysis: any // TODO: add proper type
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Helper for background
  const drawBackground = () => {
    doc.setFillColor(26, 5, 43); // Deep Indigo
    doc.rect(0, 0, pageWidth, pageHeight, "F");
  };

  // --- PAGE 1: IMAGES ---
  drawBackground();
  
  // Header
  doc.setTextColor(0, 255, 255); // Neon Cyan
  doc.setFont("courier", "bold");
  doc.setFontSize(22);
  doc.text("PURPLE CANARY // FORENSIC REPORT", margin, 25);
  
  doc.setTextColor(143, 0, 255); // Ultra Violet
  doc.setFontSize(10);
  doc.text(`CASE ID: ${Date.now().toString(36).toUpperCase()}`, margin, 32);

  // Images
  const imgY = 50;
  
  try {
    if (bufferPrimary && bufferSecondary) {
        // Dual Mode
        const imgW = 80;
        const imgH = 80;
        
        doc.addImage(`data:image/png;base64,${bufferPrimary}`, "PNG", margin, imgY, imgW, imgH);
        doc.setTextColor(143, 0, 255);
        doc.text("365nm Band", margin, imgY + imgH + 5);

        doc.addImage(`data:image/png;base64,${bufferSecondary}`, "PNG", pageWidth - margin - imgW, imgY, imgW, imgH);
        doc.setTextColor(0, 255, 255);
        doc.text("395nm Band", pageWidth - margin - imgW, imgY + imgH + 5);
    } else if (bufferPrimary) {
        // Single Mode
        const imgW = 120;
        const imgH = 120;
        const xPos = (pageWidth - imgW) / 2;
        
        doc.addImage(`data:image/png;base64,${bufferPrimary}`, "PNG", xPos, imgY, imgW, imgH);
        doc.setTextColor(0, 255, 255);
        doc.text("Source Capture Analysis", xPos, imgY + imgH + 5);
    }
  } catch (e) {
    console.error("Error adding images to PDF", e);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("Page 1 of 2: Visual Evidence", pageWidth / 2, pageHeight - 10, { align: "center" });

  // --- PAGE 2: DETERMINISTIC REPORT ---
  doc.addPage();
  drawBackground();

  doc.setTextColor(0, 255, 255);
  doc.setFontSize(16);
  doc.text("DETERMINISTIC SPECTRAL ANALYSIS", margin, 25);
  
  let y = 32;
  if (geminiAnalysis) {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(`AI Forensic Verdict: ${geminiAnalysis.forensicVerdict}`, margin, y);
      y += 5;
      doc.text(`Substrate Validation: ${geminiAnalysis.isTLCPaper ? 'Valid' : 'Invalid'}`, margin, y);
      y += 5;
      doc.text(`Classes Detected: ${geminiAnalysis.classesDetected.join(', ')}`, margin, y);
      y += 7;
      
      doc.setTextColor(255, 170, 0); // SOP Color
      doc.text(`SOP Recommendation: ${geminiAnalysis.suggestedSOP}`, margin, y);
      y += 10;

      doc.setTextColor(200, 200, 200);
      doc.text("Confidence Scores:", margin, y);
      y += 5;
      doc.setFontSize(8);
      geminiAnalysis.confidenceScores.forEach((score: any) => {
        doc.text(`${score.category}: ${score.score}% - ${score.rationale}`, margin + 5, y);
        y += 4;
      });
      y += 5;

      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text("Visual Observations:", margin, y);
      y += 5;
      doc.setFontSize(9);
      const obsLines = doc.splitTextToSize(geminiAnalysis.visualObservations, pageWidth - (margin * 2));
      doc.text(obsLines, margin, y);
      y += (obsLines.length * 4) + 5;

      doc.setFontSize(10);
      doc.text("Detailed Analysis:", margin, y);
      y += 5;
      doc.setFontSize(9);
      const reportLines = doc.splitTextToSize(geminiAnalysis.detailedReportMarkdown, pageWidth - (margin * 2));
      doc.text(reportLines, margin, y);
      y += (reportLines.length * 4) + 10;
  } else {
      y = 40;
  }
  
  if (detections.length === 0) {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(12);
      doc.text("No signatures detected.", margin, y);
  } else {
      detections.forEach((det, i) => {
        if (y > pageHeight - 30) {
            doc.addPage();
            drawBackground();
            y = 30;
        }

        // Hazard Color
        if (det.hazard === 'LETHAL') doc.setTextColor(239, 68, 68);
        else if (det.hazard === 'CRITICAL') doc.setTextColor(0, 255, 255);
        else if (det.hazard === 'HIGH') doc.setTextColor(250, 204, 21);
        else doc.setTextColor(34, 197, 94);

        doc.setFontSize(12);
        doc.text(`[${det.hazard}] ${det.name}`, margin, y);
        y += 6;

        doc.setTextColor(200, 200, 200);
        doc.setFontSize(10);
        doc.text(`ID: ${det.id} | Rf: ${det.rf.toFixed(2)} | Shift: ${det.shift}`, margin, y);
        y += 5;
        
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(det.desc, pageWidth - (margin * 2));
        doc.text(descLines, margin, y);
        y += (descLines.length * 5) + 8;
      });
  }
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("Page 2 of 2: Deterministic Findings", pageWidth / 2, pageHeight - 10, { align: "center" });

  doc.save("PURPLE_CANARY_FULL_REPORT.pdf");
};
