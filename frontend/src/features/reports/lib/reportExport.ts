function sanitizePdfText(value: string) {
  const replacements: Record<string, string> = {
    á: "a",
    é: "e",
    í: "i",
    ó: "o",
    ú: "u",
    Á: "A",
    É: "E",
    Í: "I",
    Ó: "O",
    Ú: "U",
    ñ: "n",
    Ñ: "N",
    ü: "u",
    Ü: "U",
  };

  return value
    .split("")
    .map((char) => replacements[char] ?? char)
    .join("");
}

function escapePdfString(value: string) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdfDocument(title: string, lines: string[]) {
  const linesPerPage = 48;
  const pages = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push([title]);
  }

  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];
  const fontObjectId = 3 + pages.length * 2;

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = "";

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectId = 3 + pageIndex * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    contentObjectIds.push(contentObjectId);

    const contentLines = [
      "BT",
      "/F1 10 Tf",
      "1 0 0 1 40 800 Tm",
      ...pageLines.map((line, lineIndex) =>
        lineIndex === 0
          ? `(${escapePdfString(line)}) Tj`
          : `0 -14 Td (${escapePdfString(line)}) Tj`,
      ),
      "ET",
    ];
    const stream = contentLines.join("\n");

    objects[pageObjectId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`;
  objects[fontObjectId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((objectBody, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objectBody}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openPrintWindow(title: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const popup = window.open("", "_blank", "width=420,height=900");
  if (!popup) {
    URL.revokeObjectURL(url);
    throw new Error("No fue posible abrir la ventana de impresion");
  }

  popup.location.href = url;
  popup.onload = () => {
    popup.focus();
    popup.print();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}

export function downloadTextPdf(filename: string, title: string, lines: string[]) {
  const pdf = buildPdfDocument(title, lines);
  const blob = new Blob([pdf], { type: "application/pdf" });
  downloadBlob(filename, blob);
}

export function exportHtmlTableToExcel(filename: string, title: string, bodyHtml: string) {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadBlob(filename, blob);
}

export function exportPlaceholderExcel(title: string) {
  exportHtmlTableToExcel(
    `${title.toLowerCase().replace(/\s+/g, "-")}.xls`,
    title,
    `<h1>${title}</h1><p>Reporte en desarrollo.</p>`,
  );
}

export function exportPlaceholderPdf(title: string) {
  downloadTextPdf(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`, title, [title, "", "Reporte en desarrollo."]);
}

export function printThermalReport(title: string, lines: string[]) {
  const content = lines.map((line) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("\n");
  openPrintWindow(
    title,
    `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>${title}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              margin: 0;
              background: #fff;
              color: #000;
              font-family: "Courier New", monospace;
            }
            .ticket {
              width: 80mm;
              box-sizing: border-box;
              padding: 4mm;
              font-size: 12px;
              line-height: 1.35;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <pre class="ticket">${content}</pre>
        </body>
      </html>
    `,
  );
}
