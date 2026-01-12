import { Injectable } from '@angular/core';

/**
 * Service Angular pour ouvrir des PDFs avec le viewer natif du navigateur
 * Remplace le plugin Cordova pour la lecture de PDF
 * 
 * Usage:
 *   constructor(private pdfService: PdfViewerService) {}
 *   
 *   // Ouvrir depuis une URL
 *   this.pdfService.openFromUrl('https://example.com/document.pdf');
 *   
 *   // Ouvrir depuis un fichier
 *   this.pdfService.openFromFile(file);
 *   
 *   // Ouvrir depuis base64 (comme le faisait souvent Cordova)
 *   this.pdfService.openFromBase64(base64String);
 */
@Injectable({
  providedIn: 'root'
})
export class PdfViewerService {

  /**
   * Ouvre un PDF depuis une URL dans le viewer natif du navigateur
   * @param url URL du fichier PDF
   * @param target '_blank' pour nouvel onglet, '_self' pour même onglet
   */
  openFromUrl(url: string, target: string = '_blank'): void {
    window.open(url, target);
  }

  /**
   * Ouvre un fichier PDF (File object) dans le viewer natif
   * @param file Fichier PDF sélectionné par l'utilisateur
   */
  openFromFile(file: File): void {
    if (file.type !== 'application/pdf') {
      console.error('Le fichier doit être un PDF');
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    window.open(blobUrl, '_blank');

    // Nettoyer l'URL blob après un délai
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }

  /**
   * Ouvre un PDF depuis des données base64
   * Compatible avec les données retournées par les APIs ou le stockage local
   * @param base64Data Données PDF en base64 (avec ou sans préfixe data:)
   * @param filename Nom de fichier optionnel pour le téléchargement
   */
  openFromBase64(base64Data: string, filename?: string): void {
    // Retirer le préfixe data URL si présent
    const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');

    // Convertir base64 en Blob
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

  /**
   * Ouvre un PDF depuis un ArrayBuffer
   * Utile pour les réponses HTTP avec responseType: 'arraybuffer'
   * @param buffer ArrayBuffer contenant les données PDF
   */
  openFromArrayBuffer(buffer: ArrayBuffer): void {
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }

  /**
   * Ouvre un PDF depuis un Blob
   * @param blob Blob PDF
   */
  openFromBlob(blob: Blob): void {
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }

  /**
   * Télécharge un PDF au lieu de l'ouvrir
   * @param data Blob, File, ou base64 string
   * @param filename Nom du fichier à télécharger
   */
  download(data: Blob | File | string, filename: string = 'document.pdf'): void {
    let blob: Blob;

    if (typeof data === 'string') {
      // base64
      const base64 = data.replace(/^data:application\/pdf;base64,/, '');
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'application/pdf' });
    } else {
      blob = data;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
