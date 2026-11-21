(() => {
  'use strict';

  const STORAGE_KEYS = {
    SERVICES: 'salon_cashier_services_v1',
    LEDGER: 'salon_cashier_ledger_v1',
    CART: 'salon_cashier_cart_v1',
    THEME: 'salon_cashier_theme_v1'
  };

  const DEFAULT_SERVICES = [
    { id: 'srv-1', name: 'Potong Rambut', price: 50000 },
    { id: 'srv-2', name: 'Cuci & Blow', price: 45000 },
    { id: 'srv-3', name: 'Cat Rambut', price: 250000 },
    { id: 'srv-4', name: 'Hair Spa', price: 120000 },
    { id: 'srv-5', name: 'Manicure', price: 65000 },
    { id: 'srv-6', name: 'Pedicure', price: 75000 }
  ];

  const COMBOS = {
    'hair-basic': ['srv-1', 'srv-2'],
    'spa-relax': ['srv-4', 'srv-2'],
    'nails-duo': ['srv-5', 'srv-6']
  };

  const state = {
    services: loadJSON(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES),
    ledger: loadJSON(STORAGE_KEYS.LEDGER, []),
    cart: loadJSON(STORAGE_KEYS.CART, []),
    theme: (() => {
      try {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
      } catch {
        return 'light';
      }
    })(),
    multiMode: false,
    selectedMap: {},
    customerNote: '',
    filterType: 'all',
    filterPeriod: 'monthly',
    pendingDeleteServiceId: null,
    pendingDeleteTxId: null,
    activeDetailOrderId: null,
    currentView: 'pos'
  };

  const el = {
    offlineBadge: document.getElementById('offline-badge'),
    liveClock: document.getElementById('live-clock'),
    navLookupBtn: document.getElementById('nav-lookup-btn'),
    toggleThemeBtn: document.getElementById('toggle-theme-btn'),
    posView: document.getElementById('pos-view'),
    lookupView: document.getElementById('lookup-view'),
    backToPosBtn: document.getElementById('back-to-pos-btn'),
    lookupForm: document.getElementById('lookup-form'),
    lookupInput: document.getElementById('lookup-input'),
    lookupRecentChips: document.getElementById('lookup-recent-chips'),
    lookupResult: document.getElementById('lookup-result'),
    sumTodayIn: document.getElementById('sum-today-in'),
    sumTodayOut: document.getElementById('sum-today-out'),
    sumTodayNet: document.getElementById('sum-today-net'),
    sumWeekIn: document.getElementById('sum-week-in'),
    sumWeekOut: document.getElementById('sum-week-out'),
    sumWeekNet: document.getElementById('sum-week-net'),
    sumMonthIn: document.getElementById('sum-month-in'),
    sumMonthOut: document.getElementById('sum-month-out'),
    sumMonthNet: document.getElementById('sum-month-net'),
    toggleMultiBtn: document.getElementById('toggle-multi-btn'),
    quickCombos: document.getElementById('quick-combos'),
    multiBar: document.getElementById('multi-bar'),
    multiSelectedCount: document.getElementById('multi-selected-count'),
    applyMultiBtn: document.getElementById('apply-multi-btn'),
    cancelMultiBtn: document.getElementById('cancel-multi-btn'),
    toggleServiceFormBtn: document.getElementById('toggle-service-form-btn'),
    serviceForm: document.getElementById('service-form'),
    serviceEditId: document.getElementById('service-edit-id'),
    serviceName: document.getElementById('service-name'),
    servicePrice: document.getElementById('service-price'),
    serviceCancelBtn: document.getElementById('service-cancel-btn'),
    serviceGrid: document.getElementById('service-grid'),
    expenseForm: document.getElementById('expense-form'),
    expenseDesc: document.getElementById('expense-desc'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseDate: document.getElementById('expense-date'),
    filterType: document.getElementById('filter-type'),
    filterPeriod: document.getElementById('filter-period'),
    ledgerBody: document.getElementById('ledger-body'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    cartItems: document.getElementById('cart-items'),
    customerNote: document.getElementById('customer-note'),
    cartCount: document.getElementById('cart-count'),
    cartTotal: document.getElementById('cart-total'),
    completeOrderBtn: document.getElementById('complete-order-btn'),
    receiptPreview: document.getElementById('receipt-preview'),
    printArea: document.getElementById('print-area'),
    deleteModal: document.getElementById('delete-modal'),
    deleteModalDesc: document.getElementById('delete-modal-desc'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    orderDetailModal: document.getElementById('order-detail-modal'),
    orderDetailBody: document.getElementById('order-detail-body'),
    closeDetailBtn: document.getElementById('close-detail-btn'),
    detailToLookupBtn: document.getElementById('detail-to-lookup-btn'),
    detailPrintBtn: document.getElementById('detail-print-btn'),
    exportBackupBtn: document.getElementById('export-backup-btn'),
    importBackupBtn: document.getElementById('import-backup-btn'),
    importBackupFile: document.getElementById('import-backup-file')
  };

  function deepClone(obj) {
    if (typeof window !== 'undefined' && typeof window.structuredClone === 'function') {
      try {
        return window.structuredClone(obj);
      } catch {
        // fallback di bawah
      }
    }
    return JSON.parse(JSON.stringify(obj));
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return deepClone(fallback);
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback) && !Array.isArray(parsed)) {
        return deepClone(fallback);
      }
      return parsed ?? deepClone(fallback);
    } catch {
      return deepClone(fallback);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(state.services));
      localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(state.ledger));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
      localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    } catch {
      // Abaikan jika penyimpanan lokal penuh atau dibatasi browser
    }
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
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function generateOrderId() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const ymd = new Date(now - offset).toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `MFD-${ymd}-${rand}`;
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

  function isWithinPeriod(isoString, period) {
    if (period === 'all') return true;
    const txDate = new Date(isoString);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'daily') return txDate >= startOfToday;
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

  function applyTheme() {
    const isDark = state.theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    el.toggleThemeBtn.textContent = isDark ? 'Terang' : 'Gelap';
  }

  /* Navigasi Halaman Kasir vs Halaman Cek Riwayat ID Order */
  function switchView(viewName, prefillOrderId = '') {
    state.currentView = viewName;
    const isLookup = viewName === 'lookup';
    el.posView.classList.toggle('hidden', isLookup);
    el.lookupView.classList.toggle('hidden', !isLookup);
    el.navLookupBtn.classList.toggle('btn-primary', isLookup);
    el.navLookupBtn.classList.toggle('btn-secondary', !isLookup);

    if (isLookup) {
      renderLookupRecentChips();
      if (prefillOrderId) {
        el.lookupInput.value = prefillOrderId;
        renderLookupResult(prefillOrderId);
      } else if (el.lookupInput.value.trim()) {
        renderLookupResult(el.lookupInput.value.trim());
      } else {
        const latestOrder = state.ledger.find((tx) => tx.type === 'in');
        if (latestOrder) {
          el.lookupInput.value = latestOrder.id;
          renderLookupResult(latestOrder.id);
        } else {
          el.lookupResult.innerHTML = `<p class="empty-state">Belum ada riwayat order yang tersimpan.</p>`;
        }
      }
    }
  }

  function renderLookupRecentChips() {
    const recentOrders = state.ledger.filter((tx) => tx.type === 'in').slice(0, 6);
    if (recentOrders.length === 0) {
      el.lookupRecentChips.innerHTML = '';
      return;
    }
    el.lookupRecentChips.innerHTML = recentOrders
      .map(
        (ord) =>
          `<button type="button" class="combo-chip tabular" data-lookup-chip="${escapeHTML(ord.id)}">${escapeHTML(ord.id)}</button>`
      )
      .join('');
  }

  function buildOrderDetailHTML(order) {
    const itemsListHTML = order.items
      .map(
        (item) => `
        <div class="detail-line">
          <span>${escapeHTML(item.name)} (x${item.qty})</span>
          <span class="tabular">${formatCurrency(item.price * item.qty)}</span>
        </div>`
      )
      .join('');

    const noteBlockHTML = order.note
      ? `<div class="rcp-note" style="background: var(--surface); border-color: var(--border); color: var(--text);"><strong>Catatan Pelanggan:</strong> ${escapeHTML(order.note)}</div>`
      : `<div class="muted-label">Tidak ada catatan khusus pelanggan.</div>`;

    return `
      <div class="detail-box">
        <div class="detail-line">
          <span class="muted-label">ID Order</span>
          <strong class="tabular">${escapeHTML(order.id)}</strong>
        </div>
        <div class="detail-line">
          <span class="muted-label">Waktu Transaksi</span>
          <span class="tabular">${escapeHTML(formatDateTime(order.timestamp))}</span>
        </div>
        <div class="detail-items">
          ${itemsListHTML}
        </div>
        ${noteBlockHTML}
        <div class="detail-line" style="font-size: 15px; padding-top: 4px;">
          <strong>Total Pembayaran</strong>
          <strong class="tabular text-in">${formatCurrency(order.amount)}</strong>
        </div>
      </div>
    `;
  }

  function renderLookupResult(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    if (!query) {
      el.lookupResult.innerHTML = `<p class="empty-state">Ketik ID Order terlebih dahulu untuk mencari transaksi.</p>`;
      return;
    }

    const order = state.ledger.find(
      (tx) => tx.type === 'in' && tx.id.toLowerCase() === query
    ) || state.ledger.find(
      (tx) => tx.type === 'in' && tx.id.toLowerCase().includes(query)
    );

    if (!order) {
      el.lookupResult.innerHTML = `<p class="empty-state">Transaksi dengan ID Order "<strong>${escapeHTML(rawQuery)}</strong>" tidak ditemukan.</p>`;
      return;
    }

    el.lookupResult.innerHTML = `
      ${buildOrderDetailHTML(order)}
      <div style="display:flex; justify-content:flex-end; margin-top:12px;">
        <button type="button" class="btn btn-primary btn-sm" data-reprint-id="${escapeHTML(order.id)}">Cetak Ulang Struk</button>
      </div>
    `;
  }

  /* Modal Detail Order Saat ID Order di Buku Kas Diklik */
  function openOrderDetailModal(orderId) {
    const order = state.ledger.find((tx) => tx.type === 'in' && tx.id === orderId);
    if (!order) return;

    state.activeDetailOrderId = order.id;
    el.orderDetailBody.innerHTML = buildOrderDetailHTML(order);
    el.orderDetailModal.classList.remove('hidden');
  }

  function closeOrderDetailModal() {
    state.activeDetailOrderId = null;
    el.orderDetailModal.classList.add('hidden');
  }

  /* Katalog Layanan & Konfirmasi Hapus */
  function upsertService(e) {
    e.preventDefault();
    const name = el.serviceName.value.trim();
    const price = Math.round(Number(el.servicePrice.value));
    const editId = el.serviceEditId.value;
    if (!name || Number.isNaN(price) || price < 0) return;

    if (editId) {
      const target = state.services.find((s) => s.id === editId);
      if (target) {
        target.name = name;
        target.price = price;
      }
      const cartItem = state.cart.find((c) => c.serviceId === editId);
      if (cartItem) {
        cartItem.name = name;
        cartItem.price = price;
      }
    } else {
      state.services.push({ id: `srv-${Date.now()}`, name, price });
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

  function requestDeleteService(id) {
    const srv = state.services.find((s) => s.id === id);
    if (!srv) return;
    state.pendingDeleteServiceId = id;
    state.pendingDeleteTxId = null;
    document.getElementById('delete-modal-title').textContent = 'Konfirmasi Hapus Layanan';
    el.deleteModalDesc.innerHTML = `Yakin ingin menghapus layanan <strong>${escapeHTML(srv.name)}</strong> (${formatCurrency(srv.price)}) dari katalog?`;
    el.deleteModal.classList.remove('hidden');
  }

  function requestDeleteTx(txId) {
    const tx = state.ledger.find((t) => t.id === txId);
    if (!tx) return;
    state.pendingDeleteTxId = txId;
    state.pendingDeleteServiceId = null;
    document.getElementById('delete-modal-title').textContent = 'Konfirmasi Hapus Transaksi';
    const label = tx.type === 'in' ? `Order ${tx.id}` : tx.description;
    el.deleteModalDesc.innerHTML = `Yakin ingin menghapus catatan <strong>${escapeHTML(label)}</strong> (${formatCurrency(tx.amount)}) dari Buku Kas?`;
    el.deleteModal.classList.remove('hidden');
  }

  function cancelDeleteService() {
    state.pendingDeleteServiceId = null;
    state.pendingDeleteTxId = null;
    el.deleteModal.classList.add('hidden');
  }

  function confirmDeleteService() {
    if (state.pendingDeleteServiceId) {
      const id = state.pendingDeleteServiceId;
      state.services = state.services.filter((s) => s.id !== id);
      delete state.selectedMap[id];
      if (el.serviceEditId.value === id) resetServiceForm();
      cancelDeleteService();
      commitAndRender();
      return;
    }
    if (state.pendingDeleteTxId) {
      const txId = state.pendingDeleteTxId;
      state.ledger = state.ledger.filter((t) => t.id !== txId);
      cancelDeleteService();
      commitAndRender();
    }
  }

  function exportBackupJSON() {
    const payload = {
      app: 'Salon Mufida POS',
      exportedAt: new Date().toISOString(),
      services: state.services,
      ledger: state.ledger
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-salon-mufida-${todayInputDate()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportBackup(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!Array.isArray(parsed.services) || !Array.isArray(parsed.ledger)) {
          alert('Format file backup tidak sesuai.');
          return;
        }
        const validServices = parsed.services
          .filter((s) => s && typeof s.name === 'string' && !Number.isNaN(Number(s.price)))
          .map((s, idx) => ({
            id: typeof s.id === 'string' ? s.id : `srv-${Date.now()}-${idx}`,
            name: s.name.trim().slice(0, 80),
            price: Math.max(0, Math.round(Number(s.price)))
          }));

        const validLedger = parsed.ledger
          .filter((t) => t && (t.type === 'in' || t.type === 'out') && !Number.isNaN(Number(t.amount)) && t.timestamp)
          .map((t, idx) => ({
            id: typeof t.id === 'string' ? t.id : `TX-${Date.now()}-${idx}`,
            type: t.type,
            timestamp: String(t.timestamp),
            formattedDate: formatDateTime(t.timestamp),
            items: Array.isArray(t.items)
              ? t.items.map((it) => ({
                  serviceId: String(it.serviceId || ''),
                  name: String(it.name || 'Layanan').slice(0, 80),
                  price: Math.max(0, Math.round(Number(it.price) || 0)),
                  qty: Math.max(1, Math.round(Number(it.qty) || 1))
                }))
              : [],
            description: typeof t.description === 'string' ? t.description.slice(0, 140) : '',
            note: typeof t.note === 'string' ? t.note.slice(0, 240) : '',
            amount: Math.max(0, Math.round(Number(t.amount)))
          }));

        if (validServices.length > 0) state.services = validServices;
        state.ledger = validLedger.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        commitAndRender();
        alert('Data backup Salon Mufida berhasil dipulihkan.');
      } catch {
        alert('Gagal membaca file backup. Pastikan file JSON valid.');
      } finally {
        el.importBackupFile.value = '';
      }
    };
    reader.readAsText(file);
  }

  function resetServiceForm() {
    el.serviceEditId.value = '';
    el.serviceName.value = '';
    el.servicePrice.value = '';
    el.serviceCancelBtn.classList.add('hidden');
  }

  function pushServiceToCart(serviceId, qtyToAdd = 1) {
    const srv = state.services.find((s) => s.id === serviceId);
    if (!srv || qtyToAdd <= 0) return;

    const existing = state.cart.find((item) => item.serviceId === serviceId);
    if (existing) {
      existing.qty += qtyToAdd;
    } else {
      state.cart.push({
        serviceId: srv.id,
        name: srv.name,
        price: srv.price,
        qty: qtyToAdd
      });
    }
  }

  function addToCart(serviceId) {
    pushServiceToCart(serviceId, 1);
    commitAndRender();
  }

  function addMultipleServicesToCart(serviceIds) {
    for (const id of serviceIds) {
      pushServiceToCart(id, 1);
    }
    commitAndRender();
  }

  function toggleMultiSelection(serviceId) {
    if (state.selectedMap[serviceId]) {
      delete state.selectedMap[serviceId];
    } else {
      state.selectedMap[serviceId] = 1;
    }
    renderServices();
    renderMultiBar();
  }

  function changeMultiQty(serviceId, delta) {
    const current = state.selectedMap[serviceId] || 0;
    const next = current + delta;
    if (next <= 0) {
      delete state.selectedMap[serviceId];
    } else {
      state.selectedMap[serviceId] = next;
    }
    renderServices();
    renderMultiBar();
  }

  function applyMultiSelection() {
    const entries = Object.entries(state.selectedMap);
    if (entries.length === 0) return;

    for (const [serviceId, qty] of entries) {
      pushServiceToCart(serviceId, qty);
    }

    state.selectedMap = {};
    state.multiMode = false;
    commitAndRender();
  }

  function cancelMultiMode() {
    state.selectedMap = {};
    state.multiMode = false;
    renderServices();
    renderMultiBar();
  }

  function renderMultiBar() {
    el.multiBar.classList.toggle('hidden', !state.multiMode);
    el.toggleMultiBtn.classList.toggle('btn-primary', state.multiMode);
    el.toggleMultiBtn.classList.toggle('btn-secondary', !state.multiMode);

    const entries = Object.entries(state.selectedMap);
    const totalServices = entries.length;
    const totalQty = entries.reduce((sum, [, q]) => sum + q, 0);

    el.multiSelectedCount.textContent = `${totalServices} layanan (${totalQty} item) dipilih`;
    el.applyMultiBtn.disabled = totalServices === 0;
  }

  function updateCartQty(serviceId, delta) {
    const idx = state.cart.findIndex((item) => item.serviceId === serviceId);
    if (idx === -1) return;
    state.cart[idx].qty += delta;
    if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
    commitAndRender();
  }

  function clearCart() {
    state.cart = [];
    state.customerNote = '';
    el.customerNote.value = '';
    commitAndRender();
  }

  function completeOrder() {
    if (state.cart.length === 0) return;
    const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const nowIso = new Date().toISOString();
    const orderRecord = {
      id: generateOrderId(),
      type: 'in',
      timestamp: nowIso,
      formattedDate: formatDateTime(nowIso),
      items: deepClone(state.cart),
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
    const amount = Math.round(Number(el.expenseAmount.value));
    const dateVal = el.expenseDate.value;
    if (!desc || Number.isNaN(amount) || amount < 1 || !dateVal) return;

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

    state.ledger.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    el.expenseDesc.value = '';
    el.expenseAmount.value = '';
    el.expenseDate.value = todayInputDate();
    commitAndRender();
  }

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
      ? `<div class="rcp-note"><strong>Catatan:</strong> ${escapeHTML(order.note)}</div>`
      : '';

    return `
      <div class="receipt-sheet">
        <div class="rcp-center">
          <h3 class="rcp-title">SALON MUFIDA</h3>
          <div>Struk Layanan Resmi</div>
        </div>
        <hr class="rcp-divider" />
        <div class="rcp-row"><span>ID Order</span><span>${escapeHTML(order.id)}</span></div>
        <div class="rcp-row"><span>Tanggal</span><span>${escapeHTML(formatDateTime(order.timestamp))}</span></div>
        <hr class="rcp-divider" />
        ${itemsHTML}
        ${noteHTML}
        <hr class="rcp-divider" />
        <div class="rcp-row rcp-total">
          <span>TOTAL BAYAR</span>
          <span class="tabular">${formatCurrency(order.amount)}</span>
        </div>
        <hr class="rcp-divider" />
        <div class="rcp-center">Terima kasih atas kunjungan Anda!</div>
      </div>
    `;
  }

  function printReceipt(order) {
    el.printArea.innerHTML = buildReceiptHTML(order);
    window.print();
  }

  function renderServices() {
    el.serviceGrid.innerHTML = state.services
      .map((srv) => {
        const selectedQty = state.selectedMap[srv.id] || 0;
        const isSelected = state.multiMode && selectedQty > 0;

        const multiControlsHTML = state.multiMode
          ? `
            <div class="multi-qty-box" data-stop-select="true">
              <span class="multi-qty-label">${isSelected ? 'Dipilih' : 'Klik kartu'}</span>
              <div class="qty-controls">
                <button type="button" class="qty-btn" data-multi-action="dec" data-id="${srv.id}">-</button>
                <span class="qty-val tabular">${selectedQty}</span>
                <button type="button" class="qty-btn" data-multi-action="inc" data-id="${srv.id}">+</button>
              </div>
            </div>`
          : '';

        return `
          <div class="service-tile ${isSelected ? 'is-selected' : ''}" data-action="tile" data-id="${srv.id}">
            <div class="service-tile-top">
              <span class="service-title">${escapeHTML(srv.name)}</span>
            </div>
            <div class="service-row-bottom">
              <span class="service-price tabular">${formatCurrency(srv.price)}</span>
              <div class="service-controls">
                <button type="button" class="icon-btn" data-action="edit" data-id="${srv.id}">Edit</button>
                <button type="button" class="icon-btn" data-action="delete" data-id="${srv.id}" aria-label="Hapus layanan">&times;</button>
              </div>
            </div>
            ${multiControlsHTML}
          </div>`;
      })
      .join('');
  }

  function renderCartAndPreview() {
    const totalQty = state.cart.reduce((sum, i) => sum + i.qty, 0);
    const totalAmount = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    el.cartCount.textContent = totalQty;
    el.cartTotal.textContent = formatCurrency(totalAmount);
    el.completeOrderBtn.disabled = state.cart.length === 0;

    if (state.cart.length === 0) {
      el.cartItems.innerHTML = `<p class="empty-state">Pilih layanan di katalog untuk memulai pesanan.</p>`;
    } else {
      el.cartItems.innerHTML = state.cart
        .map(
          (item) => `
          <div class="cart-row">
            <div class="cart-row-info">
              <span class="cart-row-name">${escapeHTML(item.name)}</span>
              <span class="cart-row-sub tabular">${formatCurrency(item.price)} satuan</span>
            </div>
            <div class="qty-controls">
              <button type="button" class="qty-btn" data-cart-action="dec" data-id="${item.serviceId}">-</button>
              <span class="qty-val tabular">${item.qty}</span>
              <button type="button" class="qty-btn" data-cart-action="inc" data-id="${item.serviceId}">+</button>
              <button type="button" class="qty-btn" data-cart-action="rem" data-id="${item.serviceId}">&times;</button>
            </div>
          </div>`
        )
        .join('');
    }

    const previewOrder = {
      id: 'MFD-PREVIEW',
      timestamp: new Date().toISOString(),
      items: state.cart.length ? state.cart : [{ name: 'Contoh Layanan', qty: 1, price: 0 }],
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
      el.ledgerBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:18px;">Belum ada transaksi untuk filter ini.</td></tr>`;
      return;
    }

    el.ledgerBody.innerHTML = filtered
      .map((tx) => {
        const isIncoming = tx.type === 'in';
        const summaryText = isIncoming
          ? tx.items.map((i) => `${i.name} (x${i.qty})`).join(', ')
          : tx.description;
        const noteSub =
          isIncoming && tx.note
            ? `<span class="ledger-note">Catatan: ${escapeHTML(tx.note)}</span>`
            : '';

        const orderIdControl = isIncoming
          ? `<div class="order-id-row">
              <button type="button" class="order-id-link tabular" data-detail-id="${escapeHTML(tx.id)}">${escapeHTML(tx.id)}</button>
              <button type="button" class="btn btn-ghost btn-xs" data-lookup-id="${escapeHTML(tx.id)}" title="Buka di halaman riwayat ID Order">Cek</button>
            </div>`
          : `<span class="ledger-note">${escapeHTML(tx.id)}</span>`;

        return `
          <tr>
            <td class="tabular">${escapeHTML(formatDateTime(tx.timestamp))}${orderIdControl}</td>
            <td>${escapeHTML(summaryText)}${noteSub}</td>
            <td><span class="pill ${isIncoming ? 'pill-in' : 'pill-out'}">${isIncoming ? 'Masuk' : 'Keluar'}</span></td>
            <td class="num tabular ${isIncoming ? 'text-in' : 'text-out'}">${isIncoming ? '+' : '-'}${formatCurrency(tx.amount)}</td>
            <td class="num">
              <div style="display:inline-flex; gap:4px; align-items:center;">
                ${
                  isIncoming
                    ? `<button type="button" class="btn btn-ghost btn-sm" data-reprint-id="${escapeHTML(tx.id)}">Cetak Ulang</button>`
                    : ''
                }
                <button type="button" class="btn btn-ghost btn-sm" data-del-tx-id="${escapeHTML(tx.id)}" title="Hapus catatan transaksi">Hapus</button>
              </div>
            </td>
          </tr>`;
      })
      .join('');
  }

  function commitAndRender() {
    saveState();
    applyTheme();
    renderServices();
    renderMultiBar();
    renderCartAndPreview();
    renderSummaries();
    renderLedger();
    if (state.currentView === 'lookup') {
      renderLookupRecentChips();
    }
  }

  function bindEvents() {
    el.toggleThemeBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      commitAndRender();
    });

    el.navLookupBtn.addEventListener('click', () => {
      switchView(state.currentView === 'lookup' ? 'pos' : 'lookup');
    });

    el.backToPosBtn.addEventListener('click', () => {
      switchView('pos');
    });

    el.lookupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      renderLookupResult(el.lookupInput.value);
    });

    el.lookupRecentChips.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-lookup-chip]');
      if (!chip) return;
      const id = chip.dataset.lookupChip;
      el.lookupInput.value = id;
      renderLookupResult(id);
    });

    el.lookupResult.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-reprint-id]');
      if (!btn) return;
      const order = state.ledger.find((tx) => tx.id === btn.dataset.reprintId);
      if (order) printReceipt(order);
    });

    el.toggleMultiBtn.addEventListener('click', () => {
      state.multiMode = !state.multiMode;
      if (!state.multiMode) state.selectedMap = {};
      renderServices();
      renderMultiBar();
    });

    el.applyMultiBtn.addEventListener('click', applyMultiSelection);
    el.cancelMultiBtn.addEventListener('click', cancelMultiMode);

    el.quickCombos.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-combo]');
      if (!btn) return;
      const ids = COMBOS[btn.dataset.combo] || [];
      addMultipleServicesToCart(ids);
    });

    el.toggleServiceFormBtn.addEventListener('click', () => {
      el.serviceForm.classList.toggle('hidden');
      if (!el.serviceForm.classList.contains('hidden')) el.serviceName.focus();
    });

    el.serviceForm.addEventListener('submit', upsertService);
    el.serviceCancelBtn.addEventListener('click', resetServiceForm);

    el.serviceGrid.addEventListener('click', (e) => {
      const multiBtn = e.target.closest('[data-multi-action]');
      if (multiBtn) {
        e.stopPropagation();
        const { multiAction, id } = multiBtn.dataset;
        if (multiAction === 'inc') changeMultiQty(id, 1);
        if (multiAction === 'dec') changeMultiQty(id, -1);
        return;
      }

      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const { action, id } = actionEl.dataset;

      if (action === 'edit') {
        e.stopPropagation();
        editService(id);
      } else if (action === 'delete') {
        e.stopPropagation();
        requestDeleteService(id);
      } else if (action === 'tile') {
        if (state.multiMode) {
          toggleMultiSelection(id);
        } else {
          addToCart(id);
        }
      }
    });

    /* Modal Konfirmasi Hapus */
    el.cancelDeleteBtn.addEventListener('click', cancelDeleteService);
    el.confirmDeleteBtn.addEventListener('click', confirmDeleteService);
    let deleteBackdropDown = false;
    el.deleteModal.addEventListener('mousedown', (e) => {
      deleteBackdropDown = e.target === el.deleteModal;
    });
    el.deleteModal.addEventListener('mouseup', (e) => {
      if (deleteBackdropDown && e.target === el.deleteModal) cancelDeleteService();
      deleteBackdropDown = false;
    });

    /* Modal Detail Pesanan */
    el.closeDetailBtn.addEventListener('click', closeOrderDetailModal);
    let detailBackdropDown = false;
    el.orderDetailModal.addEventListener('mousedown', (e) => {
      detailBackdropDown = e.target === el.orderDetailModal;
    });
    el.orderDetailModal.addEventListener('mouseup', (e) => {
      if (detailBackdropDown && e.target === el.orderDetailModal) closeOrderDetailModal();
      detailBackdropDown = false;
    });
    el.detailPrintBtn.addEventListener('click', () => {
      if (!state.activeDetailOrderId) return;
      const order = state.ledger.find((tx) => tx.id === state.activeDetailOrderId);
      if (order) printReceipt(order);
    });
    el.detailToLookupBtn.addEventListener('click', () => {
      const targetId = state.activeDetailOrderId;
      closeOrderDetailModal();
      if (targetId) switchView('lookup', targetId);
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
      const detailBtn = e.target.closest('[data-detail-id]');
      if (detailBtn) {
        openOrderDetailModal(detailBtn.dataset.detailId);
        return;
      }

      const lookupBtn = e.target.closest('[data-lookup-id]');
      if (lookupBtn) {
        switchView('lookup', lookupBtn.dataset.lookupId);
        return;
      }

      const reprintBtn = e.target.closest('[data-reprint-id]');
      if (reprintBtn) {
        const order = state.ledger.find((tx) => tx.id === reprintBtn.dataset.reprintId);
        if (order) printReceipt(order);
        return;
      }

      const delTxBtn = e.target.closest('[data-del-tx-id]');
      if (delTxBtn) {
        requestDeleteTx(delTxBtn.dataset.delTxId);
      }
    });

    el.exportBackupBtn.addEventListener('click', exportBackupJSON);
    el.importBackupBtn.addEventListener('click', () => el.importBackupFile.click());
    el.importBackupFile.addEventListener('change', handleImportBackup);

    const updateNetworkStatus = () => {
      const online = navigator.onLine;
      el.offlineBadge.textContent = online ? 'Online' : 'Mode Offline';
      el.offlineBadge.className = `badge ${online ? 'badge-online' : 'badge-offline'}`;
    };
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    const updateClock = () => {
      el.liveClock.textContent = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!el.deleteModal.classList.contains('hidden')) cancelDeleteService();
        if (!el.orderDetailModal.classList.contains('hidden')) closeOrderDetailModal();
      }
    });

    updateClock();
    setInterval(updateClock, 1000);
  }

  el.expenseDate.value = todayInputDate();
  bindEvents();
  commitAndRender();
})();
