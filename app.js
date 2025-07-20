let products = [];
let cart = [];

// Ambil data produk dari Google Sheets
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
});

function renderProductList(filter = "") {
  const list = document.getElementById("productList");
  list.innerHTML = "";
  products
    .filter(p => p.name.toLowerCase().includes(filter))
    .forEach((p, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
          <span>${p.name} - Rp ${parseInt(p.harga).toLocaleString()}</span>
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

function showPaymentPopup() {
  document.getElementById("paymentPopup").style.display = "flex";
  document.getElementById("cashInput").value = "";
  document.getElementById("changeDisplay").innerText = "Rp 0";
}

function closePaymentPopup() {
  document.getElementById("paymentPopup").style.display = "none";
}

function calculateChange() {
  const cash = parseInt(document.getElementById("cashInput").value);
  const total = cart.reduce((sum, item) => sum + parseInt(item.harga) * item.qty, 0);
  const change = cash - total;
  document.getElementById("changeDisplay").innerText = `Rp ${change.toLocaleString()}`;
}

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
  const waktu = now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });

  const transaksi = cart.map(item => {
    const nama = item.name;
    const harga = `Rp ${parseInt(item.harga).toLocaleString()}`;
    const jumlah = item.qty;
    const totalItem = `Rp ${(parseInt(item.harga) * item.qty).toLocaleString()}`;
    return `${nama}\n  ${harga} x${jumlah}    ${totalItem}`;
  }).join("\n\n");

  const struk = `Toko Bg Atuy\nJl. Jalan No. 123, Jakarta\n\nTanggal : ${tanggal}\nWaktu   : ${waktu}\n\n${transaksi}\n\n-------------------------\nTotal   : Rp ${total.toLocaleString()}\nTunai   : Rp ${cash.toLocaleString()}\nKembali : Rp ${change.toLocaleString()}\n-------------------------\n\n   Terima kasih atas\n    kunjungan Anda!`;

  const popup = window.open("", "Struk", "width=400,height=600");
  popup.document.open();
  popup.document.write(`<pre>${struk}</pre>`);
  popup.document.close();
  popup.print();

  // Simpan ke Google Sheets
  fetch("/.netlify/functions/saveTransaction", {
    method: "POST",
    body: JSON.stringify({
      transaksi: cart,
      tanggal,
      waktu,
      total,
      cash,
      change
    })
  })
    .then(res => res.json())
    .then(data => console.log("Transaksi tersimpan:", data))
    .catch(err => console.error("Gagal simpan transaksi:", err));

  cart = [];
  renderCart();
  closePaymentPopup();
}
