const STORAGE_KEY = 'ventureSenseOrders';
const state = { groupBuy: null, products: [], cart: {} };
const $ = (id) => document.getElementById(id);
const els = {
  groupTitle: $('group-title'), groupMeta: $('group-meta'), categoryFilter: $('category-filter'), searchInput: $('search-input'),
  productGrid: $('product-grid'), productCount: $('product-count'), cartItems: $('cart-items'), subtotal: $('subtotal'),
  clearCart: $('clear-cart'), orderForm: $('order-form'), exportJson: $('export-json'), exportCsv: $('export-csv'),
  modal: $('confirmation-modal'), confirmationTitle: $('confirmation-title'), confirmationBody: $('confirmation-body'),
  confirmationItems: $('confirmation-items'), closeModal: $('close-modal'), newOrder: $('new-order')
};
function money(value){ return `$${Number(value || 0).toFixed(2)}`; }
function makeId(prefix){ return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`; }
async function loadCatalogue(){
  const response = await fetch('catalogue.json');
  const data = await response.json();
  state.groupBuy = data.group_buy;
  state.products = data.products.filter(p => p.is_active);
  renderHeader(); renderFilters(); renderProducts(); renderCart();
}
function renderHeader(){
  const cutoff = new Date(state.groupBuy.cutoff_at).toLocaleString('en-SG', { dateStyle:'medium', timeStyle:'short' });
  els.groupTitle.textContent = state.groupBuy.title;
  els.groupMeta.textContent = `${state.groupBuy.location} · Closes ${cutoff} · ${state.groupBuy.collection_slot}`;
}
function renderFilters(){
  [...new Set(state.products.map(p => p.category))].sort().forEach(category => {
    const option = document.createElement('option'); option.value = category; option.textContent = category; els.categoryFilter.appendChild(option);
  });
}
function getFilteredProducts(){
  const category = els.categoryFilter.value;
  const query = els.searchInput.value.trim().toLowerCase();
  return state.products.filter(p => (category === 'all' || p.category === category) && (!query || p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)));
}
function renderProducts(){
  const products = getFilteredProducts(); els.productGrid.innerHTML = ''; els.productCount.textContent = `${products.length} item${products.length === 1 ? '' : 's'}`;
  if(!products.length){ els.productGrid.innerHTML = '<p class="empty-cart">No products found.</p>'; return; }
  products.forEach(product => {
    const quantity = state.cart[product.id] || 0;
    const card = document.createElement('article'); card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image">${product.emoji || '🛒'}</div>
      <div class="product-body">
        <span class="product-category">${product.category}</span>
        <h3>${product.name}</h3>
        <p class="product-meta">${product.unit} · SKU ${product.sku}</p>
        <span class="product-note">${product.stock_note || 'Available'}</span>
        <div class="product-footer">
          <span class="price">${money(product.price)}</span>
          <div class="qty-control">
            <button type="button" data-action="decrease" data-product-id="${product.id}">−</button>
            <span>${quantity}</span>
            <button type="button" data-action="increase" data-product-id="${product.id}">+</button>
          </div>
        </div>
      </div>`;
    els.productGrid.appendChild(card);
  });
}
function getSelectedProducts(){
  return Object.entries(state.cart).map(([productId, quantity]) => {
    const product = state.products.find(p => p.id === productId); if(!product || quantity <= 0) return null;
    return { product, quantity, lineTotal: product.price * quantity };
  }).filter(Boolean);
}
function calculateSubtotal(){ return getSelectedProducts().reduce((sum, item) => sum + item.lineTotal, 0); }
function renderCart(){
  const selected = getSelectedProducts(); els.cartItems.innerHTML = '';
  if(!selected.length){ els.cartItems.innerHTML = '<p class="empty-cart">No items selected yet.</p>'; }
  selected.forEach(({product, quantity, lineTotal}) => {
    const row = document.createElement('div'); row.className = 'cart-item';
    row.innerHTML = `<div class="cart-item-top"><span>${product.name}</span><span>${money(lineTotal)}</span></div><div class="cart-item-bottom"><span>${quantity} × ${product.unit}</span><span>${money(product.price)} each</span></div>`;
    els.cartItems.appendChild(row);
  });
  els.subtotal.textContent = money(calculateSubtotal());
}
function updateQuantity(productId, delta){
  const product = state.products.find(p => p.id === productId); if(!product) return;
  const next = Math.min(Math.max((state.cart[productId] || 0) + delta, 0), product.max_qty || 99);
  if(next === 0) delete state.cart[productId]; else state.cart[productId] = next;
  renderProducts(); renderCart();
}
function emptyDb(){ return { buyers:[], orders:[], order_items:[], payments:[], fulfillment:[] }; }
function getStoredOrders(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || emptyDb(); } catch { return emptyDb(); } }
function setStoredOrders(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2)); }
function submitOrder(event){
  event.preventDefault();
  const selected = getSelectedProducts(); if(!selected.length){ alert('Please add at least one item before submitting.'); return; }
  const name = $('buyer-name').value.trim(), phone = $('buyer-phone').value.trim(), collectionPreference = $('collection-preference').value, address = $('buyer-address').value.trim(), substitutionPreference = $('substitution-preference').value, notes = $('buyer-notes').value.trim();
  if(!name || !phone){ alert('Please enter your name and phone number.'); return; }
  if(collectionPreference === 'delivery' && !address){ alert('Please enter your address for delivery.'); return; }
  const now = new Date().toISOString(), buyerId = makeId('buyer'), orderId = makeId('ord'), subtotal = calculateSubtotal();
  const buyer = { id: buyerId, name, phone, address, collection_preference: collectionPreference, notes, created_at: now };
  const order = { id: orderId, group_buy_id: state.groupBuy.id, buyer_id: buyerId, order_status: 'pending', payment_status: 'unpaid', fulfillment_status: 'not_packed', subtotal, discount: 0, final_total: subtotal, admin_notes: '', created_at: now, updated_at: now };
  const orderItems = selected.map(({product, quantity, lineTotal}) => ({ id: makeId('item'), order_id: orderId, product_id: product.id, product_name: product.name, sku: product.sku, quantity, unit: product.unit, unit_price: product.price, line_total: lineTotal, substitution_preference: substitutionPreference, item_status: 'pending' }));
  const payment = { id: makeId('pay'), order_id: orderId, payment_method: 'manual', payment_link: '', amount: subtotal, paid_at: '', refund_status: 'none', payment_notes: 'Payment to be confirmed manually after stock review.' };
  const fulfillment = { id: makeId('ful'), order_id: orderId, packed_status: 'not_packed', collected_status: 'not_collected', delivered_status: 'not_delivered', delivery_batch_id: '', exception_notes: '', updated_at: now };
  const db = getStoredOrders(); db.buyers.push(buyer); db.orders.push(order); db.order_items.push(...orderItems); db.payments.push(payment); db.fulfillment.push(fulfillment); setStoredOrders(db);
  showConfirmation(order, buyer, orderItems); state.cart = {}; els.orderForm.reset(); renderProducts(); renderCart();
}
function showConfirmation(order, buyer, items){
  els.confirmationTitle.textContent = `Thanks, ${buyer.name}`;
  els.confirmationBody.innerHTML = `Your provisional order <strong>${order.id}</strong> has been captured. Estimated total: <strong>${money(order.subtotal)}</strong>. Admin will confirm payment after cutoff.`;
  els.confirmationItems.innerHTML = '';
  items.forEach(item => { const line = document.createElement('div'); line.className = 'confirmation-line'; line.innerHTML = `<span>${item.product_name} × ${item.quantity}</span><strong>${money(item.line_total)}</strong>`; els.confirmationItems.appendChild(line); });
  els.modal.classList.remove('hidden');
}
function downloadFile(filename, content, mimeType){
  const blob = new Blob([content], {type: mimeType}); const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
function exportJson(){ downloadFile('venture-sense-orders-export.json', JSON.stringify(getStoredOrders(), null, 2), 'application/json'); }
function exportCsv(){
  const data = getStoredOrders();
  const headers = ['order_id','buyer_name','phone','address','collection_preference','items','subtotal','payment_status','fulfillment_status','created_at'];
  const rows = data.orders.map(order => { const buyer = data.buyers.find(b => b.id === order.buyer_id) || {}; const items = data.order_items.filter(i => i.order_id === order.id).map(i => `${i.product_name} x${i.quantity}`).join('; '); return { order_id: order.id, buyer_name: buyer.name || '', phone: buyer.phone || '', address: buyer.address || '', collection_preference: buyer.collection_preference || '', items, subtotal: order.subtotal, payment_status: order.payment_status, fulfillment_status: order.fulfillment_status, created_at: order.created_at }; });
  const csv = [headers.join(','), ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replaceAll('"','""')}"`).join(','))].join('\n');
  downloadFile('venture-sense-orders-export.csv', csv, 'text/csv');
}
els.productGrid.addEventListener('click', event => { const button = event.target.closest('button[data-action]'); if(!button) return; updateQuantity(button.dataset.productId, button.dataset.action === 'increase' ? 1 : -1); });
els.categoryFilter.addEventListener('change', renderProducts); els.searchInput.addEventListener('input', renderProducts); els.clearCart.addEventListener('click', () => { state.cart = {}; renderProducts(); renderCart(); });
els.orderForm.addEventListener('submit', submitOrder); els.exportJson.addEventListener('click', exportJson); els.exportCsv.addEventListener('click', exportCsv); els.closeModal.addEventListener('click', () => els.modal.classList.add('hidden')); els.newOrder.addEventListener('click', () => els.modal.classList.add('hidden'));
loadCatalogue().catch(error => { console.error(error); alert('Could not load catalogue.json. Run with python3 -m http.server 8000 from this folder.'); });
