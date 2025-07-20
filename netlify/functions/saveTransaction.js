const { google } = require("googleapis");

exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = "Transaksi"; // Pastikan sheet ini udah ada di Google Sheets kamu

    const { transaksi, tanggal, waktu, total, cash, change } = body;

    // Format transaksi jadi satu baris per item
    const values = transaksi.map(item => [
      tanggal,
      waktu,
      item.name,
      item.harga,
      item.qty,
      parseInt(item.harga) * item.qty,
      total,
      cash,
      change
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:I`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Transaksi berhasil disimpan." })
    };

  } catch (err) {
    console.error("Gagal simpan transaksi:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Gagal simpan transaksi" })
    };
  }
};
