import { pdfjs } from 'react-pdf';

export const configurePdfWorker = (): boolean => {
  if (pdfjs.GlobalWorkerOptions.workerSrc) {
    return true;
  }

  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    return true;
  } catch (error) {
    console.error('Failed to configure PDF.js worker', error);
    return false;
  }
};
