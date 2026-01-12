# Guide pas à pas : Intégration KMP dans Angular

## Vue d'ensemble des fichiers

```
Ce que KMP génère:                    Ce que vous devez créer pour Angular:
─────────────────────                 ─────────────────────────────────────
shared.mjs         (code JS)    →     src/assets/kmp/shared.mjs
kotlin-*.mjs       (stdlib)     →     src/assets/kmp/kotlin-kotlin-stdlib.mjs
                                      src/types/shared.d.ts (types TypeScript)
                                      src/app/services/kmp-pdf.service.ts
```

## Étape 1 : Compiler le module KMP

```bash
# Dans le projet KMP
cd /chemin/vers/POCSharedKMP
./gradlew :shared:jsBrowserDevelopmentLibraryDistribution
```

Les fichiers générés sont dans :
```
shared/build/dist/js/developmentLibrary/
├── shared.mjs                    ← Code Kotlin compilé en JS
├── kotlin-kotlin-stdlib.mjs      ← Librairie standard Kotlin
└── shared.mjs.map               ← Source map (optionnel)
```

## Étape 2 : Créer la structure dans Angular

```bash
# Dans votre projet Angular
mkdir -p src/assets/kmp
mkdir -p src/types
```

## Étape 3 : Copier les fichiers KMP

```bash
# Copier les fichiers JavaScript
cp /chemin/vers/POCSharedKMP/shared/build/dist/js/developmentLibrary/shared.mjs src/assets/kmp/
cp /chemin/vers/POCSharedKMP/shared/build/dist/js/developmentLibrary/kotlin-kotlin-stdlib.mjs src/assets/kmp/
```

## Étape 4 : Créer le fichier de types TypeScript

Créez `src/types/shared.d.ts` :

```typescript
/**
 * Types TypeScript pour le module KMP
 */
declare module 'shared' {
  export class PdfViewerService {
    constructor();
    openFromUrl(url: string, target?: string): void;
    openFromBase64(base64Data: string): void;
    openFromArrayBuffer(buffer: ArrayBuffer): void;
    openFromBlob(blob: Blob): void;
    download(data: string | Blob, filename?: string): void;
  }

  export class Greeting {
    constructor();
    greet(): string;
  }
}
```

## Étape 5 : Configurer TypeScript

Dans `tsconfig.json`, ajoutez :

```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./src/types"],
    "paths": {
      "shared": ["./src/assets/kmp/shared.mjs"]
    }
  }
}
```

## Étape 6 : Créer le service Angular

Créez `src/app/services/kmp-pdf.service.ts` :

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KmpPdfService {
  private pdfViewerService: any = null;
  private loadPromise: Promise<void> | null = null;

  /**
   * Charge le module KMP dynamiquement
   */
  private async loadKmpModule(): Promise<void> {
    if (this.pdfViewerService) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      // Import dynamique du fichier .mjs
      const kmpModule = await import('/assets/kmp/shared.mjs');
      this.pdfViewerService = new kmpModule.PdfViewerService();
      console.log('KMP module loaded');
    })();

    return this.loadPromise;
  }

  async openFromUrl(url: string): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService.openFromUrl(url);
  }

  async openFromBase64(base64: string): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService.openFromBase64(base64);
  }

  async openFromBlob(blob: Blob): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService.openFromBlob(blob);
  }

  async download(data: string | Blob, filename: string = 'document.pdf'): Promise<void> {
    await this.loadKmpModule();
    this.pdfViewerService.download(data, filename);
  }
}
```

## Étape 7 : Utiliser dans un composant

```typescript
import { Component } from '@angular/core';
import { KmpPdfService } from './services/kmp-pdf.service';

@Component({
  selector: 'app-pdf-demo',
  template: `
    <button (click)="openPdf()">Ouvrir PDF</button>
    <button (click)="openBase64()">Ouvrir Base64</button>
    <input type="file" (change)="onFile($event)" accept=".pdf">
  `
})
export class PdfDemoComponent {
  constructor(private kmpPdf: KmpPdfService) {}

  async openPdf() {
    await this.kmpPdf.openFromUrl('https://example.com/doc.pdf');
  }

  async openBase64() {
    const base64 = 'JVBERi0xLjQK...'; // Vos données base64
    await this.kmpPdf.openFromBase64(base64);
  }

  async onFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      await this.kmpPdf.openFromBlob(file);
    }
  }
}
```

## Étape 8 : Configurer angular.json

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ]
          }
        }
      }
    }
  }
}
```

## Résumé visuel

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROJET ANGULAR                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   src/                                                          │
│   ├── app/                                                      │
│   │   ├── services/                                             │
│   │   │   └── kmp-pdf.service.ts   ← Wrapper Angular            │
│   │   └── components/                                           │
│   │       └── pdf-demo.component.ts                             │
│   │                                                             │
│   ├── assets/                                                   │
│   │   └── kmp/                      ← Fichiers KMP copiés       │
│   │       ├── shared.mjs            ← Code Kotlin → JS          │
│   │       └── kotlin-kotlin-stdlib.mjs                          │
│   │                                                             │
│   └── types/                                                    │
│       └── shared.d.ts               ← Types TypeScript          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Flux d'appel:
─────────────
Component → KmpPdfService → import('shared.mjs') → PdfViewerService (Kotlin)
                                    ↓
                            window.open(blobUrl)
                                    ↓
                            Viewer PDF natif du navigateur
```

## Script d'automatisation

Créez `scripts/update-kmp.sh` :

```bash
#!/bin/bash

KMP_PROJECT="/chemin/vers/POCSharedKMP"
ANGULAR_ASSETS="src/assets/kmp"

# 1. Compiler KMP
echo "Compilation KMP..."
cd $KMP_PROJECT
./gradlew :shared:jsBrowserDevelopmentLibraryDistribution

# 2. Copier les fichiers
echo "Copie des fichiers..."
cd -
mkdir -p $ANGULAR_ASSETS
cp $KMP_PROJECT/shared/build/dist/js/developmentLibrary/shared.mjs $ANGULAR_ASSETS/
cp $KMP_PROJECT/shared/build/dist/js/developmentLibrary/kotlin-kotlin-stdlib.mjs $ANGULAR_ASSETS/

echo "Terminé!"
```

## Migration Cordova → KMP

| Cordova (avant)                           | KMP (après)                      |
|-------------------------------------------|----------------------------------|
| `cordova.plugins.fileOpener2.open(path)`  | `kmpPdf.openFromUrl(url)`        |
| base64 → fichier → fileOpener2            | `kmpPdf.openFromBase64(base64)`  |
| FileTransfer + fileOpener2                | `kmpPdf.openFromUrl(url)`        |
