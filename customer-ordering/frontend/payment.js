import {
  db,
  doc,
  getDoc,
  updateDoc
} from "./firebase-config.js";

const params = new URLSearchParams(window.location.search);
const docId = params.get("doc");
const orderParam = params.get("order");

const title = document.getElementById("payment-title");
const statusBox = document.getElementById("payment-status");
const summary = document.getElementById("order-summary");
const button = document.getElementById("payment-button");

let orderRef = null;
let order = null;

const money = n => `$${Number(n || 0).toFixed(2)}`;

function showStatus(message, kind = "info") {
  statusBox.textContent = message;
  statusBox.classList.remove("hidden");
  statusBox.style.background = kind === "error" ? "#f1d7cb" : "var(--soft)";
  statusBox.style.color = kind === "error" ? "var(--danger)" : "var(--accent)";
}

function renderOrder() {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemHtml = items.map(item => `
    <div class="cart-line">
      <div><b>${item.product_name || "Item"}</b><b>${money(item.line_total)}</b></div>
      <div><span>${item.quantity || 0} x ${item.unit || "unit"}</span><span>${money(item.unit_price)} each</span></div>
    </div>
  `).join("") || '<p class="hint">No item details found for this order.</p>';

  title.textContent = `Order ${order.order_id || orderParam || docId}`;
  summary.innerHTML = `
    <div class="payment-box">
      <p><b>Buyer:</b> ${order.buyer_name || "-"}</p>
      <p><b>Group:</b> ${order.group_buy_number || order.group_buy_id || "-"}</p>
      <p><b>Payment status:</b> ${String(order.payment_status || "unpaid").replace("_", " ")}</p>
      <p><b>Estimated total:</b> ${money(order.final_total || order.subtotal)}</p>
    </div>
    <h3>Items</h3>
    ${itemHtml}
  `;

  if (order.payment_status === "payment_sent") {
    button.disabled = true;
    showStatus("Payment already submitted. Admin will verify it.");
  } else if (order.payment_status === "paid") {
    button.disabled = true;
    showStatus("This order is already marked as paid.");
  } else {
    button.disabled = false;
  }
}

async function loadOrder() {
  if (!docId) {
    title.textContent = "Order not found";
    summary.innerHTML = '<p class="error">Missing Firebase order document ID in the payment link.</p>';
    return;
  }

  try {
    orderRef = doc(db, "orders", docId);
    const snapshot = await getDoc(orderRef);
    if (!snapshot.exists()) {
      title.textContent = "Order not found";
      summary.innerHTML = '<p class="error">This payment link does not match an existing Firebase order.</p>';
      return;
    }
    order = { firebase_doc_id: snapshot.id, ...snapshot.data() };
    renderOrder();
  } catch (error) {
    console.error("Failed to load payment order:", error);
    title.textContent = "Order unavailable";
    summary.innerHTML = '<p class="error">Could not load this order. Check Firebase rules and connection.</p>';
  }
}

button.addEventListener("click", async () => {
  if (!orderRef || !order) return;
  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    await updateDoc(orderRef, {
      payment_status: "payment_sent",
      payment_method: "paynow_placeholder",
      payment_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    order.payment_status = "payment_sent";
    button.textContent = "Payment submitted";
    renderOrder();
    showStatus("Payment submitted. Admin will verify and mark paid.");
  } catch (error) {
    console.error("Failed to submit payment:", error);
    button.disabled = false;
    button.textContent = "I have made payment";
    showStatus("Payment update failed. Check Firebase rules and try again.", "error");
  }
});

loadOrder();
