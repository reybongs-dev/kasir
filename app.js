(() => {
  'use strict';

  const STORAGE_KEYS = {
    SERVICES: 'salon_cashier_services_v1',
    LEDGER: 'salon_cashier_ledger_v1',
    CART: 'salon_cashier_cart_v1'
  };

  const DEFAULT_SERVICES = [
    { id: 'srv-1', name: 'Haircut', price: 50000 },
    { id: 'srv-2', name: 'Hair Wash & Blow', price: 45000 },
    { id: 'srv-3', name: 'Hair Coloring', price: 250000 },
    { id: 'srv-4', name: 'Hair Spa', price: 120000 },
    { id: 'srv-5', name: 'Manicure', price: 65000 },
    { id: 'srv-6', name: 'Pedicure', price: 75000 }
  ];

  // Single Source of Truth State
  const state = {
    services: loadJSON(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES),
    ledger: loadJSON(STORAGE_KEYS.LEDGER, []),
    cart: loadJSON(STORAGE_KEYS.CART, []),
    customerNote: '',
    filterType: 'all',
    filterPeriod: 'monthly'
  };

  // DOM References
  const el = {
    offlineBadge: document.getElementById('offline-badge'),
    liveClock: document.getElementById('live-clock'),
    // Summaries
    sumTodayIn: document.getElementById('sum-today-in'),
    sumTodayOut: document.getElementById('sum-today-out'),
    sumTodayNet: document.getElementById('sum-today-net'),
    sumWeekIn: document.getElementById('sum-week-in'),
    sumWeekOut: document.getElementById('sum-week-out'),
    sumWeekNet: document.getElementById('sum-week-net'),
    sumMonthIn: document.getElementById('sum-month-in'),
    sumMonthOut: document.getElementById('sum-month-out'),
    sumMonthNet: document.getElementById('sum-month-net'),
    // Services
    toggleServiceFormBtn: document.getElementById('toggle-service-form-btn'),
    serviceForm: document.getElementById('service-form'),
    serviceEditId: document.getElementById('service-edit-id'),
    serviceName: document.getElementById('service-name'),
    servicePrice: document.getElementById('service-price'),
    serviceCancelBtn: document.getElementById('service-cancel-btn'),
    serviceGrid: document.getElementById('service-grid'),
    // Expense
    expenseForm: document.getElementById('expense-form'),
    expenseDesc: document.getElementById('expense-desc'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseDate: document.getElementById('expense-date'),
    // Ledger
    filterType: document.getElementById('filter-type'),
    filterPeriod: document.getElementById('filter-period'),
    ledgerBody: document.getElementById('ledger-body'),
    // Cart & Receipt
    clearCartBtn: document.getElementById('clear-cart-btn'),
    cartItems: document.getElementById('cart-items'),
    customerNote: document.getElementById('customer-note'),
    cartCount: document.getElementById('cart-count'),
    cartTotal: document.getElementById('cart-total'),
    completeOrderBtn: document.getElementById('complete-order-btn'),
    receiptPreview: document.getElementById('receipt-preview'),
    printArea: document.getElementById('print-area')
  };

  // Utilities
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : structuredClone(fallback);
    } catch {
      return structuredClone(fallback);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(state.services));
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(state.ledger));
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  function formatDateTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function generateOrderId() {
    const now = new Date();
    const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `SC-${ymd}-${rand}`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function todayInputDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().slice(0, 10);
  }

  // Date Period Helpers
  function isWithinPeriod(isoString, period) {
    if (period === 'all') return true;
    const txDate = new Date(isoString);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === 'daily') {
      return txDate >= startOfToday;
    }
    if (period === 'weekly') {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return txDate >= sevenDaysAgo;
    }
    if (period === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return txDate >= startOfMonth;
    }
    return true;
  }

  // Service Catalog Actions
  function upsertService(e) {
    e.preventDefault();
    const name = el.serviceName.value.trim();
    const price = Number(el.servicePrice.value);
    const editId = el.serviceEditId.value;

    if (!name || price < 0) return;

    if (editId) {
      const target = state.services.find((s) => s.id === editId);
      if (target) {
        target.name = name;
        target.price = price;
      }
      // Sync updated price in active cart if present
      const cartItem = state.cart.find((c) => c.serviceId === editId);
      if (cartItem) {
        cartItem.name = name;
        cartItem.price = price;
      }
    } else {
      state.services.push({
        id: `srv-${Date.now()}`,
        name,
        price
      });
    }

    resetServiceForm();
    commitAndRender();
  }

  function editService(id) {
    const srv = state.services.find((s) => s.id === id);
    if (!srv) return;
    el.serviceForm.classList.remove('hidden');
    el.serviceEditId.value = srv.id;
    el.serviceName.value = srv.name;
    el.servicePrice.value = srv.price;
    el.serviceCancelBtn.classList.remove('hidden');
    el.serviceName.focus();
  }

  function deleteService(id) {
    state.services = state.services.filter((s) => s.id !== id);
    if (el.serviceEditId.value === id) resetServiceForm();
    commitAndRender();
  }

  function resetServiceForm() {
    el.serviceEditId.value = '';
    el.serviceName.value = '';
    el.servicePrice.value = '';
    el.serviceCancelBtn.classList.add('hidden');
  }

  // Cart Actions
  function addToCart(serviceId) {
    const srv = state.services.find((s) => s.id === serviceId);
    if (!srv) return;

    const existing = state.cart.find((item) => item.serviceId === serviceId);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({
        serviceId: srv.id,
        name: srv.name,
        price: srv.price,
        qty: 1
      });
    }
    commitAndRender();
  }

  function updateCartQty(serviceId, delta) {
    const idx = state.cart.findIndex((item) => item.serviceId === serviceId);
    if (idx === -1) return;

    state.cart[idx].qty += delta;
    if (state.cart[idx].qty <= 0) {
      state.cart.splice(idx, 1);
    }
    commitAndRender();
  }

  function clearCart() {
    state.cart = [];
    state.customerNote = '';
    el.customerNote.value = '';
    commitAndRender();
  }

  // Checkout & Expense Logging
  function completeOrder() {
    if (state.cart.length === 0) return;

    const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const nowIso = new Date().toISOString();
    const orderRecord = {
      id: generateOrderId(),
      type: 'in',
      timestamp: nowIso,
      formattedDate: formatDateTime(nowIso),
      items: structuredClone(state.cart),
      note: state.customerNote.trim(),
      amount: total
    };

    state.ledger.unshift(orderRecord);
    state.cart = [];
    state.customerNote = '';
    el.customerNote.value = '';

    commitAndRender();
    printReceipt(orderRecord);
  }

  function recordExpense(e) {
    e.preventDefault();
    const desc = el.expenseDesc.value.trim();
    const amount = Number(el.expenseAmount.value);
    const dateVal = el.expenseDate.value;

    if (!desc || amount <= 0 || !dateVal) return;

    const nowTime = new Date().toTimeString().slice(0, 8);
    const isoTimestamp = new Date(`${dateVal}T${nowTime}`).toISOString();

    state.ledger.unshift({
      id: `EXP-${Date.now().toString().slice(-6)}`,
      type: 'out',
      timestamp: isoTimestamp,
      formattedDate: formatDateTime(isoTimestamp),
      description: desc,
      amount
    });

    // Keep ledger sorted newest first
    state.ledger.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    el.expenseDesc.value = '';
    el.expenseAmount.value = '';
    el.expenseDate.value = todayInputDate();

    commitAndRender();
  }

  // Receipt Generation & Printing
  function buildReceiptHTML(order) {
    const itemsHTML = order.items
      .map(
        (item) => `
        <div class="rcp-row">
          <span>${escapeHTML(item.name)} x${item.qty}</span>
          <span class="tabular">${formatCurrency(item.price * item.qty)}</span>
        </div>`
      )
      .join('');

    const noteHTML = order.note
      ? `<div class="rcp-note"><strong>Note:</strong> ${escapeHTML(order.note)}</div>`
      : '';

    return `
      <div class="receipt-sheet">
        <div class="rcp-center">
          <h3 class="rcp-title">Salon Cashier</h3>
          <div>Official Service Receipt</div>
        </div>
        <hr class="rcp-divider" />
        <div class="rcp-row"><span>Order ID</span><span>${escapeHTML(order.id)}</span></div>
        <div class="rcp-row"><span>Date</span><span>${escapeHTML(order.formattedDate)}</span></div>
        <hr class="rcp-divider" />
        ${itemsHTML}
        ${noteHTML}
        <hr class="rcp-divider" />
        <div class="rcp-row rcp-total">
          <span>TOTAL PAID</span>
          <span class="tabular">${formatCurrency(order.amount)}</span>
        </div>
        <hr class="rcp-divider" />
        <div class="rcp-center">Thank you for your visit!</div>
      </div>
    `;
  }

  function printReceipt(order) {
    el.printArea.innerHTML = buildReceiptHTML(order);
    window.print();
  }

  // Rendering Functions
  function renderServices() {
    el.serviceGrid.innerHTML = state.services
      .map(
        (srv) => `
        <div class="service-tile" data-action="add" data-id="${srv.id}">
          <div class="service-tile-top">
            <span class="service-title">${escapeHTML(srv.name)}</span>
          </div>
          <div class="service-row-bottom" style="display:flex;justify-content:space-between;align-items:center;">
            <span class="service-price tabular">${formatCurrency(srv.price)}</span>
            <div class="service-controls">
              <button type="button" class="icon-btn" data-action="edit" data-id="${srv.id}" title="Edit">Edit</button>
              <button type="button" class="icon-btn" data-action="delete" data-id="${srv.id}" title="Delete">&times;</button>
            </div>
          </div>
        </div>`
      )
      .join('');
  }

  function renderCartAndPreview() {
    const totalQty = state.cart.reduce((sum, i) => sum + i.qty, 0);
    const totalAmount = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    el.cartCount.textContent = totalQty;
    el.cartTotal.textContent = formatCurrency(totalAmount);
    el.completeOrderBtn.disabled = state.cart.length === 0;

    if (state.cart.length === 0) {
      el.cartItems.innerHTML = `<p class="empty-state">Select services from the catalog to start an order.</p>`;
    } else {
      el.cartItems.innerHTML = state.cart
        .map(
          (item) => `
          <div class="cart-row">
            <div class="cart-row-info">
              <span class="cart-row-name">${escapeHTML(item.name)}</span>
              <span class="cart-row-sub tabular">${formatCurrency(item.price)} each</span>
            </div>
            <div class="qty-controls">
              <button type="button" class="qty-btn" data-cart-action="dec" data-id="${item.serviceId}">-</button>
              <span class="qty-val tabular">${item.qty}</span>
              <button type="button" class="qty-btn" data-cart-action="inc" data-id="${item.serviceId}">+</button>
              <button type="button" class="qty-btn" data-cart-action="rem" data-id="${item.serviceId}" title="Remove">&times;</button>
            </div>
          </div>`
        )
        .join('');
    }

    // Live Preview Object
    const nowIso = new Date().toISOString();
    const previewOrder = {
      id: 'PREVIEW',
      formattedDate: formatDateTime(nowIso),
      items: state.cart.length ? state.cart : [{ name: 'Sample Service', qty: 1, price: 0 }],
      note: state.customerNote.trim(),
      amount: totalAmount
    };
    el.receiptPreview.innerHTML = buildReceiptHTML(previewOrder);
  }

  function renderSummaries() {
    const calc = (period) => {
      let incoming = 0;
      let outgoing = 0;
      for (const tx of state.ledger) {
        if (!isWithinPeriod(tx.timestamp, period)) continue;
        if (tx.type === 'in') incoming += tx.amount;
        else outgoing += tx.amount;
      }
      return { incoming, outgoing, net: incoming - outgoing };
    };

    const today = calc('daily');
    el.sumTodayIn.textContent = formatCurrency(today.incoming);
    el.sumTodayOut.textContent = formatCurrency(today.outgoing);
    el.sumTodayNet.textContent = formatCurrency(today.net);

    const week = calc('weekly');
    el.sumWeekIn.textContent = formatCurrency(week.incoming);
    el.sumWeekOut.textContent = formatCurrency(week.outgoing);
    el.sumWeekNet.textContent = formatCurrency(week.net);

    const month = calc('monthly');
    el.sumMonthIn.textContent = formatCurrency(month.incoming);
    el.sumMonthOut.textContent = formatCurrency(month.outgoing);
    el.sumMonthNet.textContent = formatCurrency(month.net);
  }

  function renderLedger() {
    const filtered = state.ledger.filter((tx) => {
      const typeMatch = state.filterType === 'all' || tx.type === state.filterType;
      const periodMatch = isWithinPeriod(tx.timestamp, state.filterPeriod);
      return typeMatch && periodMatch;
    });

    if (filtered.length === 0) {
      el.ledgerBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:18px;">No transactions found for this filter.</td></tr>`;
      return;
    }

    el.ledgerBody.innerHTML = filtered
      .map((tx) => {
        const isIncoming = tx.type === 'in';
        const summaryText = isIncoming
          ? tx.items.map((i) => `${i.name} (x${i.qty})`).join(', ')
          : tx.description;
        const noteSub = isIncoming && tx.note ? `<span class="ledger-note">Note: ${escapeHTML(tx.note)}</span>` : '';

        return `
          <tr>
            <td class="tabular">${escapeHTML(tx.formattedDate)}<span class="ledger-note">${escapeHTML(tx.id)}</span></td>
            <td>${escapeHTML(summaryText)}${noteSub}</td>
            <td><span class="pill ${isIncoming ? 'pill-in' : 'pill-out'}">${isIncoming ? 'Incoming' : 'Outgoing'}</span></td>
            <td class="num tabular ${isIncoming ? 'text-in' : 'text-out'}">${isIncoming ? '+' : '-'}${formatCurrency(tx.amount)}</td>
            <td class="num">
              ${
                isIncoming
                  ? `<button type="button" class="btn btn-ghost btn-sm" data-reprint-id="${tx.id}">Reprint</button>`
                  : `<span class="muted-label">—</span>`
              }
            </td>
          </tr>`;
      })
      .join('');
  }

  function commitAndRender() {
    saveState();
    renderServices();
    renderCartAndPreview();
    renderSummaries();
    renderLedger();
  }

  // Event Listeners
  function bindEvents() {
    el.toggleServiceFormBtn.addEventListener('click', () => {
      el.serviceForm.classList.toggle('hidden');
      if (!el.serviceForm.classList.contains('hidden')) el.serviceName.focus();
    });

    el.serviceForm.addEventListener('submit', upsertService);
    el.serviceCancelBtn.addEventListener('click', resetServiceForm);

    el.serviceGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'edit') {
        e.stopPropagation();
        editService(id);
      } else if (action === 'delete') {
        e.stopPropagation();
        deleteService(id);
      } else if (action === 'add') {
        addToCart(id);
      }
    });

    el.cartItems.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cart-action]');
      if (!btn) return;
      const { cartAction, id } = btn.dataset;
      if (cartAction === 'inc') updateCartQty(id, 1);
      if (cartAction === 'dec') updateCartQty(id, -1);
      if (cartAction === 'rem') updateCartQty(id, -9999);
    });

    el.customerNote.addEventListener('input', (e) => {
      state.customerNote = e.target.value;
      renderCartAndPreview();
    });

    el.clearCartBtn.addEventListener('click', clearCart);
    el.completeOrderBtn.addEventListener('click', completeOrder);
    el.expenseForm.addEventListener('submit', recordExpense);

    el.filterType.addEventListener('change', (e) => {
      state.filterType = e.target.value;
      renderLedger();
    });

    el.filterPeriod.addEventListener('change', (e) => {
      state.filterPeriod = e.target.value;
      renderLedger();
    });

    el.ledgerBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-reprint-id]');
      if (!btn) return;
      const order = state.ledger.find((tx) => tx.id === btn.dataset.reprintId);
      if (order) printReceipt(order);
    });

    // Online / Offline Status & Live Clock
    const updateNetworkStatus = () => {
      const online = navigator.onLine;
      el.offlineBadge.textContent = online ? 'Online' : 'Offline Ready';
      el.offlineBadge.className = `badge ${online ? 'badge-online' : 'badge-offline'}`;
    };
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    const updateClock = () => {
      el.liveClock.textContent = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Register Service Worker for Offline PWA
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
      });
    }
  }

  // Initialize App
  el.expenseDate.value = todayInputDate();
  bindEvents();
  commitAndRender();
  registerServiceWorker();
})();
