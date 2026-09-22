import type { ConceptNote } from '../data/conceptNotes';

const cloneWithInlineStyles = (source: HTMLElement) => {
  const clone = source.cloneNode(true) as HTMLElement;
  const sourceElements = [source, ...Array.from(source.querySelectorAll<HTMLElement | SVGElement>('*'))];
  const cloneElements = [clone, ...Array.from(clone.querySelectorAll<HTMLElement | SVGElement>('*'))];

  sourceElements.forEach((sourceElement, index) => {
    const targetElement = cloneElements[index];
    if (!targetElement) return;

    const computed = window.getComputedStyle(sourceElement);
    let inlineStyle = '';
    for (let propertyIndex = 0; propertyIndex < computed.length; propertyIndex += 1) {
      const property = computed.item(propertyIndex);
      inlineStyle += `${property}:${computed.getPropertyValue(property)};`;
    }
    targetElement.setAttribute('style', inlineStyle);
  });

  clone.querySelector('.kg-note-revision')?.remove();
  clone.style.maxWidth = '760px';
  clone.style.margin = '0 auto';
  clone.style.padding = '0';
  clone.style.background = '#fff';
  return clone;
};

export const createConceptNotePdfBlob = async (note: ConceptNote, noteElement: HTMLElement) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  await document.fonts.ready;
  const exportHost = document.createElement('div');
  Object.assign(exportHost.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: '760px',
    padding: '32px',
    background: '#fff',
    zIndex: '-1',
  });
  const exportNote = cloneWithInlineStyles(noteElement);
  exportHost.appendChild(exportNote);
  document.body.appendChild(exportHost);

  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    pdf.setProperties({ title: `${note.title} 개념 노트` });
    const pageWidth = 210;
    const pageHeight = 297;
    const pageMargin = 12;
    const contentWidth = pageWidth - pageMargin * 2;
    const contentBottom = pageHeight - pageMargin;
    const blockElements = Array.from(exportNote.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    let cursorY = pageMargin;

    for (const [index, block] of blockElements.entries()) {
      const canvas = await html2canvas(block, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const blockHeight = canvas.height * contentWidth / canvas.width;
      const marginTopPx = Number.parseFloat(window.getComputedStyle(block).marginTop) || 0;
      const marginTop = index === 0 ? 0 : Math.min(marginTopPx * contentWidth / block.offsetWidth, 8);

      if (cursorY + marginTop + blockHeight > contentBottom && cursorY > pageMargin) {
        pdf.addPage();
        cursorY = pageMargin;
      } else {
        cursorY += marginTop;
      }

      const availableHeight = contentBottom - cursorY;
      const renderedHeight = Math.min(blockHeight, availableHeight);
      const renderedWidth = contentWidth * renderedHeight / blockHeight;
      const renderedX = pageMargin + (contentWidth - renderedWidth) / 2;

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        renderedX,
        cursorY,
        renderedWidth,
        renderedHeight,
        undefined,
        'FAST',
      );
      cursorY += renderedHeight + 2;
    }

    return pdf.output('blob');
  } finally {
    exportHost.remove();
  }
};

export const conceptNotePdfFilename = (note: ConceptNote) =>
  `${note.title.replace(/[\\/:*?"<>|]/g, '_')}-개념노트.pdf`;
