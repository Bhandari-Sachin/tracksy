function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");

    if (!e.postData || !e.postData.contents) {
      throw new Error("No data received.");
    }

    const data = JSON.parse(e.postData.contents);

    if (!Array.isArray(data.records)) {
      throw new Error("Expected 'records' to be an array.");
    }

    const rows = data.records.map(r => [
      new Date(),                            // Timestamp
      r.date,                                // Local date (Helsinki)
      r.chef,
      r.sauce,
      r.cookingTemp,
      r.coolingTemp,
      `${r.coolingTimeFrom}–${r.coolingTimeTo}`
    ]);

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
