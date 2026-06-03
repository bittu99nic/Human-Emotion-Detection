export function exportToCSV(data: any[], filename = "aura_emotion_report.csv") {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Headers row
  csvRows.push(headers.join(","));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape commas and quotes
      const escaped = ("" + val).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data: any, filename = "aura_emotion_report.json") {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}
