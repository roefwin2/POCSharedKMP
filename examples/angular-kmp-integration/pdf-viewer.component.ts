import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { KmpPdfService } from './kmp-pdf.service';

/**
 * Composant Angular démontrant l'utilisation du service PDF KMP
 *
 * Ce composant montre comment :
 * 1. Ouvrir un PDF depuis une URL
 * 2. Ouvrir un PDF depuis base64 (comme avec Cordova)
 * 3. Ouvrir un fichier PDF sélectionné par l'utilisateur
 * 4. Télécharger un PDF
 */
@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="pdf-viewer-container">
      <h2>PDF Viewer - Intégration KMP</h2>

      <p class="status" [class.loaded]="isKmpLoaded">
        Module KMP: {{ isKmpLoaded ? 'Chargé' : 'Non chargé' }}
      </p>

      <div class="button-group">
        <button class="pdf-button" (click)="preloadKmp()" [disabled]="isKmpLoaded">
          Précharger KMP
        </button>

        <button class="pdf-button" (click)="openPdfFromUrl()">
          Ouvrir PDF depuis URL
        </button>

        <button class="pdf-button" (click)="openPdfFromBase64()">
          Ouvrir PDF base64
        </button>

        <button class="pdf-button" (click)="downloadPdf()">
          Télécharger PDF
        </button>
      </div>

      <div class="file-input-group">
        <label for="pdf-file">Sélectionner un fichier PDF:</label>
        <input
          type="file"
          id="pdf-file"
          accept=".pdf,application/pdf"
          (change)="onFileSelected($event)"
        >
      </div>

      <div class="info-box">
        <h3>Comment ça marche ?</h3>
        <ol>
          <li>Le module KMP (<code>shared.mjs</code>) est chargé dynamiquement</li>
          <li>La classe <code>PdfViewerService</code> de Kotlin est instanciée</li>
          <li>Les méthodes Kotlin sont appelées depuis TypeScript</li>
          <li>Le PDF s'ouvre dans le viewer natif du navigateur</li>
        </ol>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    h2 {
      color: #333;
      text-align: center;
    }

    .status {
      text-align: center;
      padding: 8px;
      border-radius: 4px;
      background-color: #f8d7da;
      color: #721c24;
    }

    .status.loaded {
      background-color: #d4edda;
      color: #155724;
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin: 20px 0;
    }

    .pdf-button {
      padding: 12px 24px;
      background-color: #007AFF;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }

    .pdf-button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .pdf-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .file-input-group {
      margin: 20px 0;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .file-input-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .file-input-group input {
      width: 100%;
    }

    .info-box {
      background-color: #e7f3ff;
      border-left: 4px solid #007AFF;
      padding: 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .info-box h3 {
      margin-top: 0;
      color: #0056b3;
    }

    .info-box ol {
      margin-bottom: 0;
      padding-left: 20px;
    }

    .info-box code {
      background-color: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }

    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .success-message {
      background-color: #d4edda;
      color: #155724;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
    }
  `]
})
export class PdfViewerComponent implements OnInit {
  isKmpLoaded = false;
  errorMessage = '';
  successMessage = '';

  // Exemple de PDF base64 pour démonstration
  private readonly SAMPLE_PDF_BASE64 = 'JVBERi0xLjQKJeLjz9MKNCAwIG9iago8PAovRmlsdGVyIC9GbGF0ZURlY29kZQovTGVuZ3RoIDY2Cj4+CnN0cmVhbQp4nGNgGAWjYBQMBwAwAABAAENvbnRlbnRzCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAzIDAgUgo+PgplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1Byb2R1Y2VyIChLb3RsaW4gS01QKQO+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzUgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMTY2IDAwMDAwIG4gCjAwMDAwMDAyMTUgMDAwMDAgbiAKMDAwMDAwMDI2NiAwMDAwMCBuIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAxMjcgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCi9JbmZvIDIgMCBSCj4+CnN0YXJ0eHJlZgozMjMKJSVFT0YK';

  constructor(
    private kmpPdfService: KmpPdfService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Vérifier si le module KMP est déjà chargé
    this.isKmpLoaded = this.kmpPdfService.loaded;
  }

  /**
   * Précharge le module KMP pour éviter la latence au premier appel
   */
  async preloadKmp(): Promise<void> {
    try {
      this.clearMessages();
      await this.kmpPdfService.preload();
      this.isKmpLoaded = true;
      this.successMessage = 'Module KMP chargé avec succès!';
    } catch (error) {
      this.errorMessage = `Erreur de chargement: ${error}`;
    }
  }

  /**
   * Ouvre un PDF depuis une URL externe
   */
  async openPdfFromUrl(): Promise<void> {
    try {
      this.clearMessages();
      // URL d'exemple - remplacez par votre URL
      const pdfUrl = 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf';
      await this.kmpPdfService.openFromUrl(pdfUrl);
      this.isKmpLoaded = true;
      this.successMessage = 'PDF ouvert depuis URL';
    } catch (error) {
      this.errorMessage = `Erreur: ${error}`;
    }
  }

  /**
   * Ouvre un PDF depuis des données base64
   * Simule une réponse d'API comme avec Cordova
   */
  async openPdfFromBase64(): Promise<void> {
    try {
      this.clearMessages();
      await this.kmpPdfService.openFromBase64(this.SAMPLE_PDF_BASE64);
      this.isKmpLoaded = true;
      this.successMessage = 'PDF ouvert depuis base64';
    } catch (error) {
      this.errorMessage = `Erreur: ${error}`;
    }
  }

  /**
   * Télécharge un PDF
   */
  async downloadPdf(): Promise<void> {
    try {
      this.clearMessages();
      await this.kmpPdfService.download(this.SAMPLE_PDF_BASE64, 'sample-kmp.pdf');
      this.isKmpLoaded = true;
      this.successMessage = 'Téléchargement lancé!';
    } catch (error) {
      this.errorMessage = `Erreur: ${error}`;
    }
  }

  /**
   * Gère la sélection d'un fichier PDF par l'utilisateur
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Vérifier le type
    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Veuillez sélectionner un fichier PDF';
      return;
    }

    try {
      this.clearMessages();
      await this.kmpPdfService.openFromBlob(file);
      this.isKmpLoaded = true;
      this.successMessage = `PDF "${file.name}" ouvert avec succès`;
    } catch (error) {
      this.errorMessage = `Erreur: ${error}`;
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
