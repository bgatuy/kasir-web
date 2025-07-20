const { google } = require("googleapis");

exports.handler = async function(event, context) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = "Produk!A2:D"; // Ambil data dari baris kedua (baris pertama = header)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify([])
      };
    }

    const products = rows.map(row => ({
      id: row[0],
      name: row[1],
      harga: row[2],
      stok: row[3]
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(products)
    };

  } catch (error) {
    console.error("Gagal ambil produk:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Gagal ambil data produk" })
    };
  }
};
