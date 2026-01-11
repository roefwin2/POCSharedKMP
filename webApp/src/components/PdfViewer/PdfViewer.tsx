import { useState, useRef, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './PdfViewer.css';

// Configure PDF.js worker for v3.x
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfMetadata {
  title?: string;
  author?: string;
  pageCount: number;
}

interface PdfViewerProps {
  platformName: string;
}

export function PdfViewer({ platformName }: PdfViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPdf = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setRenderedPages([]);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfDoc(pdf);
      
      // Get metadata
      const meta = await pdf.getMetadata();
      setMetadata({
        title: (meta.info as any)?.Title || undefined,
        author: (meta.info as any)?.Author || undefined,
        pageCount: pdf.numPages,
      });
      
      // Render all pages
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        pages.push(canvas.toDataURL());
      }
      
      setRenderedPages(pages);
    } catch (err) {
      setError('Failed to load PDF: ' + err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      loadPdf(file);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      pdfDoc?.destroy();
    };
  }, [pdfDoc]);

  return (
    <div className="pdf-viewer-container">
      <h1>PDF Reader POC</h1>
      <p className="platform-info">Platform: {platformName}</p>
      
      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <button onClick={handleButtonClick} className="pdf-button">
        Select PDF File
      </button>
      
      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading PDF...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {metadata && !isLoading && (
        <div className="pdf-info">
          <h3>PDF Loaded Successfully!</h3>
          <p>Pages: {metadata.pageCount}</p>
          {metadata.title && <p>Title: {metadata.title}</p>}
          {metadata.author && <p>Author: {metadata.author}</p>}
        </div>
      )}
      
      {renderedPages.length > 0 && (
        <div className="pdf-pages">
          {renderedPages.map((pageUrl, idx) => (
            <div key={idx} className="pdf-page">
              <div className="page-label">Page {idx + 1}</div>
              <img src={pageUrl} alt={'Page ' + (idx + 1)} />
            </div>
          ))}
        </div>
      )}
      
      {!pdfDoc && !isLoading && !error && (
        <p className="no-pdf">No PDF loaded</p>
      )}
    </div>
  );
}
