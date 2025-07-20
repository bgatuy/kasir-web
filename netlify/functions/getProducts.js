const { google } = require("googleapis");

exports.handler = async function (event, context) {
  try {
    // Fix private key \n dari Netlify ENV
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = "Produk!A2:D"; // Ambil data produk dari baris kedua

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values || [];

    // Map ke format produk, fallback kosong kalau ada field kosong
    const products = rows.map((row) => ({
      id: row[0] || '',
      name: row[1] || '',
      harga: row[2] || '',
      stok: row[3] || '',
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(products),
      headers: {
        'Content-Type': 'application/json',
      },
    };

  } catch (error) {
    console.error("🔥 Gagal ambil produk:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Gagal ambil data produk",
        detail: error.message,
      }),
    };
  }
};
