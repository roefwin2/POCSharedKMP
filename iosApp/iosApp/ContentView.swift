import SwiftUI
import Shared
import PDFKit
import UniformTypeIdentifiers

struct ContentView: View {
    @State private var pdfDocument: PDFDocument?
    @State private var pageCount: Int = 0
    @State private var pdfTitle: String?
    @State private var pdfAuthor: String?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showFilePicker = false

    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                Text("PDF Reader POC")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("Platform: \(Greeting().greet())")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Button(action: {
                    showFilePicker = true
                }) {
                    HStack {
                        Image(systemName: "doc.fill")
                        Text("Select PDF File")
                    }
                    .padding()
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }

                if isLoading {
                    ProgressView("Loading PDF...")
                }

                if let error = errorMessage {
                    Text("Error: \(error)")
                        .foregroundColor(.red)
                        .padding()
                }

                if let document = pdfDocument {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("PDF Loaded Successfully!")
                            .font(.headline)
                            .foregroundColor(.green)

                        Text("Pages: \(pageCount)")

                        if let title = pdfTitle {
                            Text("Title: \(title)")
                        }

                        if let author = pdfAuthor {
                            Text("Author: \(author)")
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                    .padding(.horizontal)

                    // PDF View
                    PDFKitView(document: document)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .cornerRadius(10)
                        .padding()
                } else if !isLoading {
                    Spacer()
                    Text("No PDF loaded")
                        .foregroundColor(.secondary)
                    Spacer()
                }
            }
            .padding()
            .navigationBarHidden(true)
        }
        .fileImporter(
            isPresented: $showFilePicker,
            allowedContentTypes: [UTType.pdf],
            allowsMultipleSelection: false
        ) { result in
            handleFileImport(result)
        }
    }

    private func handleFileImport(_ result: Result<[URL], Error>) {
        isLoading = true
        errorMessage = nil

        switch result {
        case .success(let urls):
            guard let url = urls.first else {
                errorMessage = "No file selected"
                isLoading = false
                return
            }

            // Access the security-scoped resource
            guard url.startAccessingSecurityScopedResource() else {
                errorMessage = "Permission denied"
                isLoading = false
                return
            }

            defer { url.stopAccessingSecurityScopedResource() }

            if let document = PDFDocument(url: url) {
                pdfDocument = document
                pageCount = document.pageCount

                // Extract metadata
                if let attributes = document.documentAttributes {
                    pdfTitle = attributes[PDFDocumentAttribute.titleAttribute] as? String
                    pdfAuthor = attributes[PDFDocumentAttribute.authorAttribute] as? String
                }
            } else {
                errorMessage = "Failed to load PDF"
            }

        case .failure(let error):
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// PDFKit wrapper for SwiftUI
struct PDFKitView: UIViewRepresentable {
    let document: PDFDocument

    func makeUIView(context: Context) -> PDFView {
        let pdfView = PDFView()
        pdfView.document = document
        pdfView.autoScales = true
        pdfView.displayMode = .singlePageContinuous
        pdfView.displayDirection = .vertical
        return pdfView
    }

    func updateUIView(_ uiView: PDFView, context: Context) {
        uiView.document = document
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
