const initialRows = [
  { description: 'Site Clearing & Preparation', qty: 1, rate: 25000 },
  { description: 'Foundation Work', qty: 1, rate: 120000 },
  { description: 'RCC Framing (G+1)', qty: 1, rate: 450000 },
  { description: 'Brick Masonry Work', qty: 1, rate: 210000 },
  { description: 'Roofing Work', qty: 1, rate: 100000 },
  { description: 'Doors & Windows (UPVC)', qty: 1, rate: 90000 },
  { description: 'Electrical Work', qty: 1, rate: 85000 },
  { description: 'Plumbing & Sanitary Work', qty: 1, rate: 75000 },
  { description: 'Plastering & Finishing', qty: 1, rate: 160000 },
  { description: 'Painting Work', qty: 1, rate: 70000 },
  { description: 'Miscellaneous & Contingencies', qty: 1, rate: 50000 }
];

const tableBody = document.getElementById('itemsTableBody');
const addRowBtn = document.getElementById('addRowBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const advanceInput = document.getElementById('advanceValue');

function setPdfExportMode(isExporting) {
  document.body.classList.toggle('pdf-export-mode', isExporting);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function toWords(num) {
  const ones = [
    'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertUnder1000(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    const rem = n % 100;
    const hundred = Math.floor(n / 100);
    return ones[hundred] + ' Hundred' + (rem ? ' ' + convertUnder1000(rem) : '');
  }

  const lakh = Math.floor(num / 100000);
  const remainder = num % 100000;
  const thousand = Math.floor(remainder / 1000);
  const rest = remainder % 1000;

  let parts = [];
  if (lakh) parts.push(convertUnder1000(lakh) + ' Lakh');
  if (thousand) parts.push(convertUnder1000(thousand) + ' Thousand');
  if (rest) parts.push(convertUnder1000(rest));

  const words = parts.join(' ');
  return words ? words + ' Only' : 'Zero Only';
}

function updateTotals() {
  const rows = tableBody.querySelectorAll('tr');
  let subtotal = 0;

  rows.forEach((row) => {
    const qtyEl = row.querySelector('.qty-input');
    const rateEl = row.querySelector('.rate-input');
    const qty = Number(qtyEl.value) || 0;
    const rate = Number(rateEl.value) || 0;
    const lineTotal = qty * rate;
    subtotal += lineTotal;

    const lineTotalEl = row.querySelector('.line-total');
    if (lineTotalEl) {
      lineTotalEl.textContent = formatCurrency(lineTotal);
    }
  });

  const grandTotal = subtotal;
  const advance = Number(advanceInput.value) || 0;
  const balance = Math.max(grandTotal - advance, 0);

  document.getElementById('subtotalValue').textContent = formatCurrency(subtotal);
  document.getElementById('balanceValue').textContent = formatCurrency(balance);
  document.getElementById('totalWords').textContent = toWords(Math.round(grandTotal));
}

function createRowItem({ description = '', qty = 1, rate = 0 } = {}) {
  const tr = document.createElement('tr');

  const sNo = tableBody.children.length + 1;

  tr.innerHTML = `
    <td data-label="S.No">${sNo}</td>
    <td data-label="Description of Work">
      <input type="text" class="description-input" value="${description}" aria-label="Description of work" />
    </td>
    <td data-label="Qty">
      <input type="number" min="0" step="0.01" class="qty-input" value="${qty}" aria-label="Quantity" />
    </td>
    <td data-label="Rate (AED)">
      <input type="number" min="0" step="0.01" class="rate-input" value="${rate}" aria-label="Rate" />
    </td>
    <td data-label="Amount (AED)" class="line-total">0.00</td>
    <td class="action-col" data-label="Action">
      <button class="remove-row-btn" type="button">Remove</button>
    </td>
  `;

  tr.querySelector('.description-input').addEventListener('input', updateTableNumbers);
  tr.querySelector('.qty-input').addEventListener('input', updateTableNumbers);
  tr.querySelector('.rate-input').addEventListener('input', updateTableNumbers);
  tr.querySelector('.remove-row-btn').addEventListener('click', () => {
    tr.remove();
    renumberRows();
    updateTotals();
  });

  return tr;
}

function renumberRows() {
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach((row, index) => {
    row.querySelector('td:first-child').textContent = index + 1;
  });
}

function addNewRow() {
  tableBody.appendChild(createRowItem({ description: '', qty: 1, rate: 0 }));
  renumberRows();
  updateTotals();
}

function updateTableNumbers() {
  renumberRows();
  updateTotals();
}

function renderInitialRows() {
  initialRows.forEach((row) => {
    tableBody.appendChild(createRowItem(row));
  });
  updateTotals();
}

addRowBtn.addEventListener('click', addNewRow);
advanceInput.addEventListener('input', updateTotals);

downloadPdfBtn.addEventListener('click', async () => {
  if (typeof html2canvas !== 'function' || !window.jspdf?.jsPDF) {
    alert('PDF libraries could not be loaded. Please check your internet connection and try again.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const element = document.getElementById('quotation-sheet');
  const inputElements = [...element.querySelectorAll('input')];
  const imageElements = window.location.protocol === 'file:'
    ? [...element.querySelectorAll('img')]
    : [];
  const exportValues = inputElements.map((input) => {
    const value = input.value || input.placeholder || '';
    const text = document.createElement('span');
    text.className = `export-input-value ${input.className}`;
    text.textContent = value;
    input.replaceWith(text);
    return { input, text };
  });
  const exportImages = imageElements.map((image) => {
    const placeholder = document.createElement('span');
    placeholder.className = 'export-image-placeholder';
    placeholder.style.cssText = `display: block; width: ${image.clientWidth}px; height: ${image.clientHeight}px;`;
    image.replaceWith(placeholder);
    return { image, placeholder };
  });

  setPdfExportMode(true);

  try {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth() - 12;
    const pdfHeight = pdf.internal.pageSize.getHeight() - 12;
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
    const y = (pdf.internal.pageSize.getHeight() - imgHeight) / 2;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
    pdf.save('star-bridge-quotation.pdf');
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert(`PDF download failed: ${error.message || 'Please try again.'}`);
  } finally {
    exportImages.forEach(({ image, placeholder }) => placeholder.replaceWith(image));
    exportValues.forEach(({ input, text }) => text.replaceWith(input));
    setPdfExportMode(false);
  }
});

renderInitialRows();
