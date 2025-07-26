let products = [];
let cart = [];

async function loadProductsFromSheet() {
  try {
    const res = await fetch("/.netlify/functions/getProducts");
    const data = await res.json();
    products = data;
    renderProductList();
  } catch (err) {
    console.error("Gagal ambil produk:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromSheet();

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    renderProductList(searchInput.value.toLowerCase());
  });

  window.addEventListener("afterprint", () => {
    const printArea = document.getElementById("printArea");
    if (printArea) printArea.style.display = "none";
  });
});

function renderProductList(filter = "") {
  const list = document.getElementById("productList");
  list.innerHTML = "";
  products
    .filter(p => p.name.toLowerCase().includes(filter))
    .forEach((p, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="product-item">
          <span class="product-label">${p.name} - Rp ${parseInt(p.harga).toLocaleString()}</span>
          <button class="small-btn" onclick="addToCart(${index})">+</button>
        </div>`;
      list.appendChild(li);
    });
}

function addToCart(index) {
  const product = products[index];
  const existing = cart.find(item => item.name === product.name);
  if (existing) {
    if (existing.qty < parseInt(product.stok)) {
      existing.qty++;
    } else {
      alert("Stok tidak mencukupi!");
    }
  } else {
    cart.push({ ...product, qty: 1 });
  }
  renderCart();
}

function renderCart() {
  const cartList = document.getElementById("cart");
  cartList.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    total += parseInt(item.harga) * item.qty;
    const li = document.createElement("li");
    li.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
        <span>${item.name} x${item.qty} Rp ${(parseInt(item.harga) * item.qty).toLocaleString()}</span>
        <button class="small-btn" onclick="removeFromCart(${index})">-</button>
      </div>`;
    cartList.appendChild(li);
  });
  document.getElementById("total").innerText = `Rp ${total.toLocaleString()}`;
}

function removeFromCart(index) {
  if (cart[index].qty > 1) {
    cart[index].qty--;
  } else {
    cart.splice(index, 1);
  }
  renderCart();
}

  document.getElementById("payBtn").addEventListener("click", function () {
  document.getElementById("cashInput").value = "";
  document.getElementById("changeDisplay").innerText = "Rp 0";
  document.getElementById("paymentPopup").classList.add("show");
  document.getElementById("cashInput").focus();
});

function closePaymentPopup() {
  document.getElementById("paymentPopup").classList.remove("show");
  document.getElementById("cashInput").value = "";
  document.getElementById("changeDisplay").innerText = "Rp 0";
}

function calculateChange() {
  const cash = parseInt(document.getElementById("cashInput").value);
  const total = cart.reduce((sum, item) => sum + parseInt(item.harga) * item.qty, 0);
  const change = cash - total;
  document.getElementById("changeDisplay").innerText = isNaN(change) ? "Rp 0" : `Rp ${change.toLocaleString()}`;
}

const strukText = document.getElementById("printArea");

function completeTransaction() {
  const total = cart.reduce((sum, item) => sum + parseInt(item.harga) * item.qty, 0);
  const cash = parseInt(document.getElementById("cashInput").value);
  const change = cash - total;

  if (isNaN(cash) || cash < total) {
    alert("Uang tidak cukup!");
    return;
  }

  const now = new Date();
  const tanggal = now.toLocaleDateString("id-ID");
  const waktu = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const totalLebar = 40;
  const centerText = (text) => {
  const padding = Math.floor((totalLebar - text.length) / 2);
  return " ".repeat(padding) + text;
};

  const garis = "-".repeat(totalLebar);
  let transaksiStr = "";

  cart.forEach(item => {
    const nama = item.name;
    const jumlah = item.qty;
    const harga = `Rp ${parseInt(item.harga).toLocaleString()}`;
    const totalItem = `Rp ${(parseInt(item.harga) * jumlah).toLocaleString()}`;
    transaksiStr += `${nama}\n`;
    transaksiStr += `${(`${jumlah} x ${harga}`).padEnd(totalLebar - totalItem.length)}${totalItem}\n`;
  });

  const struk = `
${centerText("TOKO BG ATUY")}
${centerText("Jl. Jalanin aja dulu")}
${garis}
Tanggal : ${tanggal}
Waktu   : ${waktu}
${garis}
${transaksiStr.trim()}
${garis}
${"Total".padEnd(totalLebar - `Rp ${total.toLocaleString()}`.length)}Rp ${total.toLocaleString()}
${"Tunai".padEnd(totalLebar - `Rp ${cash.toLocaleString()}`.length)}Rp ${cash.toLocaleString()}
${"Kembali".padEnd(totalLebar - `Rp ${change.toLocaleString()}`.length)}Rp ${change.toLocaleString()}
${garis}
${centerText("Terima kasih telah berbelanja")}
`.trim();

  const strukText = document.getElementById("printArea");
const lines = struk.split('\n');
const centeredLines = lines.map(line => {
  const visibleLength = [...line].filter(c => c >= ' ' && c <= '~').length;
  const left = Math.floor((totalLebar - visibleLength) / 2);
  return ' '.repeat(left) + line;
});
strukText.textContent = centeredLines.join('\n');


document.getElementById("strukPopup").classList.add("show");


// Tutup popup pembayaran setelah popup struk muncul
setTimeout(() => {
  closePaymentPopup();
}, 300);


  fetch("/.netlify/functions/saveTransaction", {
    method: "POST",
    body: JSON.stringify({ transaksi: cart, tanggal, waktu, total, cash, change })
  })
    .then(res => res.json())
    .then(data => console.log("Transaksi tersimpan:", data))
    .catch(err => console.error("Gagal simpan transaksi:", err));

  cart = [];
  renderCart();
  closePaymentPopup();
}

function printStruk() {
  const printArea = document.getElementById("printArea");
  window.print();

  setTimeout(() => {
    document.getElementById("strukPopup").classList.remove("show");
  }, 500);
}

function printCustomReceipt() {
  const strukArea = document.getElementById("strukPopup");
  const printWindow = window.open('', '', 'width=400,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Struk Pembayaran</title>
        <style>
          body {
            font-family: monospace;
            padding: 10px;
          }
        </style>
      </head>
      <body>
        ${strukArea.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();

  // 🧹 Tutup popup setelah cetak
  document.getElementById("strukPopup").classList.remove("show");
}

