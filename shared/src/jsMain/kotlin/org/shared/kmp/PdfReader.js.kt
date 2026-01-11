package org.shared.kmp

import kotlin.js.Promise

/**
 * External declarations for PDF.js library
 */
@JsModule("pdfjs-dist")
@JsNonModule
external object PdfJs {
    val GlobalWorkerOptions: GlobalWorkerOptions
    fun getDocument(data: PdfDataConfig): PdfLoadingTask
}

external interface GlobalWorkerOptions {
    var workerSrc: String
}

external interface PdfDataConfig {
    var data: dynamic
}

external interface PdfLoadingTask {
    val promise: Promise<PdfDocumentProxy>
}

external interface PdfDocumentProxy {
    val numPages: Int
    fun getPage(pageNumber: Int): Promise<PdfPageProxy>
    fun getMetadata(): Promise<PdfMetadataResult>
    fun destroy(): Promise<Unit>
}

external interface PdfPageProxy {
    fun getTextContent(): Promise<TextContent>
}

external interface TextContent {
    val items: Array<TextItem>
}

external interface TextItem {
    val str: String
}

external interface PdfMetadataResult {
    val info: PdfInfo?
}

external interface PdfInfo {
    val Title: String?
    val Author: String?
}

/**
 * Web implementation of PDF Reader using PDF.js library
 */
class JsPdfReader : PdfReader {
    private var pdfDocument: PdfDocumentProxy? = null
    private var metadata: PdfMetadata? = null
    private var pageCount: Int = 0
    
    override fun loadPdf(data: ByteArray): PdfLoadResult {
        // Note: In JS, PDF loading is async. This is a simplified sync wrapper.
        // For production, you'd want to use suspend functions or callbacks.
        return try {
            // Convert ByteArray to Uint8Array for PDF.js
            val uint8Array = js("new Uint8Array(data)")
            
            // This will be called from JS side with proper async handling
            PdfLoadResult.Success(0) // Placeholder - actual loading is async
        } catch (e: Exception) {
            PdfLoadResult.Error("Failed to load PDF: ${e.message}")
        }
    }
    
    override fun getPageCount(): Int = pageCount
    
    override fun getMetadata(): PdfMetadata? = metadata
    
    override fun getPageText(pageIndex: Int): String? {
        // Text extraction requires async operations in PDF.js
        return null
    }
    
    override fun isLoaded(): Boolean = pdfDocument != null
    
    override fun close() {
        pdfDocument = null
        metadata = null
        pageCount = 0
    }
    
    /**
     * Async PDF loading for JavaScript (to be called from JS/TS code)
     */
    @JsName("loadPdfAsync")
    fun loadPdfAsync(data: ByteArray, onSuccess: (Int) -> Unit, onError: (String) -> Unit) {
        try {
            val uint8Array = byteArrayToUint8Array(data)
            val config = js("{}").unsafeCast<PdfDataConfig>()
            config.data = uint8Array
            
            PdfJs.getDocument(config).promise.then { document ->
                pdfDocument = document
                pageCount = document.numPages
                
                document.getMetadata().then { meta ->
                    metadata = PdfMetadata(
                        title = meta.info?.Title,
                        author = meta.info?.Author,
                        pageCount = pageCount
                    )
                    onSuccess(pageCount)
                }.catch { 
                    // Metadata extraction failed, but document loaded
                    metadata = PdfMetadata(null, null, pageCount)
                    onSuccess(pageCount)
                }
            }.catch { error ->
                onError("Failed to load PDF: $error")
            }
        } catch (e: Exception) {
            onError("Failed to load PDF: ${e.message}")
        }
    }
    
    /**
     * Async text extraction for JavaScript
     */
    @JsName("getPageTextAsync")
    fun getPageTextAsync(pageIndex: Int, onSuccess: (String) -> Unit, onError: (String) -> Unit) {
        val document = pdfDocument
        if (document == null) {
            onError("No PDF loaded")
            return
        }
        
        // PDF.js uses 1-based page numbers
        document.getPage(pageIndex + 1).then { page ->
            page.getTextContent().then { textContent ->
                val text = textContent.items.joinToString(" ") { it.str }
                onSuccess(text)
            }.catch { error ->
                onError("Failed to extract text: $error")
            }
        }.catch { error ->
            onError("Failed to get page: $error")
        }
    }
    
    private fun byteArrayToUint8Array(data: ByteArray): dynamic {
        val array = js("new Uint8Array(data.length)")
        for (i in data.indices) {
            array[i] = data[i]
        }
        return array
    }
}

actual fun createPdfReader(): PdfReader = JsPdfReader()
