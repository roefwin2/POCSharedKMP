/**
 * Exemple de migration Cordova → Angular natif
 * 
 * Ce fichier montre comment remplacer les appels aux plugins Cordova
 * par des appels au service PdfViewerService
 */

import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PdfViewerService } from './pdf-viewer.service';

// =============================================================================
// EXEMPLE 1: Migration simple - Ouvrir un PDF depuis une URL
// =============================================================================

/**
 * AVANT (Cordova avec cordova-plugin-file-opener2)
 */
/*
declare var cordova: any;

openPdfCordova(filePath: string): void {
  cordova.plugins.fileOpener2.open(
    filePath,
    'application/pdf',
    {
      error: (e: any) => {
        console.error('Erreur ouverture PDF', e);
      },
      success: () => {
        console.log('PDF ouvert');
      }
    }
  );
}
*/

/**
 * APRÈS (Angular natif)
 */
@Component({
  selector: 'app-example1',
  template: `<button (click)="openPdf()">Ouvrir PDF</button>`
})
export class Example1Component {
  private pdfService = inject(PdfViewerService);

  openPdf(): void {
    // Simple et direct - pas de callback, pas de plugin
    this.pdfService.openFromUrl('https://example.com/document.pdf');
  }
}


// =============================================================================
// EXEMPLE 2: Migration - PDF depuis base64 (réponse API)
// =============================================================================

/**
 * AVANT (Cordova - souvent utilisé pour les PDF générés côté serveur)
 */
/*
// Le serveur retourne du base64, on doit créer un fichier temporaire
async openPdfFromBase64Cordova(base64: string): Promise<void> {
  const filePath = cordova.file.cacheDirectory + 'temp.pdf';
  
  // Écrire le fichier
  await this.file.writeFile(
    cordova.file.cacheDirectory,
    'temp.pdf',
    this.base64ToBlob(base64),
    { replace: true }
  );
  
  // Ouvrir le fichier
  cordova.plugins.fileOpener2.open(filePath, 'application/pdf');
}
*/

/**
 * APRÈS (Angular natif)
 */
@Component({
  selector: 'app-example2',
  template: `<button (click)="loadAndOpenPdf()">Charger et ouvrir PDF</button>`
})
export class Example2Component {
  private http = inject(HttpClient);
  private pdfService = inject(PdfViewerService);

  loadAndOpenPdf(): void {
    // Appel API qui retourne du base64
    this.http.get<{ pdf: string }>('/api/generate-pdf').subscribe({
      next: (response) => {
        // Direct - pas besoin de fichier temporaire !
        this.pdfService.openFromBase64(response.pdf);
      },
      error: (err) => console.error('Erreur chargement PDF', err)
    });
  }
}


// =============================================================================
// EXEMPLE 3: Migration - PDF en téléchargement binaire
// =============================================================================

/**
 * AVANT (Cordova)
 */
/*
async downloadAndOpenPdf(url: string): Promise<void> {
  const fileTransfer = new FileTransfer();
  const targetPath = cordova.file.cacheDirectory + 'download.pdf';
  
  fileTransfer.download(
    url,
    targetPath,
    (entry) => {
      cordova.plugins.fileOpener2.open(entry.toURL(), 'application/pdf');
    },
    (error) => {
      console.error('Erreur téléchargement', error);
    }
  );
}
*/

/**
 * APRÈS (Angular natif)
 */
@Component({
  selector: 'app-example3',
  template: `<button (click)="downloadAndOpen()">Télécharger et ouvrir</button>`
})
export class Example3Component {
  private http = inject(HttpClient);
  private pdfService = inject(PdfViewerService);

  downloadAndOpen(): void {
    this.http.get('/api/documents/123/pdf', { 
      responseType: 'arraybuffer' 
    }).subscribe({
      next: (data) => {
        // Ouvrir directement depuis le buffer - pas de fichier temporaire
        this.pdfService.openFromArrayBuffer(data);
      },
      error: (err) => console.error('Erreur', err)
    });
  }
}


// =============================================================================
// EXEMPLE 4: Migration - Document Viewer avec options
// =============================================================================

/**
 * AVANT (Cordova avec cordova-plugin-document-viewer)
 */
/*
openPdfWithOptions(url: string, title: string): void {
  cordova.plugins.DocumentViewer.viewDocument(
    url,
    'application/pdf',
    {
      title: title,
      documentView: { closeLabel: 'Fermer' },
      navigationView: { closeLabel: 'Fermer' },
      email: { enabled: true },
      print: { enabled: true },
      openWith: { enabled: true },
      bookmarks: { enabled: true },
      search: { enabled: true }
    },
    () => console.log('Fermé'),
    (error: any) => console.error('Erreur', error)
  );
}
*/

/**
 * APRÈS (Angular natif)
 * Note: Les options avancées sont gérées par le navigateur lui-même
 */
@Component({
  selector: 'app-example4',
  template: `<button (click)="openDocument()">Ouvrir document</button>`
})
export class Example4Component {
  private pdfService = inject(PdfViewerService);

  openDocument(): void {
    // Le navigateur fournit nativement:
    // - Recherche (Ctrl+F)
    // - Impression (Ctrl+P)
    // - Téléchargement
    // - Zoom
    // - Navigation par pages
    this.pdfService.openFromUrl('/documents/rapport.pdf');
  }
}


// =============================================================================
// EXEMPLE 5: Composant complet de migration
// =============================================================================

/**
 * Composant qui peut remplacer un écran Cordova complet
 */
@Component({
  selector: 'app-pdf-documents',
  template: `
    <div class="documents-list">
      <h2>Mes Documents</h2>
      
      <!-- Liste des documents -->
      <div *ngFor="let doc of documents" class="document-item">
        <span>{{ doc.name }}</span>
        <button (click)="openDocument(doc)">Voir</button>
        <button (click)="downloadDocument(doc)">Télécharger</button>
      </div>
      
      <!-- Upload nouveau document -->
      <input #fileInput type="file" accept="application/pdf" 
             (change)="onFileSelected($event)" style="display:none">
      <button (click)="fileInput.click()">Ajouter un PDF</button>
    </div>
  `
})
export class PdfDocumentsComponent {
  private http = inject(HttpClient);
  private pdfService = inject(PdfViewerService);

  documents = [
    { id: 1, name: 'Facture.pdf', url: '/api/docs/1' },
    { id: 2, name: 'Contrat.pdf', url: '/api/docs/2' },
  ];

  openDocument(doc: { url: string }): void {
    // Si c'est une URL directe
    if (doc.url.startsWith('http')) {
      this.pdfService.openFromUrl(doc.url);
      return;
    }

    // Si c'est une API qui retourne le PDF
    this.http.get(doc.url, { responseType: 'blob' }).subscribe({
      next: (blob) => this.pdfService.openFromBlob(blob),
      error: (err) => console.error('Erreur chargement', err)
    });
  }

  downloadDocument(doc: { name: string; url: string }): void {
    this.http.get(doc.url, { responseType: 'blob' }).subscribe({
      next: (blob) => this.pdfService.download(blob, doc.name),
      error: (err) => console.error('Erreur téléchargement', err)
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file?.type === 'application/pdf') {
      // Prévisualiser le PDF uploadé
      this.pdfService.openFromFile(file);
    }
  }
}
