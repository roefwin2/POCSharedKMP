import { useState, useRef, useCallback, useEffect } from 'react';
import './PdfViewer.css';

interface PdfViewerProps {
  platformName: string;
}

/**
 * Opens a PDF file using the browser's native PDF viewer
 * This is the simplest and most compatible approach
 */
function openPdfInNativeViewer(file: File): void {
  const blobUrl = URL.createObjectURL(file);
  window.open(blobUrl, '_blank');

  // Cleanup blob URL after a delay to allow the new tab to load
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

/**
 * Opens a PDF from a URL using the browser's native PDF viewer
 */
function openPdfFromUrl(url: string): void {
  window.open(url, '_blank');
}

/**
 * Opens a PDF from base64 data using the browser's native PDF viewer
 */
function openPdfFromBase64(base64Data: string): void {
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');

  // Convert base64 to blob
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });

  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

export function PdfViewer({ platformName }: PdfViewerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleOpenPdf = () => {
    if (selectedFile) {
      openPdfInNativeViewer(selectedFile);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      setSelectedFile(null);
    };
  }, []);

  return (
    <div className="pdf-viewer-container">
      <h1>PDF Reader POC</h1>
      <p className="platform-info">Platform: {platformName}</p>
      <p className="platform-info">Using native browser PDF viewer (window.open)</p>

      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="button-group">
        <button onClick={handleSelectFile} className="pdf-button">
          Select PDF File
        </button>

        {selectedFile && (
          <button onClick={handleOpenPdf} className="pdf-button open-button">
            Open in Native Viewer
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {selectedFile && (
        <div className="pdf-info">
          <h3>File Selected</h3>
          <p>Name: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      )}

      {!selectedFile && !error && (
        <p className="no-pdf">No PDF selected</p>
      )}
    </div>
  );
}

// Export utility functions for use in other frameworks (Angular, Vue, etc.)
export { openPdfInNativeViewer, openPdfFromUrl, openPdfFromBase64 };
