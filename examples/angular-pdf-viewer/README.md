# Angular PDF Viewer - Remplacement Cordova

Ce module permet d'ouvrir des fichiers PDF en utilisant le viewer natif du navigateur.
Il remplace les plugins Cordova comme `cordova-plugin-document-viewer` ou `cordova-plugin-file-opener2`.

## Installation

Copiez les fichiers suivants dans votre projet Angular :
- `pdf-viewer.service.ts` → `src/app/services/`
- `pdf-viewer.component.ts` → `src/app/components/` (optionnel)

## Usage

### 1. Utiliser le service directement (recommandé)

```typescript
import { Component } from '@angular/core';
import { PdfViewerService } from './services/pdf-viewer.service';

@Component({
  selector: 'app-my-component',
  template: `<button (click)="openPdf()">Ouvrir PDF</button>`
})
export class MyComponent {
  constructor(private pdfService: PdfViewerService) {}

  // Ouvrir depuis une URL
  openPdfFromUrl(): void {
    this.pdfService.openFromUrl('https://example.com/document.pdf');
  }

  // Ouvrir depuis base64 (comme Cordova le faisait souvent)
  openPdfFromBase64(): void {
    const base64Data = 'JVBERi0xLjQK...'; // Données PDF en base64
    this.pdfService.openFromBase64(base64Data);
  }

  // Ouvrir depuis une réponse HTTP
  openPdfFromApi(): void {
    this.http.get('api/documents/123', { responseType: 'arraybuffer' })
      .subscribe(data => {
        this.pdfService.openFromArrayBuffer(data);
      });
  }
}
```

### 2. Migration depuis Cordova

#### Avant (Cordova)
```typescript
// Avec cordova-plugin-document-viewer
cordova.plugins.DocumentViewer.viewDocument(
  filePath,
  'application/pdf',
  { title: 'Mon PDF' }
);

// Avec cordova-plugin-file-opener2
cordova.plugins.fileOpener2.open(
  filePath,
  'application/pdf',
  { error: (e) => console.error(e) }
);
```

#### Après (Angular natif)
```typescript
// Depuis une URL ou un chemin
this.pdfService.openFromUrl(fileUrl);

// Depuis base64 (souvent utilisé avec Cordova)
this.pdfService.openFromBase64(base64Data);

// Depuis un Blob (réponse API)
this.pdfService.openFromBlob(pdfBlob);
```

### 3. Utiliser le composant

```typescript
// Dans votre module ou composant standalone
import { PdfViewerComponent } from './components/pdf-viewer.component';

@Component({
  imports: [PdfViewerComponent],
  template: `<app-pdf-viewer></app-pdf-viewer>`
})
export class MyComponent {}
```

## Différences avec Cordova

| Fonctionnalité | Cordova | Angular Natif |
|----------------|---------|---------------|
| Viewer intégré dans l'app | Oui | Non (nouvel onglet) |
| Annotations | Selon plugin | Selon navigateur |
| Téléchargement | Manuel | Natif navigateur |
| Compatibilité | iOS/Android | Web + Mobile |
| Installation | Plugin natif | Aucune |

## API du Service

```typescript
// Ouvrir depuis différentes sources
openFromUrl(url: string, target?: string): void
openFromFile(file: File): void
openFromBase64(base64Data: string): void
openFromArrayBuffer(buffer: ArrayBuffer): void
openFromBlob(blob: Blob): void

// Télécharger au lieu d'ouvrir
download(data: Blob | File | string, filename?: string): void
```

## Avantages

1. **Aucune dépendance** : Pas de plugin natif à installer
2. **Compatibilité** : Fonctionne sur tous les navigateurs modernes
3. **Maintenance** : Pas de problèmes de compatibilité Cordova/Capacitor
4. **Performance** : Le navigateur gère le rendu PDF nativement
