package org.shared.kmp

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import platform.Foundation.NSData
import platform.Foundation.create
import platform.PDFKit.PDFDocument
import platform.PDFKit.PDFPage

/**
 * iOS implementation of PDF Reader using native PDFKit framework
 * Available since iOS 11+
 */
@OptIn(ExperimentalForeignApi::class, kotlinx.cinterop.BetaInteropApi::class)
class IOSPdfReader : PdfReader {
    private var pdfDocument: PDFDocument? = null
    private var metadata: PdfMetadata? = null
    
    override fun loadPdf(data: ByteArray): PdfLoadResult {
        return try {
            close() // Close any previously loaded PDF
            
            // Convert ByteArray to NSData
            val nsData = data.usePinned { pinned ->
                NSData.create(bytes = pinned.addressOf(0), length = data.size.toULong())
            }
            
            pdfDocument = PDFDocument(data = nsData)
            
            val document = pdfDocument
            if (document == null) {
                return PdfLoadResult.Error("Failed to parse PDF data")
            }
            
            val pageCount = document.pageCount.toInt()
            
            // Extract metadata from document attributes
            val attributes = document.documentAttributes
            metadata = PdfMetadata(
                title = attributes?.get("Title") as? String,
                author = attributes?.get("Author") as? String,
                pageCount = pageCount
            )
            
            PdfLoadResult.Success(pageCount)
        } catch (e: Exception) {
            close()
            PdfLoadResult.Error("Failed to load PDF: ${e.message}")
        }
    }
    
    override fun getPageCount(): Int = pdfDocument?.pageCount?.toInt() ?: 0
    
    override fun getMetadata(): PdfMetadata? = metadata
    
    override fun getPageText(pageIndex: Int): String? {
        val document = pdfDocument ?: return null
        val page: PDFPage = document.pageAtIndex(pageIndex.toULong()) ?: return null
        return page.string
    }
    
    override fun isLoaded(): Boolean = pdfDocument != null
    
    override fun close() {
        pdfDocument = null
        metadata = null
    }
    
    /**
     * Get a specific page for rendering (iOS-specific)
     * @param pageIndex 0-based page index
     * @return PDFPage or null if not available
     */
    fun getPage(pageIndex: Int): PDFPage? {
        return pdfDocument?.pageAtIndex(pageIndex.toULong())
    }
}

actual fun createPdfReader(): PdfReader = IOSPdfReader()
