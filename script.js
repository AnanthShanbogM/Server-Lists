
document.addEventListener('DOMContentLoaded', () => {
  const tableElement = document.getElementById('server-table');
  let dataTable;

  document.getElementById('pdf-upload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async function() {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let rawText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str).join(' ');
          rawText += strings + '\n';
        }
        const rows = parseServerData(rawText);
        renderTable(rows);
      };
      reader.readAsArrayBuffer(file);
    }
  });

  function parseServerData(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const header = ["ID", "Server", "Location", "Category", "App Group", "Server Role", "IP Address", "OS", "Arch", "Specification", "Type", "Zone", "Level", "Purpose", "Status"];
    const data = [];
    for (let line of lines) {
      const parts = line.trim().split(/\s{2,}/);
      if (parts.length >= 6) data.push(parts);
    }
    return [header, ...data];
  }

  function renderTable(rows) {
    if (dataTable) dataTable.destroy();
    tableElement.innerHTML = '';
    const thead = tableElement.createTHead();
    const tbody = tableElement.createTBody();

    let headRow = thead.insertRow();
    rows[0].forEach(header => {
      let th = document.createElement('th');
      th.innerText = header;
      headRow.appendChild(th);
    });

    rows.slice(1).forEach(row => {
      let tr = tbody.insertRow();
      row.forEach(cell => {
        let td = tr.insertCell();
        td.contentEditable = true;
        td.innerText = cell;
      });
    });

    dataTable = new DataTable(tableElement);
  }

  document.getElementById('add-row').addEventListener('click', () => {
    const newRow = tableElement.insertRow();
    for (let i = 0; i < tableElement.rows[0].cells.length; i++) {
      const cell = newRow.insertCell();
      cell.contentEditable = true;
      cell.innerText = '';
    }
  });

  document.getElementById('export-csv').addEventListener('click', () => {
    let csv = [];
    for (let row of tableElement.rows) {
      const cells = Array.from(row.cells).map(td => `"${td.innerText.replace(/"/g, '""')}"`);
      csv.push(cells.join(','));
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ecl_servers.csv';
    link.click();
  });
});
