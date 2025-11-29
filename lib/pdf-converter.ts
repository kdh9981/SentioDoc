import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertAsync = promisify(libre.convert);

/**
 * Converts an Office document to PDF
 * @param buffer - The file buffer (DOCX, XLSX, PPTX, etc.)
 * @returns PDF buffer
 */
export async function convertOfficeToPDF(buffer: Buffer): Promise<Buffer> {
  try {
    const pdfBuffer = await convertAsync(buffer, '.pdf', undefined);
    return pdfBuffer;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('Failed to convert Office document to PDF');
  }
}

/**
 * Check if a MIME type is an Office document that can be converted
 */
export function isConvertibleOfficeDocument(mimeType: string): boolean {
  const convertibleTypes = [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  ];

  return convertibleTypes.includes(mimeType);
}
