package org.shared.kmp

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.ui.tooling.preview.Preview

@Composable
@Preview
fun App() {
    MaterialTheme {
        val context = LocalContext.current
        var pdfState by remember { mutableStateOf<PdfState>(PdfState.Empty) }
        var pdfReader by remember { mutableStateOf<AndroidPdfReader?>(null) }
        var renderedPages by remember { mutableStateOf<List<Bitmap>>(emptyList()) }

        val pdfLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.OpenDocument()
        ) { uri ->
            uri?.let {
                pdfState = PdfState.Loading
                try {
                    val inputStream = context.contentResolver.openInputStream(it)
                    val bytes = inputStream?.readBytes()
                    inputStream?.close()

                    if (bytes != null) {
                        val reader = AndroidPdfReader()
                        pdfReader = reader
                        when (val result = reader.loadPdf(bytes)) {
                            is PdfLoadResult.Success -> {
                                // Render all pages
                                val pages = mutableListOf<Bitmap>()
                                for (i in 0 until result.pageCount) {
                                    reader.getPage(i)?.let { page ->
                                        val bitmap = Bitmap.createBitmap(
                                            page.width * 2,
                                            page.height * 2,
                                            Bitmap.Config.ARGB_8888
                                        )
                                        page.render(
                                            bitmap,
                                            null,
                                            null,
                                            PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY
                                        )
                                        pages.add(bitmap)
                                        page.close()
                                    }
                                }
                                renderedPages = pages
                                pdfState = PdfState.Loaded(
                                    pageCount = result.pageCount,
                                    metadata = reader.getMetadata()
                                )
                            }
                            is PdfLoadResult.Error -> {
                                pdfState = PdfState.Error(result.message)
                            }
                        }
                    } else {
                        pdfState = PdfState.Error("Could not read PDF file")
                    }
                } catch (e: Exception) {
                    pdfState = PdfState.Error("Error: ${e.message}")
                }
            }
        }

        Column(
            modifier = Modifier
                .background(MaterialTheme.colorScheme.primaryContainer)
                .safeContentPadding()
                .fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "PDF Reader POC",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(16.dp)
            )

            Text(
                text = "Platform: ${Greeting().greet()}",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            Button(
                onClick = {
                    pdfLauncher.launch(arrayOf("application/pdf"))
                }
            ) {
                Text("Select PDF File")
            }

            Spacer(modifier = Modifier.height(16.dp))

            when (val state = pdfState) {
                is PdfState.Empty -> {
                    Text("No PDF loaded")
                }
                is PdfState.Loading -> {
                    CircularProgressIndicator()
                    Text("Loading PDF...")
                }
                is PdfState.Loaded -> {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "PDF Loaded Successfully!",
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text("Pages: ${state.pageCount}")
                            state.metadata?.title?.let { Text("Title: $it") }
                            state.metadata?.author?.let { Text("Author: $it") }
                        }
                    }

                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(renderedPages.withIndex().toList()) { (index, bitmap) ->
                            Card(
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "Page ${index + 1}",
                                        style = MaterialTheme.typography.labelMedium
                                    )
                                    Image(
                                        bitmap = bitmap.asImageBitmap(),
                                        contentDescription = "Page ${index + 1}",
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }
                        }
                    }
                }
                is PdfState.Error -> {
                    Text(
                        text = "Error: ${state.message}",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }

        DisposableEffect(Unit) {
            onDispose {
                pdfReader?.close()
                renderedPages.forEach { it.recycle() }
            }
        }
    }
}

sealed class PdfState {
    data object Empty : PdfState()
    data object Loading : PdfState()
    data class Loaded(val pageCount: Int, val metadata: PdfMetadata?) : PdfState()
    data class Error(val message: String) : PdfState()
}