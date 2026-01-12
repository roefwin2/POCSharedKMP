import { Injectable } from '@angular/core';

/**
 * Type definitions pour les classes KMP exportées
 * Ces types correspondent aux classes définies dans PdfReader.js.kt
 */
declare class PdfViewerService {
  openFromUrl(url: string, target?: string): void;
  openFromBase64(base64Data: string): void;
  openFromArrayBuffer(buffer: ArrayBuffer): void;
  openFromBlob(blob: Blob): void;
  download(data: string | Blob, filename?: string): void;
}

/**
 * Interface du module KMP généré
 */
interface KmpSharedModule {
  PdfViewerService: new () => PdfViewerService;
  Greeting: new () => { greet(): string };
}

/**
 * Service Angular pour utiliser le PdfViewerService KMP
 *
 * Ce service charge dynamiquement le module JavaScript généré par KMP
 * et expose ses fonctionnalités de manière type-safe.
 *
 * Usage:
 *   constructor(private kmpPdfService: KmpPdfService) {}
 *
 *   // Ouvrir depuis URL
 *   await this.kmpPdfService.openFromUrl('https://example.com/doc.pdf');
 *
 *   // Ouvrir depuis base64
 *   await this.kmpPdfService.openFromBase64(base64String);
 */
@Injectable({
  providedIn: 'root'
})
export class KmpPdfService {
  private pdfViewerService: PdfViewerService | null = null;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;

  /**
   * Chemin vers les fichiers KMP compilés
   * Modifiez ce chemin selon votre configuration
   */
  private readonly KMP_MODULE_PATH = '/assets/kmp/shared.mjs';

  /**
   * Charge le module KMP de manière asynchrone (lazy loading)
   * Le module n'est chargé qu'une seule fois, puis mis en cache
   */
  private async loadKmpModule(): Promise<void> {
    // Si déjà chargé, retourner immédiatement
    if (this.isLoaded && this.pdfViewerService) {
      return;
    }

    // Si un chargement est en cours, attendre qu'il se termine
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Démarrer le chargement
    this.loadPromise = this.doLoadModule();
    return this.loadPromise;
  }

  private async doLoadModule(): Promise<void> {
    try {
      console.log('Chargement du module KMP depuis:', this.KMP_MODULE_PATH);

      // Import dynamique du module ES6 généré par KMP
      const kmpModule = await import(/* webpackIgnore: true */ this.KMP_MODULE_PATH) as KmpSharedModule;

      // Instancier le service
      this.pdfViewerService = new kmpModule.PdfViewerService();
      this.isLoaded = true;

      console.log('Module KMP PdfViewerService chargé avec succès');
    } catch (error) {
      this.loadPromise = null;
      console.error('Erreur lors du chargement du module KMP:', error);
      throw new Error(`Impossible de charger le module KMP: ${error}`);
    }
  }

  /**
   * Vérifie si le module KMP est chargé
   */
  get loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Force le préchargement du module KMP
   * Utile pour éviter la latence lors du premier appel
   */
  async preload(): Promise<void> {
    await this.loadKmpModule();
  }

  /**
   * Ouvre un PDF depuis une URL dans le viewer natif du navigateur
   * @param url URL du fichier PDF
   * @param target '_blank' pour nouvel onglet (défaut), '_self' pour même onglet
   */
  async openFromUrl(url: string, target: string = '_blank'): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.openFromUrl(url, target);
  }

  /**
   * Ouvre un PDF depuis des données base64
   * Compatible avec les réponses d'API retournant du base64
   * @param base64Data Données PDF en base64 (avec ou sans préfixe data:)
   */
  async openFromBase64(base64Data: string): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.openFromBase64(base64Data);
  }

  /**
   * Ouvre un PDF depuis un ArrayBuffer
   * Utile pour les réponses HTTP avec responseType: 'arraybuffer'
   * @param buffer ArrayBuffer contenant les données PDF
   */
  async openFromArrayBuffer(buffer: ArrayBuffer): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.openFromArrayBuffer(buffer);
  }

  /**
   * Ouvre un PDF depuis un Blob ou File
   * Utile pour les fichiers sélectionnés par l'utilisateur
   * @param blob Blob ou File PDF
   */
  async openFromBlob(blob: Blob): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.openFromBlob(blob);
  }

  /**
   * Télécharge un PDF au lieu de l'ouvrir
   * @param data Blob, File, ou chaîne base64
   * @param filename Nom du fichier à télécharger (défaut: 'document.pdf')
   */
  async download(data: string | Blob, filename: string = 'document.pdf'): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.download(data, filename);
  }
}
