/**
 * TypeScript type definitions for KMP shared module
 *
 * Ce fichier définit les types TypeScript pour les classes
 * exportées par le module Kotlin/JS (shared.mjs)
 *
 * À placer dans: src/types/shared.d.ts
 */

declare module 'shared' {
  /**
   * Service pour ouvrir des PDFs avec le viewer natif du navigateur
   * Généré depuis Kotlin: org.shared.kmp.PdfViewerService
   */
  export class PdfViewerService {
    constructor();

    /**
     * Ouvre un PDF depuis une URL
     * @param url URL du fichier PDF
     * @param target '_blank' (défaut) ou '_self'
     */
    openFromUrl(url: string, target?: string): void;

    /**
     * Ouvre un PDF depuis des données base64
     * @param base64Data Données en base64 (avec ou sans préfixe data:)
     */
    openFromBase64(base64Data: string): void;

    /**
     * Ouvre un PDF depuis un ArrayBuffer
     * @param buffer ArrayBuffer contenant le PDF
     */
    openFromArrayBuffer(buffer: ArrayBuffer): void;

    /**
     * Ouvre un PDF depuis un Blob
     * @param blob Blob PDF
     */
    openFromBlob(blob: Blob): void;

    /**
     * Télécharge un PDF
     * @param data Blob ou string base64
     * @param filename Nom du fichier (défaut: 'document.pdf')
     */
    download(data: string | Blob, filename?: string): void;
  }

  /**
   * Classe de salutation (exemple KMP)
   */
  export class Greeting {
    constructor();
    greet(): string;
  }
}
