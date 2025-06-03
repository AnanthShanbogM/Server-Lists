
document.addEventListener('DOMContentLoaded', () => {
  let dataTable;
  const tableElement = document.getElementById('server-table');

  document.getElementById('pdf-upload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let rawText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          rawText += content.items.map(item => item.str).join(' ') + '\n';
        }
        const parsedData = parseData(rawText);
        populateTable(parsedData);
      };
      reader.readAsArrayBuffer(file);
    }
  });

  function parseData(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const data = [];
    lines.forEach(line => {
      const parts = line.split(/\s{2,}/);
      if (parts.length > 2) data.push(parts);
    });
    return data;
  }

  function populateTable(data) {
    tableElement.innerHTML = '<thead><tr>' + data[0].map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody></tbody>';
    const tbody = tableElement.querySelector('tbody');
    data.slice(1).forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.contentEditable = true;
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    if (dataTable) dataTable.destroy();
    dataTable = new DataTable('#server-table');
  }

  document.getElementById('add-row').addEventListener('click', () => {
    const row = tableElement.insertRow(-1);
    for (let i = 0; i < tableElement.rows[0].cells.length; i++) {
      const cell = row.insertCell();
      cell.contentEditable = true;
      cell.textContent = '';
    }
  });

  document.getElementById('export-csv').addEventListener('click', () => {
    let csv = '';
    for (let row of tableElement.rows) {
      const cells = Array.from(row.cells).map(td => `"${td.textContent}"`);
      csv += cells.join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ecl_servers.csv';
    link.click();
  });
});
