package org.shared.kmp

/**
 * Represents the result of loading a PDF
 */
sealed class PdfLoadResult {
    data class Success(val pageCount: Int) : PdfLoadResult()
    data class Error(val message: String) : PdfLoadResult()
}

/**
 * Represents PDF metadata
 */
data class PdfMetadata(
    val title: String?,
    val author: String?,
    val pageCount: Int
)

/**
 * Platform-agnostic PDF Reader interface
 */
interface PdfReader {
    /**
     * Load a PDF from a byte array
     * @param data The PDF file data
     * @return Result of loading the PDF
     */
    fun loadPdf(data: ByteArray): PdfLoadResult
    
    /**
     * Get the number of pages in the loaded PDF
     */
    fun getPageCount(): Int
    
    /**
     * Get metadata of the loaded PDF
     */
    fun getMetadata(): PdfMetadata?
    
    /**
     * Extract text from a specific page
     * @param pageIndex 0-based page index
     * @return Text content of the page, or null if extraction failed
     */
    fun getPageText(pageIndex: Int): String?
    
    /**
     * Check if a PDF is currently loaded
     */
    fun isLoaded(): Boolean
    
    /**
     * Close the PDF and release resources
     */
    fun close()
}

/**
 * Factory function to get the platform-specific PDF Reader
 */
expect fun createPdfReader(): PdfReader
