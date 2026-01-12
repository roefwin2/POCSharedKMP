package org.shared.kmp

import kotlin.js.Promise

/**
 * External declarations for PDF.js library (optional, for advanced PDF parsing)
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
 * Web PDF Viewer Service - Exported for use in Angular/React/Vue applications
 * Uses native browser PDF viewer via window.open()
 *
 * Usage from JavaScript/TypeScript:
 *   import { PdfViewerService } from 'shared';
 *   const viewer = new PdfViewerService();
 *   viewer.openFromUrl('https://example.com/doc.pdf');
 *   viewer.openFromBase64(base64String);
 */
@OptIn(ExperimentalJsExport::class)
@JsExport
@JsName("PdfViewerService")
class PdfViewerService {

    /**
     * Opens a PDF from a URL in the native browser viewer
     * @param url URL of the PDF file
     * @param target '_blank' for new tab, '_self' for same tab
     */
    @JsName("openFromUrl")
    fun openFromUrl(url: String, target: String = "_blank") {
        js("window.open(url, target)")
    }

    /**
     * Opens a PDF from base64 data in the native browser viewer
     * Compatible with data returned from APIs or local storage
     * @param base64Data PDF data in base64 (with or without data: prefix)
     */
    @JsName("openFromBase64")
    fun openFromBase64(base64Data: String) {
        val base64 = if (base64Data.startsWith("data:")) {
            base64Data.substringAfter(",")
        } else {
            base64Data
        }

        // Decode base64 and create blob URL
        js("""
            (function() {
                var byteCharacters = atob(base64);
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                var blob = new Blob([byteArray], { type: 'application/pdf' });
                var blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
                setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 10000);
            })()
        """)
    }

    /**
     * Opens a PDF from an ArrayBuffer in the native browser viewer
     * Useful for HTTP responses with responseType: 'arraybuffer'
     * @param buffer ArrayBuffer containing PDF data
     */
    @JsName("openFromArrayBuffer")
    fun openFromArrayBuffer(buffer: dynamic) {
        js("""
            (function() {
                var blob = new Blob([buffer], { type: 'application/pdf' });
                var blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
                setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 10000);
            })()
        """)
    }

    /**
     * Opens a PDF from a Blob in the native browser viewer
     * @param blob PDF Blob
     */
    @JsName("openFromBlob")
    fun openFromBlob(blob: dynamic) {
        js("""
            (function() {
                var blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
                setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 10000);
            })()
        """)
    }

    /**
     * Downloads a PDF instead of opening it
     * @param data Blob or base64 string
     * @param filename Name of the file to download
     */
    @JsName("download")
    fun download(data: dynamic, filename: String = "document.pdf") {
        js("""
            (function() {
                var blob;
                if (typeof data === 'string') {
                    // base64
                    var base64 = data.replace(/^data:application\/pdf;base64,/, '');
                    var byteCharacters = atob(base64);
                    var byteNumbers = new Array(byteCharacters.length);
                    for (var i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    blob = new Blob([byteArray], { type: 'application/pdf' });
                } else {
                    blob = data;
                }
                var url = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                setTimeout(function() { URL.revokeObjectURL(url); }, 100);
            })()
        """)
    }
}

/**
 * Web implementation of PDF Reader (for advanced PDF parsing with PDF.js)
 */
class JsPdfReader : PdfReader {
    private var pdfDocument: PdfDocumentProxy? = null
    private var metadata: PdfMetadata? = null
    private var pageCount: Int = 0

    override fun loadPdf(data: ByteArray): PdfLoadResult {
        return try {
            val uint8Array = js("new Uint8Array(data)")
            PdfLoadResult.Success(0)
        } catch (e: Exception) {
            PdfLoadResult.Error("Failed to load PDF: ${e.message}")
        }
    }

    override fun getPageCount(): Int = pageCount

    override fun getMetadata(): PdfMetadata? = metadata

    override fun getPageText(pageIndex: Int): String? = null

    override fun isLoaded(): Boolean = pdfDocument != null

    override fun close() {
        pdfDocument = null
        metadata = null
        pageCount = 0
    }

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

    @JsName("getPageTextAsync")
    fun getPageTextAsync(pageIndex: Int, onSuccess: (String) -> Unit, onError: (String) -> Unit) {
        val document = pdfDocument
        if (document == null) {
            onError("No PDF loaded")
            return
        }

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
