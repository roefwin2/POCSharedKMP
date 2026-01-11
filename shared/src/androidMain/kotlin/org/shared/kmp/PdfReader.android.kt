package org.shared.kmp

import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileOutputStream

/**
 * Android implementation of PDF Reader using native PdfRenderer API
 * Available since Android API 21 (Lollipop)
 */
class AndroidPdfReader : PdfReader {
    private var pdfRenderer: PdfRenderer? = null
    private var fileDescriptor: ParcelFileDescriptor? = null
    private var tempFile: File? = null
    private var metadata: PdfMetadata? = null
    
    override fun loadPdf(data: ByteArray): PdfLoadResult {
        return try {
            close() // Close any previously loaded PDF
            
            // Create temp file from byte array
            tempFile = File.createTempFile("pdf_", ".pdf").apply {
                deleteOnExit()
                FileOutputStream(this).use { it.write(data) }
            }
            
            fileDescriptor = ParcelFileDescriptor.open(
                tempFile,
                ParcelFileDescriptor.MODE_READ_ONLY
            )
            
            pdfRenderer = PdfRenderer(fileDescriptor!!)
            
            val pageCount = pdfRenderer!!.pageCount
            metadata = PdfMetadata(
                title = null, // PdfRenderer doesn't expose metadata
                author = null,
                pageCount = pageCount
            )
            
            PdfLoadResult.Success(pageCount)
        } catch (e: Exception) {
            close()
            PdfLoadResult.Error("Failed to load PDF: ${e.message}")
        }
    }
    
    override fun getPageCount(): Int = pdfRenderer?.pageCount ?: 0
    
    override fun getMetadata(): PdfMetadata? = metadata
    
    override fun getPageText(pageIndex: Int): String? {
        // PdfRenderer doesn't support text extraction natively
        // For text extraction, you would need a library like iText or PDFBox
        // This POC returns null to indicate text extraction isn't available
        return null
    }
    
    override fun isLoaded(): Boolean = pdfRenderer != null
    
    override fun close() {
        try {
            pdfRenderer?.close()
            fileDescriptor?.close()
            tempFile?.delete()
        } catch (e: Exception) {
            // Ignore cleanup errors
        } finally {
            pdfRenderer = null
            fileDescriptor = null
            tempFile = null
            metadata = null
        }
    }
    
    /**
     * Get a specific page for rendering (Android-specific)
     * @param pageIndex 0-based page index
     * @return PdfRenderer.Page or null if not available
     */
    fun getPage(pageIndex: Int): PdfRenderer.Page? {
        val renderer = pdfRenderer ?: return null
        if (pageIndex < 0 || pageIndex >= renderer.pageCount) return null
        return renderer.openPage(pageIndex)
    }
}

actual fun createPdfReader(): PdfReader = AndroidPdfReader()
