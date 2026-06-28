declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    styles?: any;
    headStyles?: any;
    alternateRowStyles?: any;
    [key: string]: any;
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;

  export default autoTable;
}
