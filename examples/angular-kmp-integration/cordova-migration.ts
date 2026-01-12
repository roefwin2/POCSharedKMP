/**
 * Guide de migration Cordova vers KMP
 *
 * Ce fichier montre comment remplacer les appels Cordova
 * par les équivalents utilisant le module KMP généré.
 */

import { KmpPdfService } from './kmp-pdf.service';

// ============================================================================
// EXEMPLE 1: Remplacement de cordova-plugin-file-opener2
// ============================================================================

// --- AVANT (Cordova) ---
/*
declare var cordova: any;

function openPdfWithCordova(filePath: string) {
  cordova.plugins.fileOpener2.open(
    filePath,
    'application/pdf',
    {
      error: function(e) {
        console.error('Erreur FileOpener2', e);
      },
      success: function() {
        console.log('PDF ouvert');
      }
    }
  );
}
*/

// --- APRÈS (KMP) ---
async function openPdfWithKmp(kmpService: KmpPdfService, pdfUrl: string) {
  try {
    await kmpService.openFromUrl(pdfUrl);
    console.log('PDF ouvert');
  } catch (e) {
    console.error('Erreur KMP', e);
  }
}


// ============================================================================
// EXEMPLE 2: Remplacement de cordova-plugin-file pour base64
// ============================================================================

// --- AVANT (Cordova) ---
/*
declare var window: any;

function openBase64PdfWithCordova(base64Data: string, fileName: string) {
  // Écrire le fichier temporaire
  window.resolveLocalFileSystemURL(
    cordova.file.cacheDirectory,
    function(dirEntry) {
      dirEntry.getFile(fileName, { create: true }, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {
          // Convertir base64 en blob
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          fileWriter.write(blob);

          fileWriter.onwriteend = function() {
            // Ouvrir le fichier
            cordova.plugins.fileOpener2.open(
              fileEntry.nativeURL,
              'application/pdf'
            );
          };
        });
      });
    }
  );
}
*/

// --- APRÈS (KMP) ---
async function openBase64PdfWithKmp(kmpService: KmpPdfService, base64Data: string) {
  // Plus besoin d'écrire de fichier temporaire!
  // Le module KMP gère tout automatiquement
  await kmpService.openFromBase64(base64Data);
}


// ============================================================================
// EXEMPLE 3: Téléchargement de PDF depuis API
// ============================================================================

// --- AVANT (Cordova avec FileTransfer) ---
/*
declare var FileTransfer: any;
declare var cordova: any;

function downloadPdfWithCordova(serverUrl: string, fileName: string) {
  const fileTransfer = new FileTransfer();
  const targetPath = cordova.file.externalDataDirectory + fileName;

  fileTransfer.download(
    serverUrl,
    targetPath,
    function(entry) {
      // Ouvrir le fichier téléchargé
      cordova.plugins.fileOpener2.open(
        entry.nativeURL,
        'application/pdf'
      );
    },
    function(error) {
      console.error('Erreur de téléchargement', error);
    }
  );
}
*/

// --- APRÈS (KMP) ---
async function downloadPdfWithKmp(kmpService: KmpPdfService, serverUrl: string) {
  // Option 1: Ouvrir directement depuis l'URL
  await kmpService.openFromUrl(serverUrl);

  // Option 2: Télécharger via fetch puis ouvrir
  // const response = await fetch(serverUrl);
  // const blob = await response.blob();
  // await kmpService.openFromBlob(blob);
}


// ============================================================================
// EXEMPLE 4: Service Angular complet de migration
// ============================================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PdfMigrationService {
  constructor(
    private kmpPdfService: KmpPdfService,
    private http: HttpClient
  ) {}

  /**
   * Remplace: cordova.plugins.fileOpener2.open(url, 'application/pdf')
   */
  async openPdf(url: string): Promise<void> {
    await this.kmpPdfService.openFromUrl(url);
  }

  /**
   * Remplace: Lecture base64 depuis API + écriture fichier + fileOpener2
   */
  async openPdfFromApi(apiUrl: string): Promise<void> {
    // Récupérer le PDF en base64 depuis l'API
    const response = await this.http.get<{data: string}>(apiUrl).toPromise();
    if (response?.data) {
      await this.kmpPdfService.openFromBase64(response.data);
    }
  }

  /**
   * Remplace: FileTransfer.download + fileOpener2
   */
  async downloadAndOpenPdf(downloadUrl: string): Promise<void> {
    // Télécharger en ArrayBuffer
    const buffer = await this.http.get(downloadUrl, {
      responseType: 'arraybuffer'
    }).toPromise();

    if (buffer) {
      await this.kmpPdfService.openFromArrayBuffer(buffer);
    }
  }

  /**
   * Remplace: Sauvegarde locale + fileOpener2
   */
  async savePdf(base64Data: string, filename: string): Promise<void> {
    await this.kmpPdfService.download(base64Data, filename);
  }
}


// ============================================================================
// EXEMPLE 5: Composant Angular migré
// ============================================================================

/*
// --- AVANT (Cordova) ---

@Component({...})
export class DocumentViewerComponent {
  viewDocument(doc: Document) {
    if (this.platform.is('cordova')) {
      // Code Cordova complexe...
      this.downloadAndOpenWithCordova(doc.url);
    } else {
      // Fallback web
      window.open(doc.url, '_blank');
    }
  }

  private downloadAndOpenWithCordova(url: string) {
    // 20+ lignes de code avec FileTransfer, resolveLocalFileSystemURL, etc.
  }
}

// --- APRÈS (KMP) ---

@Component({...})
export class DocumentViewerComponent {
  constructor(private kmpPdfService: KmpPdfService) {}

  async viewDocument(doc: Document) {
    // Même code pour web et mobile PWA!
    await this.kmpPdfService.openFromUrl(doc.url);
  }
}
*/


// ============================================================================
// TABLEAU DE CORRESPONDANCE
// ============================================================================

/*
+-----------------------------------------------+------------------------------------------+
| Cordova (Ancien)                              | KMP (Nouveau)                            |
+-----------------------------------------------+------------------------------------------+
| cordova.plugins.fileOpener2.open(url, mime)   | kmpPdfService.openFromUrl(url)           |
| FileTransfer.download(url, path) + open       | kmpPdfService.openFromUrl(url)           |
| Base64 -> File -> fileOpener2                 | kmpPdfService.openFromBase64(base64)     |
| Blob -> File -> fileOpener2                   | kmpPdfService.openFromBlob(blob)         |
| ArrayBuffer -> File -> fileOpener2            | kmpPdfService.openFromArrayBuffer(buf)   |
| File download with FileTransfer               | kmpPdfService.download(data, filename)   |
+-----------------------------------------------+------------------------------------------+
*/

export { openPdfWithKmp, openBase64PdfWithKmp, downloadPdfWithKmp };
