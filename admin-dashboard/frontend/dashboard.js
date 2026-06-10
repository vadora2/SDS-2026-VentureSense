import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "../../customer-ordering/frontend/firebase-config.js";

// ── Global state ──────────────────────────────────────────────
let ORDERS = [];
let PROMOS = [];
let CATALOGUE = { group_buys: [], products: [] };

// ── Page titles ───────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:    'Dashboard',
  orders:       'Order Management',
  promos:       'Promos',
  transactions: 'Transactions',
};

// ── Routing ───────────────────────────────────────────────────
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  const link = document.querySelector(`.nav-link[data-page="${pageId}"]`);

  if (page) page.classList.add('active');
  if (link) link.classList.add('active');

  document.getElementById('topbar-title').textContent = PAGE_TITLES[pageId] || pageId;
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigate(link.dataset.page);
  });
});

const promoForm = document.getElementById('promo-form');
const promoType = document.getElementById('promo-type');
if (promoForm) promoForm.addEventListener('submit', createPromo);
if (promoType) promoType.addEventListener('change', updatePromoTypeFields);

// ── CSV loading ───────────────────────────────────────────────
function showError(msg) {
  const banner = document.getElementById('error-banner');
  document.getElementById('error-message').textContent = msg;
  banner.classList.add('visible');
}

function updateTopbarMeta() {
  const el = document.getElementById('topbar-meta');
  el.textContent = ORDERS.length + ' order' + (ORDERS.length !== 1 ? 's' : '') + ' loaded';
}

function renderAll() {
  updateTopbarMeta();
  renderDashboard();
  renderOrderManagement();
  renderPromosPage();
  renderTransactions();
  document.getElementById('loading-overlay').classList.add('hidden');
}

// ── Dashboard rendering ───────────────────────────────────────
function paymentPill(status) {
  if (status === 'paid')         return `<span class="pill pill-green">paid</span>`;
  if (status === 'payment_sent') return `<span class="pill pill-blue">payment sent</span>`;
  if (status === 'refunded')     return `<span class="pill pill-gray">refunded</span>`;
  return `<span class="pill pill-amber">unpaid</span>`;
}

function fulfillmentPill(status) {
  if (status === 'packed')     return `<span class="pill pill-blue">packed</span>`;
  if (status === 'collected')  return `<span class="pill pill-green">collected</span>`;
  if (status === 'delivered')  return `<span class="pill pill-green">delivered</span>`;
  return `<span class="pill pill-gray">not packed</span>`;
}

function parseSKUs(orders) {
  const map = {};
  orders.forEach(o => {
    (o.items || '').split(';').forEach(seg => {
      const m = seg.trim().match(/^(.+?)\s*x\s*(\d+)$/i);
      if (!m) return;
      const name = m[1].trim();
      const qty  = parseInt(m[2], 10);
      map[name]  = (map[name] || 0) + qty;
    });
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function renderDashboard() {
  const total  = ORDERS.length;
  const unpaid = ORDERS.filter(o => o.payment_status === 'unpaid').length;
  const value  = ORDERS.reduce((sum, o) => sum + (parseFloat(o.subtotal) || 0), 0);

  document.getElementById('mc-total').textContent  = total;
  document.getElementById('mc-unpaid').textContent = unpaid;
  document.getElementById('mc-value').textContent  = '$' + value.toFixed(2);
  document.getElementById('orders-count-label').textContent = total + ' orders';

  // Orders table
  const tbody = document.getElementById('orders-tbody');
  tbody.innerHTML = ORDERS.map(o => `
    <tr>
      <td>${o.buyer_name || '—'}</td>
      <td class="cell-items" title="${o.items || ''}">${o.items || '—'}</td>
      <td>$${parseFloat(o.subtotal || 0).toFixed(2)}</td>
      <td>${paymentPill(o.payment_status)}</td>
      <td>${fulfillmentPill(o.fulfillment_status)}</td>
    </tr>
  `).join('');

  // SKU summary
  const skus    = parseSKUs(ORDERS);
  const maxQty  = skus.length ? skus[0][1] : 1;
  document.getElementById('sku-list').innerHTML = skus.map(([name, qty]) => `
    <div class="sku-row">
      <div class="sku-name">${name}</div>
      <div class="sku-bar-wrap"><div class="sku-bar" style="width:${Math.round(qty/maxQty*100)}%"></div></div>
      <div class="sku-count">${qty}</div>
    </div>
  `).join('') || '<div class="sku-row"><div class="sku-name" style="color:var(--text-muted)">No data</div></div>';

  // Group summary
  const groups = {};
  ORDERS.forEach(o => {
    const gid = o.group_buy_id || 'unknown';
    if (!groups[gid]) groups[gid] = { count: 0, total: 0 };
    groups[gid].count++;
    groups[gid].total += parseFloat(o.subtotal) || 0;
  });
  document.getElementById('group-list').innerHTML = Object.entries(groups).map(([gid, g]) => `
    <div class="group-row">
      <div class="group-id">${gid}</div>
      <div class="group-meta">${g.count} orders · $${g.total.toFixed(2)}</div>
      <span class="pill pill-amber">All unpaid</span>
    </div>
  `).join('') || '<div class="group-row"><div class="group-id" style="color:var(--text-muted)">No data</div></div>';
}

// ── Order Management ──────────────────────────────────────────
let omFilter = 'all';

function omFilteredOrders() {
  return omFilter === 'unpaid'
    ? ORDERS.filter(o => o.payment_status === 'unpaid')
    : ORDERS;
}

function omSetFilter(f) {
  omFilter = f;
  document.getElementById('om-filter-all').classList.toggle('active', f === 'all');
  document.getElementById('om-filter-unpaid').classList.toggle('active', f === 'unpaid');
  omRenderTable();
}

function omInitials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function omRenderTable() {
  const rows = omFilteredOrders();
  document.getElementById('om-count').textContent = rows.length;

  document.getElementById('om-tbody').innerHTML = rows.map(o => {
    const shortId = (o.order_id || '').slice(-6);
    const group   = o.group_buy_id || '—';
    const initials = omInitials(o.buyer_name);
    const items   = o.items || '—';
    const subtotal = '$' + parseFloat(o.subtotal || 0).toFixed(2);
    return `<tr>
      <td class="order-id-cell">${shortId}</td>
      <td>${group}</td>
      <td class="buyer-cell"><span class="avatar">${initials}</span>${o.buyer_name || '—'}</td>
      <td>${o.phone || '—'}</td>
      <td class="cell-items" title="${items}">${items}</td>
      <td>${subtotal}</td>
      <td>${paymentPill(o.payment_status)}</td>
      <td>${fulfillmentPill(o.fulfillment_status)}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">No orders</td></tr>`;
}

function omRenderSidebar() {
  // Group breakdown (always from full ORDERS, not filtered)
  const groups = {};
  ORDERS.forEach(o => {
    const gid = o.group_buy_id || 'unknown';
    if (!groups[gid]) groups[gid] = { count: 0, total: 0 };
    groups[gid].count++;
    groups[gid].total += parseFloat(o.subtotal) || 0;
  });
  document.getElementById('om-group-list').innerHTML = Object.entries(groups).map(([gid, g]) => `
    <div class="group-row">
      <div class="group-id">${gid}</div>
      <div class="group-meta">${g.count} orders · $${g.total.toFixed(2)}</div>
    </div>
  `).join('') || '<div class="group-row"><span style="color:var(--text-muted)">No data</span></div>';

  // Payment status counts
  const payStatuses = ['unpaid', 'payment_sent', 'paid', 'refunded'];
  const payCounts   = {};
  ORDERS.forEach(o => { payCounts[o.payment_status] = (payCounts[o.payment_status] || 0) + 1; });
  document.getElementById('om-payment-summary').innerHTML = payStatuses.map(s => `
    <div class="status-row">
      <span class="status-row-label">${s.replace('_', ' ')}</span>
      <span class="status-row-count">${payCounts[s] || 0}</span>
    </div>
  `).join('');

  // Fulfillment status counts
  const fulStatuses = ['not_packed', 'packed', 'collected', 'delivered'];
  const fulCounts   = {};
  ORDERS.forEach(o => { fulCounts[o.fulfillment_status] = (fulCounts[o.fulfillment_status] || 0) + 1; });
  document.getElementById('om-fulfillment-summary').innerHTML = fulStatuses.map(s => `
    <div class="status-row">
      <span class="status-row-label">${s.replace('_', ' ')}</span>
      <span class="status-row-count">${fulCounts[s] || 0}</span>
    </div>
  `).join('');
}

function renderOrderManagement() {
  omRenderTable();
  omRenderSidebar();
}

function omExportCSV() {
  const rows  = omFilteredOrders();
  const cols  = ['order_id', 'group_buy_id', 'buyer_name', 'phone', 'items', 'subtotal', 'payment_status', 'fulfillment_status', 'created_at'];
  const lines = [cols.join(',')];
  rows.forEach(o => {
    lines.push(cols.map(c => JSON.stringify(o[c] ?? '')).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'orders-export.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Transactions ──────────────────────────────────────────────
function renderTransactions() {
  const total   = ORDERS.reduce((s, o) => s + (parseFloat(o.subtotal) || 0), 0);
  const unpaid  = ORDERS.filter(o => o.payment_status === 'unpaid')
                        .reduce((s, o) => s + (parseFloat(o.subtotal) || 0), 0);
  const paid    = ORDERS.filter(o => o.payment_status === 'paid')
                        .reduce((s, o) => s + (parseFloat(o.subtotal) || 0), 0);
  const groups  = new Set(ORDERS.map(o => o.group_buy_id).filter(Boolean)).size;

  document.getElementById('tx-total-value').textContent = '$' + total.toFixed(2);
  document.getElementById('tx-unpaid-value').textContent = '$' + unpaid.toFixed(2);
  document.getElementById('tx-paid-value').textContent = '$' + paid.toFixed(2);
  document.getElementById('tx-groups').textContent = groups;
  document.getElementById('tx-count-label').textContent = ORDERS.length + ' entries';

  document.getElementById('tx-tbody').innerHTML = ORDERS.map(o => {
    const isPaid   = o.payment_status === 'paid';
    const accent   = isPaid ? 'var(--primary)' : '#D97706';
    const shortId  = (o.order_id || '').slice(-6);
    const items    = o.items || '—';
    const amount   = '$' + parseFloat(o.subtotal || 0).toFixed(2);
    return `<tr>
      <td style="width:4px;padding:0;background:${accent}"></td>
      <td class="order-id-cell">${shortId}</td>
      <td>${o.buyer_name || '—'}</td>
      <td>${o.group_buy_id || '—'}</td>
      <td class="cell-items" title="${items}">${items}</td>
      <td style="font-weight:600">${amount}</td>
      <td>${paymentPill(o.payment_status)}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px">No transactions</td></tr>`;
}

function txExportStatement() {
  const cols  = ['order_id', 'buyer_name', 'group_buy_id', 'items', 'subtotal', 'payment_status', 'created_at'];
  const lines = [cols.join(',')];
  ORDERS.forEach(o => lines.push(cols.map(c => JSON.stringify(o[c] ?? '')).join(',')));
  const blob  = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a     = document.createElement('a');
  a.href      = URL.createObjectURL(blob);
  a.download  = 'transaction-statement.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function txDraftReminders() {
  const unpaidBuyers = ORDERS
    .filter(o => o.payment_status === 'unpaid')
    .map(o => `${o.buyer_name} ($${parseFloat(o.subtotal || 0).toFixed(2)})`)
    .join(', ');
  const prompt = `Draft a short, friendly WhatsApp payment reminder for these unpaid buyers: ${unpaidBuyers || 'none'}. Keep it under 3 sentences.`;
  if (typeof sendPrompt === 'function') {
    sendPrompt(prompt);
  } else {
    alert('sendPrompt not available.\n\nSuggested prompt:\n' + prompt);
  }
}

function initPromoControls() {
  const groupSelect = document.getElementById('promo-group');
  const productSelect = document.getElementById('promo-product');
  if (!groupSelect || !productSelect) return;

  groupSelect.innerHTML = (CATALOGUE.group_buys || []).map(group => (
    `<option value="${group.id}">${group.group_buy_number} - ${group.title}</option>`
  )).join('');

  productSelect.innerHTML = (CATALOGUE.products || []).map(product => (
    `<option value="${product.id}">${product.name} (${product.sku})</option>`
  )).join('');

  updatePromoTypeFields();
}

function updatePromoTypeFields() {
  const type = document.getElementById('promo-type')?.value || 'group_spend';
  const amountWrap = document.getElementById('promo-amount-wrap');
  const productWrap = document.getElementById('promo-product-wrap');
  const quantityWrap = document.getElementById('promo-quantity-wrap');
  if (!amountWrap || !productWrap || !quantityWrap) return;
  amountWrap.style.display = type === 'group_spend' ? 'grid' : 'none';
  productWrap.style.display = type === 'item_quantity' ? 'grid' : 'none';
  quantityWrap.style.display = type === 'item_quantity' ? 'grid' : 'none';
}

function groupSubtotal(groupBuyId) {
  return ORDERS
    .filter(order => order.group_buy_id === groupBuyId)
    .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
}

function groupProductQuantity(groupBuyId, productId) {
  return ORDERS
    .filter(order => order.group_buy_id === groupBuyId)
    .reduce((sum, order) => {
      const rawItems = Array.isArray(order.raw_items) ? order.raw_items : [];
      return sum + rawItems
        .filter(item => item.product_id === productId)
        .reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0);
    }, 0);
}

function promoProgress(promo) {
  if (promo.promo_type === 'item_quantity') {
    const threshold = Number(promo.threshold_quantity || 0);
    const current = groupProductQuantity(promo.group_buy_id, promo.product_id);
    const product = (CATALOGUE.products || []).find(item => item.id === promo.product_id);
    return {
      current,
      threshold,
      remaining: Math.max(threshold - current, 0),
      unlocked: threshold > 0 && current >= threshold,
      product_name: product?.name || promo.product_name || promo.product_id || 'selected item'
    };
  }

  const threshold = Number(promo.threshold_amount || 0);
  const current = groupSubtotal(promo.group_buy_id);
  return {
    current,
    threshold,
    remaining: Math.max(threshold - current, 0),
    unlocked: threshold > 0 && current >= threshold
  };
}

function renderPromosPage() {
  const list = document.getElementById('promo-list');
  const count = document.getElementById('promo-count-label');
  if (!list || !count) return;

  const activePromos = PROMOS.filter(promo => (promo.status || 'active') === 'active');
  count.textContent = activePromos.length + ' promo' + (activePromos.length !== 1 ? 's' : '');

  list.innerHTML = activePromos.map(promo => {
    const progress = promoProgress(promo);
    const group = (CATALOGUE.group_buys || []).find(item => item.id === promo.group_buy_id);
    const target = promo.promo_type === 'item_quantity'
      ? `${progress.current}/${progress.threshold} ${progress.product_name}`
      : `$${progress.current.toFixed(2)}/$${progress.threshold.toFixed(2)}`;
    return `<div class="promo-admin-row">
      <div>
        <h4>${promo.title || 'Group promo'}</h4>
        <div class="promo-admin-meta">${group?.group_buy_number || promo.group_buy_id} · ${promo.promo_type.replace('_', ' ')} · ${target}<br>${promo.benefit_label || ''}</div>
      </div>
      ${progress.unlocked ? '<span class="pill pill-green">unlocked</span>' : '<span class="pill pill-amber">in progress</span>'}
    </div>`;
  }).join('') || '<div class="promo-admin-row"><span class="promo-admin-meta">No active promos yet.</span></div>';
}

async function createPromo(event) {
  event.preventDefault();
  const type = document.getElementById('promo-type').value;
  const groupId = document.getElementById('promo-group').value;
  const productId = document.getElementById('promo-product').value;
  const product = (CATALOGUE.products || []).find(item => item.id === productId);
  const payload = {
    group_buy_id: groupId,
    title: document.getElementById('promo-title').value.trim(),
    promo_type: type,
    benefit_label: document.getElementById('promo-benefit').value.trim(),
    status: document.getElementById('promo-status').value,
    threshold_amount: type === 'group_spend' ? Number(document.getElementById('promo-threshold-amount').value || 0) : 0,
    product_id: type === 'item_quantity' ? productId : '',
    product_name: type === 'item_quantity' ? (product?.name || '') : '',
    threshold_quantity: type === 'item_quantity' ? Number(document.getElementById('promo-threshold-quantity').value || 0) : 0,
    created_at: serverTimestamp(),
    updated_at: new Date().toISOString()
  };

  if (type === 'group_spend' && payload.threshold_amount <= 0) {
    document.getElementById('promo-message').textContent = 'Enter a spend threshold.';
    return;
  }
  if (type === 'item_quantity' && (!payload.product_id || payload.threshold_quantity <= 0)) {
    document.getElementById('promo-message').textContent = 'Choose a product and quantity threshold.';
    return;
  }

  try {
    await addDoc(collection(db, 'promos'), payload);
    promoForm.reset();
    updatePromoTypeFields();
    document.getElementById('promo-message').textContent = 'Promo created.';
  } catch (error) {
    console.error('Failed to create promo:', error);
    document.getElementById('promo-message').textContent = 'Could not create promo. Check Firebase rules.';
  }
}

function mapFirebaseOrderToDashboardRow(order) {
  return {
    firebase_doc_id: order.firebase_doc_id,
    order_id: order.order_id,
    group_buy_id: order.group_buy_id,
    group_buy_number: order.group_buy_number,
    buyer_name: order.buyer_name,
    phone: order.phone,
    address: order.address,
    collection_preference: order.collection_preference,
    items: Array.isArray(order.items)
      ? order.items.map(item => `${item.product_name} x${item.quantity}`).join('; ')
      : '',
    raw_items: Array.isArray(order.items) ? order.items : [],
    subtotal: order.subtotal,
    payment_status: order.payment_status,
    fulfillment_status: order.fulfillment_status,
    created_at: order.local_created_at || ''
  };
}

async function loadOrdersFromFirebase(groupBuyId = null) {
  try {
    const ordersQuery = groupBuyId
      ? query(collection(db, 'orders'), where('group_buy_id', '==', groupBuyId))
      : collection(db, 'orders');
    const snapshot = await getDocs(ordersQuery);
    const orders = snapshot.docs.map(docSnap => ({
      firebase_doc_id: docSnap.id,
      ...docSnap.data()
    }));
    console.log('Loaded Firebase orders:', orders);
    return orders;
  } catch (error) {
    console.error('Failed to load Firebase orders:', error);
    return null;
  }
}

function listenToOrders(groupBuyId = null) {
  const ordersQuery = groupBuyId
    ? query(collection(db, 'orders'), where('group_buy_id', '==', groupBuyId))
    : collection(db, 'orders');

  return onSnapshot(ordersQuery, (snapshot) => {
    const firebaseOrders = snapshot.docs.map(docSnap => ({
      firebase_doc_id: docSnap.id,
      ...docSnap.data()
    }));

    if (!firebaseOrders.length) {
      loadOrdersFromCSV();
      return;
    }

    ORDERS = firebaseOrders.map(mapFirebaseOrderToDashboardRow);
    console.log('Realtime Firebase orders:', ORDERS);
    renderAll();
  }, (error) => {
    console.error('Realtime listener failed:', error);
    loadOrdersFromCSV();
  });
}

async function updateOrderStatus(firebaseDocId, updates) {
  const orderRef = doc(db, 'orders', firebaseDocId);
  await updateDoc(orderRef, {
    ...updates,
    updated_at: new Date().toISOString()
  });
}

function loadOrdersFromCSV() {
  Papa.parse('../../shared/mock-data/orders.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete(results) {
      if (results.errors.length) {
        console.warn('CSV parse warnings:', results.errors);
      }
      ORDERS = results.data;
      console.log('CSV orders loaded:', ORDERS);
      renderAll();
    },
    error(err) {
      console.error('CSV load error:', err);
      showError('Could not load orders.csv - ' + err.message);
      document.getElementById('loading-overlay').classList.add('hidden');
    },
  });
}

async function loadCatalogue() {
  try {
    const response = await fetch('../../customer-ordering/frontend/catalogue.json');
    CATALOGUE = await response.json();
    const registered = JSON.parse(localStorage.getItem('ventureSenseRegisteredGroupBuys') || '[]');
    CATALOGUE.group_buys = [...(CATALOGUE.group_buys || []), ...registered];
  } catch (error) {
    console.error('Failed to load catalogue for promos:', error);
    CATALOGUE = { group_buys: [], products: [] };
  }
  initPromoControls();
  renderPromosPage();
}

function listenToPromos() {
  try {
    return onSnapshot(collection(db, 'promos'), snapshot => {
      PROMOS = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      renderPromosPage();
    }, error => {
      console.error('Promo listener failed:', error);
      PROMOS = [];
      renderPromosPage();
    });
  } catch (error) {
    console.error('Could not start promo listener:', error);
    return null;
  }
}

async function initOrders() {
  await loadCatalogue();
  listenToPromos();
  const firebaseOrders = await loadOrdersFromFirebase();

  if (firebaseOrders && firebaseOrders.length > 0) {
    listenToOrders();
  } else {
    loadOrdersFromCSV();
  }
}

window.omSetFilter = omSetFilter;
window.omExportCSV = omExportCSV;
window.txDraftReminders = txDraftReminders;
window.txExportStatement = txExportStatement;
window.updateOrderStatus = updateOrderStatus;

initOrders();
