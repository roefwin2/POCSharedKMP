# Intégration KMP JavaScript dans Angular

Ce guide explique comment importer et utiliser le JavaScript généré par Kotlin Multiplatform (KMP) dans une application Angular.

## Architecture

```
KMP Project                          Angular Project
┌─────────────────────┐             ┌─────────────────────┐
│ shared/src/jsMain/  │             │ angular-app/        │
│   PdfReader.js.kt   │             │   src/              │
│         │           │             │     app/            │
│         ▼           │             │       services/     │
│   ./gradlew         │             │         pdf.service │
│   :shared:js...     │             │                     │
│         │           │             │                     │
│         ▼           │             │                     │
│ shared/build/dist/  │──copier────>│ src/assets/kmp/     │
│   js/development/   │             │   shared.mjs        │
│     shared.mjs      │             │   kotlin-*.mjs      │
└─────────────────────┘             └─────────────────────┘
```

## Étapes d'intégration

### 1. Compiler le module KMP pour JavaScript

```bash
# Dans le projet KMP
./gradlew :shared:jsBrowserDevelopmentLibraryDistribution
```

Les fichiers générés se trouvent dans :
```
shared/build/dist/js/developmentLibrary/
├── shared.mjs              # Votre code Kotlin compilé
├── kotlin-kotlin-stdlib.mjs # Standard library Kotlin
└── kotlin_org_*.mjs        # Autres dépendances
```

### 2. Copier les fichiers dans votre projet Angular

```bash
# Créer le dossier pour les fichiers KMP
mkdir -p src/assets/kmp

# Copier les fichiers nécessaires
cp /path/to/kmp-project/shared/build/dist/js/developmentLibrary/*.mjs src/assets/kmp/
```

### 3. Créer le wrapper TypeScript

Créez un fichier `src/app/services/kmp-pdf.service.ts` :

```typescript
import { Injectable } from '@angular/core';

// Type definitions pour les classes KMP exportées
declare class PdfViewerService {
  openFromUrl(url: string, target?: string): void;
  openFromBase64(base64Data: string): void;
  openFromArrayBuffer(buffer: ArrayBuffer): void;
  openFromBlob(blob: Blob): void;
  download(data: string | Blob, filename?: string): void;
}

@Injectable({
  providedIn: 'root'
})
export class KmpPdfService {
  private pdfViewerService: PdfViewerService | null = null;
  private loadPromise: Promise<void> | null = null;

  /**
   * Charge le module KMP de manière asynchrone
   */
  private async loadKmpModule(): Promise<void> {
    if (this.pdfViewerService) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        // Import dynamique du module KMP
        const kmpModule = await import('/assets/kmp/shared.mjs');
        this.pdfViewerService = new kmpModule.PdfViewerService();
        console.log('KMP PdfViewerService chargé avec succès');
      } catch (error) {
        console.error('Erreur lors du chargement du module KMP:', error);
        throw error;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Ouvre un PDF depuis une URL
   */
  async openFromUrl(url: string, target: string = '_blank'): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.openFromUrl(url, target);
  }

  /**
   * Ouvre un PDF depuis des données base64
   */
  async openFromBase64(base64Data: string): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.openFromBase64(base64Data);
  }

  /**
   * Ouvre un PDF depuis un ArrayBuffer
   */
  async openFromArrayBuffer(buffer: ArrayBuffer): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.openFromArrayBuffer(buffer);
  }

  /**
   * Ouvre un PDF depuis un Blob
   */
  async openFromBlob(blob: Blob): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.openFromBlob(blob);
  }

  /**
   * Télécharge un PDF
   */
  async download(data: string | Blob, filename: string = 'document.pdf'): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService!.download(data, filename);
  }
}
```

### 4. Configurer Angular pour les modules ES

Dans `angular.json`, ajoutez les assets KMP :

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              "src/favicon.ico",
              "src/assets",
              {
                "glob": "*.mjs",
                "input": "src/assets/kmp",
                "output": "/assets/kmp"
              }
            ]
          }
        }
      }
    }
  }
}
```

### 5. Utiliser le service dans un composant

```typescript
import { Component } from '@angular/core';
import { KmpPdfService } from './services/kmp-pdf.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-pdf-viewer',
  template: `
    <div class="pdf-actions">
      <button (click)="openPdfUrl()">Ouvrir PDF depuis URL</button>
      <button (click)="openPdfBase64()">Ouvrir PDF base64</button>
      <input type="file" (change)="onFileSelected($event)" accept=".pdf">
    </div>
  `
})
export class PdfViewerComponent {
  constructor(
    private kmpPdfService: KmpPdfService,
    private http: HttpClient
  ) {}

  // Ouvrir un PDF depuis une URL
  async openPdfUrl(): Promise<void> {
    await this.kmpPdfService.openFromUrl('https://example.com/sample.pdf');
  }

  // Ouvrir un PDF depuis base64 (ex: réponse API)
  async openPdfBase64(): Promise<void> {
    // Exemple avec données base64 depuis une API
    this.http.get<{data: string}>('/api/document/123').subscribe(async response => {
      await this.kmpPdfService.openFromBase64(response.data);
    });
  }

  // Ouvrir un fichier PDF sélectionné
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      await this.kmpPdfService.openFromBlob(file);
    }
  }
}
```

## Migration depuis Cordova

### Avant (avec plugin Cordova)

```typescript
// Ancien code Cordova
declare var cordova: any;

openPdf(data: string) {
  cordova.plugins.fileOpener2.open(
    data,
    'application/pdf',
    { error: (e) => console.error(e) }
  );
}
```

### Après (avec KMP)

```typescript
import { KmpPdfService } from './services/kmp-pdf.service';

constructor(private kmpPdfService: KmpPdfService) {}

async openPdf(base64Data: string) {
  await this.kmpPdfService.openFromBase64(base64Data);
}
```

## Structure des fichiers Angular

```
angular-app/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   └── kmp-pdf.service.ts    # Wrapper service
│   │   └── components/
│   │       └── pdf-viewer/
│   │           └── pdf-viewer.component.ts
│   └── assets/
│       └── kmp/
│           ├── shared.mjs            # Code KMP compilé
│           └── kotlin-kotlin-stdlib.mjs
├── angular.json
└── tsconfig.json
```

## Dépannage

### Erreur: Module not found

Vérifiez que :
1. Les fichiers `.mjs` sont bien copiés dans `src/assets/kmp/`
2. Le chemin d'import dans le service est correct (`/assets/kmp/shared.mjs`)
3. Angular est configuré pour servir les assets

### Erreur: PdfViewerService is not a constructor

Vérifiez que :
1. Le module KMP a été recompilé après vos modifications
2. La classe `PdfViewerService` est bien exportée avec `@JsExport`

### CORS avec PDF externes

Si vous ouvrez des PDF depuis des URLs externes, assurez-vous que le serveur autorise CORS ou utilisez un proxy Angular.

## Script de build automatisé

Créez un script `scripts/copy-kmp.sh` :

```bash
#!/bin/bash
# Script pour copier les fichiers KMP compilés

KMP_OUTPUT="../path/to/kmp-project/shared/build/dist/js/developmentLibrary"
ANGULAR_ASSETS="src/assets/kmp"

# Compiler KMP
cd ../path/to/kmp-project
./gradlew :shared:jsBrowserDevelopmentLibraryDistribution

# Copier les fichiers
cd -
mkdir -p $ANGULAR_ASSETS
cp $KMP_OUTPUT/shared.mjs $ANGULAR_ASSETS/
cp $KMP_OUTPUT/kotlin-kotlin-stdlib.mjs $ANGULAR_ASSETS/

echo "Fichiers KMP copiés avec succès!"
```

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "build:kmp": "bash scripts/copy-kmp.sh",
    "prebuild": "npm run build:kmp"
  }
}
```
