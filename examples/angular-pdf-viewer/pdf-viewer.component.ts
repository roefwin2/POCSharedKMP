import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerService } from './pdf-viewer.service';

/**
 * Composant Angular pour la sélection et l'ouverture de PDF
 * Utilise le viewer natif du navigateur (window.open)
 * 
 * Usage dans un template:
 *   <app-pdf-viewer></app-pdf-viewer>
 * 
 * Ou pour ouvrir directement un PDF depuis le code:
 *   constructor(private pdfService: PdfViewerService) {}
 *   this.pdfService.openFromUrl('https://example.com/doc.pdf');
 */
@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pdf-viewer-container">
      <h2>PDF Viewer</h2>
      
      <!-- Input file caché -->
      <input
        #fileInput
        type="file"
        accept="application/pdf"
        (change)="onFileSelected($event)"
        style="display: none"
      />
      
      <!-- Boutons -->
      <div class="button-group">
        <button (click)="selectFile()" class="btn btn-primary">
          Sélectionner un PDF
        </button>
        
        <button 
          *ngIf="selectedFile" 
          (click)="openPdf()" 
          class="btn btn-success"
        >
          Ouvrir dans le viewer natif
        </button>
      </div>
      
      <!-- Info fichier sélectionné -->
      <div *ngIf="selectedFile" class="file-info">
        <p><strong>Fichier:</strong> {{ selectedFile.name }}</p>
        <p><strong>Taille:</strong> {{ formatFileSize(selectedFile.size) }}</p>
      </div>
      
      <!-- Message d'erreur -->
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      text-align: center;
      padding: 20px;
      max-width: 500px;
      margin: 0 auto;
    }
    
    .button-group {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
      margin: 20px 0;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #0056b3;
    }
    
    .btn-success {
      background-color: #28a745;
      color: white;
    }
    
    .btn-success:hover {
      background-color: #1e7e34;
    }
    
    .file-info {
      background-color: #e8f5e9;
      padding: 15px;
      border-radius: 8px;
      text-align: left;
      margin-top: 15px;
    }
    
    .file-info p {
      margin: 5px 0;
    }
    
    .error-message {
      background-color: #ffebee;
      color: #c62828;
      padding: 10px;
      border-radius: 6px;
      margin-top: 15px;
    }
  `]
})
export class PdfViewerComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  selectedFile: File | null = null;
  error: string | null = null;

  constructor(private pdfService: PdfViewerService) {}

  selectFile(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        this.error = null;
      } else {
        this.error = 'Veuillez sélectionner un fichier PDF valide';
        this.selectedFile = null;
      }
    }
    
    // Reset input pour permettre de resélectionner le même fichier
    input.value = '';
  }

  openPdf(): void {
    if (this.selectedFile) {
      this.pdfService.openFromFile(this.selectedFile);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
