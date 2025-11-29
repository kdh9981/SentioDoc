import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertAsync = promisify(libre.convert);

/**
 * Convert Office documents (DOCX, PPTX, XLSX) to PDF
 * @param fileBuffer - Buffer containing the Office document
 * @param fileName - Original filename (used to determine file type)
 * @returns PDF buffer if successful, null if conversion fails
 */
export async function convertOfficeToPDF(
    fileBuffer: Buffer,
    fileName: string
): Promise<Buffer | null> {
    try {
        // Check if file extension is supported
        const ext = fileName.toLowerCase().split('.').pop();
        const supportedExts = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'];

        if (!supportedExts.includes(ext || '')) {
            console.log(`File extension .${ext} is not supported for PDF conversion`);
            return null;
        }

        console.log(`Converting ${fileName} to PDF...`);

        // Convert to PDF with timeout
        const pdfBuffer = await Promise.race([
            convertAsync(fileBuffer, '.pdf', undefined),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Conversion timeout after 30 seconds')), 30000)
            )
        ]) as Buffer;

        console.log(`Successfully converted ${fileName} to PDF (${pdfBuffer.length} bytes)`);
        return pdfBuffer;
    } catch (error) {
        console.error(`PDF conversion error for ${fileName}:`, error);
        return null;
    }
}

/**
 * Check if a MIME type represents an Office document
 * @param mimeType - MIME type string
 * @returns true if Office document, false otherwise
 */
export function isOfficeDocument(mimeType: string): boolean {
    const officeTypes = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    ];
    return officeTypes.includes(mimeType);
}
