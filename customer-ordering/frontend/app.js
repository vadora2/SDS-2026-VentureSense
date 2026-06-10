import {
  db,
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  serverTimestamp
} from "./firebase-config.js";

const ORDER_KEY = "ventureSenseOrders";
const GROUP_KEY = "ventureSenseRegisteredGroupBuys";

const state = {
  seedGroups: [],
  registeredGroups: [],
  allGroups: [],
  products: [],
  active: null,
  activeProducts: [],
  cart: {},
  groupOrders: [],
  promos: [],
  promoError: false,
  unsubscribeOrders: null,
  unsubscribePromos: null
};

const $ = id => document.getElementById(id);
const money = n => `$${Number(n || 0).toFixed(2)}`;
const makeId = p => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const els = {
  title: $("page-title"),
  sub: $("page-subtitle"),
  access: $("access-screen"),
  register: $("register-screen"),
  ordering: $("ordering-screen"),
  cartContent: $("cart-content"),
  locked: $("locked-cart-message"),
  grid: $("product-grid"),
  cat: $("category-filter"),
  search: $("search-input"),
  count: $("product-count"),
  cartItems: $("cart-items"),
  subtotal: $("subtotal"),
  modal: $("modal"),
  modalBody: $("modal-body"),
  modalItems: $("modal-items"),
  promoPanel: $("promo-panel"),
  promoList: $("promo-list"),
  promoFallback: $("promo-fallback"),
  groupProgressTotal: $("group-progress-total")
};

function getJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function setJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val, null, 2));
}

function refreshGroups() {
  state.registeredGroups = getJSON(GROUP_KEY, []);
  const byId = new Map();
  [...state.seedGroups, ...state.registeredGroups].forEach(group => byId.set(group.id, group));
  state.allGroups = [...byId.values()];
}

async function init() {
  const data = await loadSeedCatalogue();
  await loadCatalogueFromFirestore(data);
  await seedDemoPromo();
  refreshGroups();
  setRegisterDefaults();
  renderRegisterProducts();
  bind();
  updatePreview();
}

async function loadSeedCatalogue() {
  const res = await fetch("catalogue.json");
  return res.json();
}

async function seedCatalogueToFirestore(data) {
  const now = new Date().toISOString();
  await Promise.all([
    ...(data.products || []).map(product => setDoc(doc(db, "products", product.id), {
      ...product,
      created_at: serverTimestamp(),
      updated_at: now,
      seeded_from_catalogue: true
    })),
    ...(data.group_buys || []).map(group => setDoc(doc(db, "group_buys", group.id), {
      ...group,
      product_ids: normalizeProductIds(group.product_ids),
      created_at: serverTimestamp(),
      updated_at: now,
      seeded_from_catalogue: true
    }))
  ]);
}

async function loadCatalogueFromFirestore(data) {
  state.seedGroups = data.group_buys || [];
  state.products = data.products || [];

  try {
    await seedCatalogueToFirestore(data);
    await syncLocalGroupBuysToFirestore(new Set((data.group_buys || []).map(group => group.id)));
    const [productSnapshot, groupSnapshot] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(collection(db, "group_buys"))
    ]);
    const products = productSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    const groups = groupSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    if (products.length) state.products = products;
    if (groups.length) state.seedGroups = groups;
  } catch (error) {
    console.error("Firestore catalogue unavailable; using catalogue.json fallback:", error);
  }
}

async function syncLocalGroupBuysToFirestore(seedGroupIds = new Set()) {
  const localGroups = getJSON(GROUP_KEY, []).filter(group => !seedGroupIds.has(group.id));
  if (!localGroups.length) return;
  await Promise.all(localGroups.map(group => setDoc(doc(db, "group_buys", group.id), {
    ...group,
    product_ids: normalizeProductIds(group.product_ids),
    updated_at: new Date().toISOString(),
    synced_from_local_storage: true
  })));
}

function normalizeProductIds(productIds) {
  if (Array.isArray(productIds)) return productIds;
  if (typeof productIds === "string") {
    try {
      const parsed = JSON.parse(productIds);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return productIds.split(",").map(id => id.trim()).filter(Boolean);
    }
  }
  return [];
}

async function seedDemoPromo() {
  try {
    const promoRef = doc(db, "promos", "demo_gb_002_group_spend_35");
    const snapshot = await getDoc(promoRef);
    if (snapshot.exists()) return;

    await setDoc(promoRef, {
      group_buy_id: "gb_002",
      title: "Unlock Bedok bulk savings",
      promo_type: "group_spend",
      threshold_amount: 35,
      product_id: "",
      product_name: "",
      threshold_quantity: 0,
      benefit_label: "Estimated bulk savings after admin review",
      status: "active",
      demo_seed: true,
      created_at: serverTimestamp(),
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Could not seed demo promo:", error);
  }
}

function bind() {
  $("access-form").addEventListener("submit", verifyGroup);
  $("show-register").addEventListener("click", showRegister);
  $("back-to-access").addEventListener("click", showAccess);
  $("register-form").addEventListener("submit", createGroup);
  $("select-all-products").addEventListener("click", toggleProducts);
  $("export-group-buys").addEventListener("click", exportGroups);
  ["new-group-number", "new-group-pin", "new-group-title", "new-group-cutoff", "new-group-collection"]
    .forEach(id => $(id).addEventListener("input", updatePreview));
  els.cat.addEventListener("change", renderProducts);
  els.search.addEventListener("input", renderProducts);
  els.grid.addEventListener("click", e => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    qty(b.dataset.id, b.dataset.action === "plus" ? 1 : -1);
  });
  $("clear-cart").addEventListener("click", () => {
    state.cart = {};
    renderProducts();
    renderCart();
    renderPromos();
  });
  $("order-form").addEventListener("submit", submitOrder);
  $("export-json").addEventListener("click", exportOrdersJSON);
  $("export-csv").addEventListener("click", exportOrdersCSV);
  $("close-modal").addEventListener("click", () => els.modal.classList.add("hidden"));
}

function stopGroupListeners() {
  if (state.unsubscribeOrders) state.unsubscribeOrders();
  if (state.unsubscribePromos) state.unsubscribePromos();
  state.unsubscribeOrders = null;
  state.unsubscribePromos = null;
}

function showAccess() {
  stopGroupListeners();
  els.access.classList.remove("hidden");
  els.register.classList.add("hidden");
  els.ordering.classList.add("hidden");
  els.title.textContent = "Group Buy Ordering";
  els.sub.textContent = "Customers enter a Group Buy Number + PIN. Admins can register new group buys here for demo testing.";
}

function showRegister() {
  stopGroupListeners();
  els.access.classList.add("hidden");
  els.register.classList.remove("hidden");
  els.ordering.classList.add("hidden");
  els.title.textContent = "Register New Group Buy";
  els.sub.textContent = "Create a group buy number, PIN, and available catalogue for customers.";
  updatePreview();
}

function unlock() {
  els.access.classList.add("hidden");
  els.register.classList.add("hidden");
  els.ordering.classList.remove("hidden");
  els.cartContent.classList.remove("hidden");
  els.locked.classList.add("hidden");
  els.title.textContent = state.active.title;
  const d = new Date(state.active.cutoff_at);
  els.sub.textContent = `${state.active.location} - Group Buy No. ${state.active.group_buy_number} - Closes ${d.toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })} - ${state.active.collection_slot}`;
  renderFilters();
  renderProducts();
  renderCart();
  listenForGroupProgress();
}

function setRegisterDefaults() {
  const n = String(state.allGroups.length + 1).padStart(3, "0");
  $("new-group-number").value = n;
  $("new-group-pin").value = String(Math.floor(1000 + Math.random() * 9000));
  $("new-group-title").value = `Group Buy #${n} - New Grocery Round`;
  $("new-group-location").value = "Tampines / East Region";
  $("new-group-min-note").value = "No minimum order for prototype.";
  $("new-group-payment-note").value = "Payment will be confirmed manually after stock review.";
}

function renderRegisterProducts() {
  const box = $("register-products");
  box.innerHTML = "";
  state.products.forEach(p => {
    const label = document.createElement("label");
    label.className = "check";
    label.innerHTML = `<input type="checkbox" value="${p.id}" checked><span>${p.name} <small>(${p.unit})</small></span><b>${money(p.price)}</b>`;
    box.appendChild(label);
  });
}

function updatePreview() {
  const num = $("new-group-number").value || "___";
  const pin = $("new-group-pin").value || "____";
  const title = $("new-group-title").value || `Group Buy #${num}`;
  const cut = $("new-group-cutoff").value
    ? new Date($("new-group-cutoff").value).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })
    : "[cutoff]";
  const coll = $("new-group-collection").value || "[collection slot]";
  $("whatsapp-template").textContent = `Venture Sense ${title} is open!\n\nOrder here:\n[prototype order link]\n\nGroup Buy Number: ${num}\nPIN: ${pin}\n\nCloses: ${cut}\nCollection: ${coll}\n\nNote: Submit your order first. Final payment will be confirmed after stock review.`;
}

function toggleProducts() {
  const boxes = [...document.querySelectorAll("#register-products input")];
  const check = boxes.some(b => !b.checked);
  boxes.forEach(b => b.checked = check);
}

async function createGroup(e) {
  e.preventDefault();
  refreshGroups();
  const num = $("new-group-number").value.trim();
  const pin = $("new-group-pin").value.trim();
  if (state.allGroups.some(g => String(g.group_buy_number) === num)) {
    alert("This Group Buy Number already exists.");
    return;
  }
  const product_ids = [...document.querySelectorAll("#register-products input:checked")].map(i => i.value);
  if (!product_ids.length) {
    alert("Select at least one product.");
    return;
  }
  const gb = {
    id: `gb_${num}`,
    group_buy_number: num,
    pin,
    title: $("new-group-title").value.trim(),
    status: "active",
    cutoff_at: new Date($("new-group-cutoff").value).toISOString(),
    collection_slot: $("new-group-collection").value.trim(),
    location: $("new-group-location").value.trim(),
    minimum_order_note: $("new-group-min-note").value.trim(),
    payment_note: $("new-group-payment-note").value.trim(),
    product_ids,
    created_in_frontend: true,
    created_at: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, "group_buys", gb.id), {
      ...gb,
      updated_at: nowTimestamp(),
      created_in_frontend: true
    });
  } catch (error) {
    console.error("Failed to save group buy to Firebase:", error);
    alert("Group buy saved locally, but Firebase upload failed. Check Firebase config/rules.");
  }

  const regs = getJSON(GROUP_KEY, []);
  regs.push(gb);
  setJSON(GROUP_KEY, regs);
  refreshGroups();
  $("register-message").textContent = `Created ${gb.title}. Customers can use ${num} / ${pin}.`;
  $("register-message").classList.remove("hidden");
  $("group-buy-number").value = num;
  $("group-buy-pin").value = pin;
  updatePreview();
}

function nowTimestamp() {
  return new Date().toISOString();
}

function verifyGroup(e) {
  e.preventDefault();
  refreshGroups();
  const num = $("group-buy-number").value.trim();
  const pin = $("group-buy-pin").value.trim();
  const gb = state.allGroups.find(g => String(g.group_buy_number) === num && String(g.pin) === pin && g.status === "active");
  if (!gb) {
    $("access-error").textContent = "Invalid group buy number or PIN.";
    $("access-error").classList.remove("hidden");
    return;
  }
  state.active = gb;
  state.activeProducts = state.products.filter(p => p.is_active && (!gb.product_ids || gb.product_ids.includes(p.id)));
  state.cart = {};
  state.groupOrders = [];
  state.promos = [];
  state.promoError = false;
  $("access-error").classList.add("hidden");
  unlock();
}

function renderFilters() {
  const cats = [...new Set(state.activeProducts.map(p => p.category))].sort();
  els.cat.innerHTML = '<option value="all">All categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join("");
}

function filtered() {
  const c = els.cat.value;
  const q = els.search.value.toLowerCase();
  return state.activeProducts.filter(p => (c === "all" || p.category === c) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));
}

function renderProducts() {
  const arr = filtered();
  els.count.textContent = `${arr.length} items`;
  els.grid.innerHTML = arr.map(p => `<article class="product"><img src="${p.image_url}" alt="${p.name}"><div class="body"><span class="kicker">${p.category}</span><h3>${p.name}</h3><p class="meta">${p.unit} - ${p.sku}</p><span class="pill">${p.stock_note || "Available"}</span><div class="product-foot"><b>${money(p.price)}</b><div class="qty"><button data-id="${p.id}" data-action="minus">-</button><span>${state.cart[p.id] || 0}</span><button data-id="${p.id}" data-action="plus">+</button></div></div></div></article>`).join("") || "<p>No products found.</p>";
}

function qty(id, delta) {
  const p = state.activeProducts.find(x => x.id === id);
  const next = Math.min(Math.max((state.cart[id] || 0) + delta, 0), p.max_qty || 99);
  if (next) state.cart[id] = next;
  else delete state.cart[id];
  renderProducts();
  renderCart();
  renderPromos();
}

function selected() {
  return Object.entries(state.cart).map(([id, q]) => {
    const p = state.activeProducts.find(x => x.id === id);
    return p ? { p, q, line: p.price * q } : null;
  }).filter(Boolean);
}

function renderCart() {
  const arr = selected();
  els.cartItems.innerHTML = arr.map(x => `<div class="cart-line"><div><b>${x.p.name}</b><b>${money(x.line)}</b></div><div><span>${x.q} x ${x.p.unit}</span><span>${money(x.p.price)} each</span></div></div>`).join("") || '<p class="hint">No items selected.</p>';
  els.subtotal.textContent = money(arr.reduce((s, x) => s + x.line, 0));
}

function listenForGroupProgress() {
  stopGroupListeners();
  els.promoPanel.classList.remove("hidden");
  renderPromos();

  try {
    const orderQuery = query(collection(db, "orders"), where("group_buy_id", "==", state.active.id));
    state.unsubscribeOrders = onSnapshot(orderQuery, snapshot => {
      state.groupOrders = snapshot.docs.map(docSnap => ({ firebase_doc_id: docSnap.id, ...docSnap.data() }));
      state.promoError = false;
      renderPromos();
    }, error => {
      console.error("Group order progress listener failed:", error);
      state.promoError = true;
      renderPromos();
    });

    const promoQuery = query(collection(db, "promos"), where("group_buy_id", "==", state.active.id));
    state.unsubscribePromos = onSnapshot(promoQuery, snapshot => {
      state.promos = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(promo => (promo.status || "active") === "active");
      state.promoError = false;
      renderPromos();
    }, error => {
      console.error("Promo listener failed:", error);
      state.promoError = true;
      renderPromos();
    });
  } catch (error) {
    console.error("Could not start promo listeners:", error);
    state.promoError = true;
    renderPromos();
  }
}

function currentCartSubtotal() {
  return selected().reduce((s, x) => s + x.line, 0);
}

function groupSubtotalIncludingCart() {
  return state.groupOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0) + currentCartSubtotal();
}

function groupProductQuantityIncludingCart(productId) {
  const orderQty = state.groupOrders.reduce((sum, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    return sum + items
      .filter(item => item.product_id === productId)
      .reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0);
  }, 0);
  return orderQty + Number(state.cart[productId] || 0);
}

function promoProgress(promo) {
  if (promo.promo_type === "item_quantity") {
    const threshold = Number(promo.threshold_quantity || 0);
    const current = groupProductQuantityIncludingCart(promo.product_id);
    const product = state.products.find(p => p.id === promo.product_id);
    return {
      current,
      threshold,
      remaining: Math.max(threshold - current, 0),
      unlocked: threshold > 0 && current >= threshold,
      percent: threshold > 0 ? Math.min(current / threshold * 100, 100) : 0,
      product_name: product?.name || promo.product_name || promo.product_id || "selected item"
    };
  }

  const threshold = Number(promo.threshold_amount || 0);
  const current = groupSubtotalIncludingCart();
  return {
    current,
    threshold,
    remaining: Math.max(threshold - current, 0),
    unlocked: threshold > 0 && current >= threshold,
    percent: threshold > 0 ? Math.min(current / threshold * 100, 100) : 0
  };
}

function getPromoSnapshot() {
  return state.promos.map(promo => {
    const progress = promoProgress(promo);
    return {
      promo_id: promo.id,
      title: promo.title,
      promo_type: promo.promo_type,
      benefit_label: promo.benefit_label || "",
      unlocked: progress.unlocked,
      current: Number(progress.current || 0),
      threshold: Number(progress.threshold || 0),
      remaining: Number(progress.remaining || 0),
      product_id: promo.product_id || "",
      product_name: progress.product_name || ""
    };
  });
}

function renderPromos() {
  const groupTotal = groupSubtotalIncludingCart();
  els.groupProgressTotal.textContent = `${money(groupTotal)} group total`;
  els.promoFallback.classList.toggle("hidden", !state.promoError);

  if (!state.promos.length) {
    els.promoList.innerHTML = '<p class="hint">No active group promos yet. Admin can create promos from the dashboard.</p>';
    return;
  }

  els.promoList.innerHTML = state.promos.map(promo => {
    const progress = promoProgress(promo);
    const isItem = promo.promo_type === "item_quantity";
    const detail = progress.unlocked
      ? "Bulk savings unlocked. Admin will reflect savings after final review."
      : isItem
        ? `Group needs ${progress.remaining} more ${progress.product_name} to unlock.`
        : `Add ${money(progress.remaining)} more as a group to unlock bulk savings.`;
    const currentLabel = isItem
      ? `${progress.current} / ${progress.threshold} units`
      : `${money(progress.current)} / ${money(progress.threshold)}`;
    return `<article class="promo-card ${progress.unlocked ? "unlocked" : ""}">
      <div class="row-between">
        <h3>${promo.title || "Group promo"}</h3>
        <span class="promo-chip">${progress.unlocked ? "Unlocked" : currentLabel}</span>
      </div>
      <p>${detail}</p>
      <div class="promo-meter"><span style="width:${Math.round(progress.percent)}%"></span></div>
      <p class="hint">${promo.benefit_label || "Estimated savings shown after admin review."}</p>
    </article>`;
  }).join("");
}

async function submitOrder(e) {
  e.preventDefault();
  const arr = selected();
  if (!arr.length) {
    alert("Add at least one item.");
    return;
  }

  const name = $("buyer-name").value.trim();
  const phone = $("buyer-phone").value.trim();
  const pref = $("collection-preference").value;
  const address = $("buyer-address").value.trim();
  const notes = $("buyer-notes").value.trim();
  const substitution = $("substitution-preference").value;
  if (pref === "delivery" && !address) {
    alert("Address required for delivery.");
    return;
  }

  const now = new Date().toISOString();
  const buyer_id = makeId("buyer");
  const order_id = makeId("ord");
  const subtotal = arr.reduce((s, x) => s + x.line, 0);
  const promoSnapshot = getPromoSnapshot();
  const buyer = { id: buyer_id, name, phone, address, collection_preference: pref, notes, created_at: now };
  const order = {
    id: order_id,
    group_buy_id: state.active.id,
    group_buy_number: state.active.group_buy_number,
    buyer_id,
    order_status: "pending",
    payment_status: "unpaid",
    fulfillment_status: "not_packed",
    subtotal,
    discount: 0,
    final_total: subtotal,
    promo_snapshot: promoSnapshot,
    created_at: now,
    updated_at: now
  };
  const orderItems = arr.map(x => ({
    id: makeId("item"),
    order_id,
    group_buy_id: state.active.id,
    group_buy_number: state.active.group_buy_number,
    product_id: x.p.id,
    product_name: x.p.name,
    sku: x.p.sku,
    quantity: x.q,
    unit: x.p.unit,
    unit_price: x.p.price,
    line_total: x.line,
    substitution_preference: substitution,
    item_status: "pending"
  }));
  const payment = { id: makeId("pay"), order_id, group_buy_id: state.active.id, group_buy_number: state.active.group_buy_number, payment_method: "manual", amount: subtotal, refund_status: "none" };
  const fulfillment = { id: makeId("ful"), order_id, group_buy_id: state.active.id, group_buy_number: state.active.group_buy_number, packed_status: "not_packed", collected_status: "not_collected", delivered_status: "not_delivered", updated_at: now };

  const database = getJSON(ORDER_KEY, { buyers: [], orders: [], order_items: [], payments: [], fulfillment: [] });
  database.buyers.push(buyer);
  database.orders.push(order);
  database.order_items.push(...orderItems);
  database.payments.push(payment);
  database.fulfillment.push(fulfillment);
  setJSON(ORDER_KEY, database);

  const firebaseOrderDoc = {
    order_id: order.id,
    group_buy_id: order.group_buy_id,
    group_buy_number: order.group_buy_number,
    buyer_name: buyer.name,
    phone: buyer.phone,
    address: buyer.address || "",
    collection_preference: buyer.collection_preference,
    buyer_notes: buyer.notes || "",
    items: orderItems.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      sku: item.sku,
      quantity: Number(item.quantity),
      unit: item.unit,
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
      substitution_preference: item.substitution_preference
    })),
    subtotal: Number(order.subtotal),
    discount: 0,
    final_total: Number(order.final_total),
    promo_snapshot: promoSnapshot,
    order_status: "pending",
    payment_status: "unpaid",
    fulfillment_status: "not_packed",
    created_at: serverTimestamp(),
    local_created_at: order.created_at
  };

  let paymentLink = "";
  try {
    const docRef = await addDoc(collection(db, "orders"), firebaseOrderDoc);
    console.log("Order saved to Firebase:", docRef.id);
    order.firebase_doc_id = docRef.id;
    const saved = getJSON(ORDER_KEY, { buyers: [], orders: [], order_items: [], payments: [], fulfillment: [] });
    const savedOrder = saved.orders.find(x => x.id === order.id);
    if (savedOrder) {
      savedOrder.firebase_doc_id = docRef.id;
      setJSON(ORDER_KEY, saved);
    }
    paymentLink = `payment.html?doc=${encodeURIComponent(docRef.id)}&order=${encodeURIComponent(order.id)}`;
  } catch (error) {
    console.error("Failed to save order to Firebase:", error);
    alert("Order saved locally, but Firebase upload failed. Check Firebase config/rules.");
  }

  els.modalBody.innerHTML = `Order <b>${order_id}</b> captured for <b>Group Buy #${state.active.group_buy_number}</b>. Estimated total: <b>${money(subtotal)}</b>.`;
  els.modalItems.innerHTML = arr.map(x => `<div class="cart-line"><div><span>${x.p.name} x ${x.q}</span><b>${money(x.line)}</b></div></div>`).join("");
  if (paymentLink) {
    els.modalItems.innerHTML += `<div class="row-wrap"><a class="primary" href="${paymentLink}" style="text-decoration:none;text-align:center">Proceed to payment</a></div>`;
  } else {
    els.modalItems.innerHTML += '<p class="hint">Payment link unavailable because Firebase upload failed.</p>';
  }
  els.modal.classList.remove("hidden");
  state.cart = {};
  $("order-form").reset();
  renderProducts();
  renderCart();
  renderPromos();
}

function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportGroups() {
  refreshGroups();
  download("venture-sense-group-buys-export.json", JSON.stringify({ seed_group_buys: state.seedGroups, registered_group_buys: state.registeredGroups, all_group_buys: state.allGroups }, null, 2), "application/json");
}

function exportOrdersJSON() {
  download("venture-sense-orders-export.json", JSON.stringify(getJSON(ORDER_KEY, { buyers: [], orders: [], order_items: [], payments: [], fulfillment: [] }), null, 2), "application/json");
}

function exportOrdersCSV() {
  const db = getJSON(ORDER_KEY, { buyers: [], orders: [], order_items: [] });
  const headers = ["order_id", "group_buy_id", "group_buy_number", "buyer_name", "phone", "items", "subtotal", "payment_status", "fulfillment_status", "created_at"];
  const rows = db.orders.map(o => {
    const b = db.buyers.find(x => x.id === o.buyer_id) || {};
    const items = db.order_items.filter(i => i.order_id === o.id).map(i => `${i.product_name} x${i.quantity}`).join("; ");
    return [o.id, o.group_buy_id, o.group_buy_number, b.name, b.phone, items, o.subtotal, o.payment_status, o.fulfillment_status, o.created_at];
  });
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  download("venture-sense-orders-export.csv", csv, "text/csv");
}

init();
