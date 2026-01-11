import React from 'react';
import ReactDOM from 'react-dom/client';
import { PdfViewer } from './components/PdfViewer/PdfViewer.tsx';
import { Greeting as KotlinGreeting } from 'shared';

const greeting = new KotlinGreeting();
const platformName = greeting.greet();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PdfViewer platformName={platformName} />
  </React.StrictMode>
);