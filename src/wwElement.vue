<template>
  <div v-if="!content.portalTarget || content.portalTarget === 'admin'" class="spread-kd">
    <!-- ── Gate overlay (missing credentials) ───────────────────────── -->
    <div v-if="!content.accessToken || !content.userId" class="spread-kd__gate">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <p class="spread-kd__gate-text">Admin access required</p>
    </div>

    <template v-else>
      <!-- ── Header ──────────────────────────────────────────────────── -->
      <div class="spread-kd__header">
        <div>
          <h2 class="spread-kd__title">KPI Dashboard</h2>
          <p class="spread-kd__subtitle">{{ periodLabel }}</p>
        </div>
        <button class="spread-kd__refresh-btn" @click="loadAll" :disabled="loading" title="Refresh all data">
          <span v-if="loading" class="spread-kd__spinner spread-kd__spinner--sm"></span>
          <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      <!-- ── Section A: KPI Cards ────────────────────────────────────── -->
      <section class="spread-kd__section">
        <h3 class="spread-kd__section-title">Revenue & Subscribers</h3>
        <div v-if="loading && !kpis" class="spread-kd__skeleton-row">
          <div v-for="i in 7" :key="i" class="spread-kd__skeleton-card"></div>
        </div>
        <div v-else class="spread-kd__kpi-grid">
          <div class="spread-kd__kpi-card">
            <span class="spread-kd__kpi-label">MRR</span>
            <span class="spread-kd__kpi-value spread-kd__kpi-value--lg">{{ formatCurrency(kpis?.mrr_cents) }}</span>
          </div>
          <div class="spread-kd__kpi-card">
            <span class="spread-kd__kpi-label">ARR</span>
            <span class="spread-kd__kpi-value spread-kd__kpi-value--lg">{{ formatCurrency(kpis?.arr_cents) }}</span>
          </div>
          <div class="spread-kd__kpi-card">
            <span class="spread-kd__kpi-label">Active Subscribers</span>
            <span class="spread-kd__kpi-value spread-kd__kpi-value--lg">{{ (kpis?.active_subscribers ?? 0).toLocaleString() }}</span>
          </div>
          <div class="spread-kd__kpi-card spread-kd__kpi-card--warn">
            <span class="spread-kd__kpi-label">Churn MTD</span>
            <span class="spread-kd__kpi-value">{{ (kpis?.churn_mtd ?? 0).toLocaleString() }}</span>
          </div>
          <div class="spread-kd__kpi-card">
            <span class="spread-kd__kpi-label">Revenue MTD</span>
            <span class="spread-kd__kpi-value">{{ formatCurrency(kpis?.revenue_mtd_cents) }}</span>
          </div>
          <div class="spread-kd__kpi-card">
            <span class="spread-kd__kpi-label">Revenue YTD</span>
            <span class="spread-kd__kpi-value">{{ formatCurrency(kpis?.revenue_ytd_cents) }}</span>
          </div>
          <div class="spread-kd__kpi-card" :class="capacityCardClass">
            <span class="spread-kd__kpi-label">Avg Capacity</span>
            <span class="spread-kd__kpi-value">{{ kpis?.capacity_avg_pct ?? 0 }}%</span>
          </div>
        </div>
      </section>

      <!-- ── Section B: Order Funnel ─────────────────────────────────── -->
      <section class="spread-kd__section">
        <h3 class="spread-kd__section-title">Order Funnel <span class="spread-kd__section-sub">(last 7 days)</span></h3>
        <div v-if="loading && !funnel.length" class="spread-kd__skeleton-table"></div>
        <div v-else-if="!funnel.length" class="spread-kd__empty">
          <p>No funnel data available yet.</p>
        </div>
        <div v-else class="spread-kd__funnel-wrap">
          <div class="spread-kd__funnel-table">
            <div class="spread-kd__funnel-row spread-kd__funnel-row--head">
              <span>Date</span>
              <span>Carts</span>
              <span>Checkouts</span>
              <span>Orders</span>
              <span>Cancelled</span>
              <span>Conv %</span>
            </div>
            <div
              v-for="row in funnelSlice"
              :key="row.date"
              class="spread-kd__funnel-row"
            >
              <span class="spread-kd__funnel-date">{{ formatDate(row.date) }}</span>
              <span>{{ row.carts_created ?? 0 }}</span>
              <span>{{ row.checkouts_started ?? 0 }}</span>
              <span>{{ row.orders_completed ?? 0 }}</span>
              <span class="spread-kd__funnel-cancelled">{{ row.orders_cancelled ?? 0 }}</span>
              <span class="spread-kd__funnel-conv">
                <span class="spread-kd__funnel-bar">
                  <span class="spread-kd__funnel-bar-fill" :style="{ width: Math.min(row.conversion_pct ?? 0, 100) + '%' }"></span>
                </span>
                {{ row.conversion_pct ?? 0 }}%
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Section C: Live Alerts Feed ────────────────────────────── -->
      <section v-if="content.showAlertsFeed !== false" class="spread-kd__section">
        <h3 class="spread-kd__section-title">
          Live Alerts
          <span v-if="unreadCount > 0" class="spread-kd__alerts-unread-badge">{{ unreadCount }}</span>
          <span v-if="realtimeConnected" class="spread-kd__realtime-dot" title="Realtime connected"></span>
        </h3>
        <div v-if="!alerts.length" class="spread-kd__empty">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          <p>No active service alerts.</p>
        </div>
        <ul v-else class="spread-kd__alerts-list">
          <li
            v-for="alert in alerts.slice(0, 10)"
            :key="alert.id"
            class="spread-kd__alert-item"
            :class="`spread-kd__alert-item--${alert.severity || 'info'}`"
            @click="markAlertRead(alert.id)"
          >
            <div class="spread-kd__alert-item-top">
              <span class="spread-kd__alert-pill" :class="`spread-kd__alert-pill--${alert.severity || 'info'}`">{{ alert.severity || 'info' }}</span>
              <span class="spread-kd__alert-source-icon" :title="alert.source === 'auto_detect' ? 'Auto-detected' : 'Manual'">
                <svg v-if="alert.source === 'auto_detect'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </span>
              <span class="spread-kd__alert-time">{{ relativeTime(alert.created_at) }}</span>
              <span v-if="!readAlertIds.includes(alert.id)" class="spread-kd__alert-unread-dot"></span>
            </div>
            <p class="spread-kd__alert-headline">{{ alert.headline }}</p>
            <p v-if="alert.body" class="spread-kd__alert-body">{{ alert.body }}</p>
          </li>
        </ul>
      </section>

      <!-- ── Section D: Region Usage ─────────────────────────────────── -->
      <section class="spread-kd__section">
        <h3 class="spread-kd__section-title">Region Usage <span class="spread-kd__section-sub">(current cycle)</span></h3>
        <div v-if="loading && !regionUsage.length" class="spread-kd__skeleton-table"></div>
        <div v-else-if="!regionUsage.length" class="spread-kd__empty">
          <p>No region data available.</p>
        </div>
        <div v-else class="spread-kd__region-table-wrap">
          <div class="spread-kd__region-table">
            <div class="spread-kd__region-row spread-kd__region-row--head">
              <span>Region</span><span>State</span><span>Orders</span><span>Households</span>
            </div>
            <div v-for="r in regionUsage" :key="r.region_id" class="spread-kd__region-row">
              <span class="spread-kd__region-name">{{ r.region_name }}</span>
              <span class="spread-kd__region-state">{{ r.state_name }}</span>
              <span>{{ r.orders_count ?? 0 }}</span>
              <span>{{ r.unique_households ?? 0 }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script>
/* ── Mock data (editor preview) ─────────────────────────────────────────── */
const MOCK_KPIS = {
  mrr_cents: 1248000, arr_cents: 14976000,
  active_subscribers: 312, churn_mtd: 4,
  revenue_mtd_cents: 3840000, revenue_ytd_cents: 28640000,
  capacity_avg_pct: 63.5,
};
const MOCK_FUNNEL = [
  { date: '2026-03-05', carts_created: 48, checkouts_started: 31, orders_completed: 28, orders_cancelled: 3, conversion_pct: 58.3 },
  { date: '2026-03-06', carts_created: 52, checkouts_started: 35, orders_completed: 33, orders_cancelled: 2, conversion_pct: 63.5 },
  { date: '2026-03-07', carts_created: 61, checkouts_started: 44, orders_completed: 41, orders_cancelled: 3, conversion_pct: 67.2 },
];
const MOCK_ALERTS = [
  { id: '1', headline: 'Northern Rivers delivery delayed by 1 day', severity: 'warning', status: 'sent', source: 'manual', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', headline: 'Resolved: Payment gateway latency', severity: 'info', status: 'sent', source: 'auto_detect', created_at: new Date(Date.now() - 7200000).toISOString() },
];
const MOCK_REGIONS = [
  { region_id: 'r1', region_name: 'Byron Bay', state_name: 'NSW', orders_count: 84, unique_households: 76 },
  { region_id: 'r2', region_name: 'Gold Coast North', state_name: 'QLD', orders_count: 61, unique_households: 55 },
  { region_id: 'r3', region_name: 'Lismore', state_name: 'NSW', orders_count: 43, unique_households: 38 },
];

/* ── Inline Supabase RPC client ─────────────────────────────────────────── */
function createSpreadClient(url, anonKey, token) {
  const headers = { 'Content-Type': 'application/json', apikey: anonKey };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return {
    async rpc(fnName, params = {}) {
      const res = await fetch(`${url}/rest/v1/rpc/${fnName}`, {
        method: 'POST', headers, body: JSON.stringify(params),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw Object.assign(new Error(e.message || res.statusText), { status: res.status, code: e.code });
      }
      return res.json();
    },
    async fromSelect(table, { select = '*', filters = '', order = '', limit = null } = {}) {
      let qs = `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
      if (filters) qs += '&' + filters;
      if (order)   qs += '&order=' + order;
      if (limit)   qs += '&limit=' + limit;
      const res = await fetch(qs, { headers });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || res.statusText); }
      return res.json();
    },
  };
}

/* ── Realtime WebSocket helper ──────────────────────────────────────────── */
function openRealtimeChannel(wsBase, anonKey, table, onPayload) {
  const wsUrl = `${wsBase}/realtime/v1/websocket?apikey=${anonKey}&vsn=1.0.0`;
  const topic  = `realtime:public:${table}`;
  let ws, heartbeatId, reconnectId;
  function connect() {
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ topic: 'phoenix', event: 'phx_join', payload: {}, ref: '0' }));
        ws.send(JSON.stringify({ topic, event: 'phx_join', payload: { config: { postgres_changes: [{ event: '*', schema: 'public', table }] } }, ref: '1' }));
        heartbeatId = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: '0' })); }, 25000);
      };
      ws.onmessage = (e) => {
        try { const msg = JSON.parse(e.data); if (msg.event === 'postgres_changes' && msg.payload?.data) onPayload(msg.payload.data); } catch (_) {}
      };
      ws.onclose = () => { clearInterval(heartbeatId); reconnectId = setTimeout(connect, 5000); };
      ws.onerror = () => { try { ws.close(); } catch (_) {} };
    } catch (_) {}
  }
  connect();
  return { close() { clearTimeout(reconnectId); clearInterval(heartbeatId); try { if (ws) ws.close(); } catch (_) {} } };
}

export default {
  props: {
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
    content:        { type: Object, required: true },
    wwFrontState:   { type: Object, required: true },
    wwElementState: { type: Object, required: true },
  },

  emits: ['trigger-event', 'update:content'],

  setup() {
    const { value: kpiActiveMemberCount, setValue: setKpiActiveMemberCount } =
      wwLib.wwVariable.useComponentVariable({ uid: 'kpiActiveMemberCount', name: 'KPI Active Members', type: 'number', defaultValue: 0 });
    const { value: kpiMrrCents, setValue: setKpiMrrCents } =
      wwLib.wwVariable.useComponentVariable({ uid: 'kpiMrrCents', name: 'KPI MRR (cents)', type: 'number', defaultValue: 0 });
    const { value: kpiUnreadAlerts, setValue: setKpiUnreadAlerts } =
      wwLib.wwVariable.useComponentVariable({ uid: 'kpiUnreadAlerts', name: 'KPI Unread Alerts', type: 'number', defaultValue: 0 });
    return { kpiActiveMemberCount, setKpiActiveMemberCount, kpiMrrCents, setKpiMrrCents, kpiUnreadAlerts, setKpiUnreadAlerts };
  },

  data() {
    return {
      loading:           false,
      kpis:              null,
      funnel:            [],
      alerts:            [],
      regionUsage:       [],
      readAlertIds:      [],
      realtimeConnected: false,
      _pollTimer:        null,
      _realtimeChannel:  null,
    };
  },

  computed: {
    /* wwEditor:start */
    isEditorMode() { return !!this.wwEditorState; },
    /* wwEditor:end */
    periodLabel() {
      const now = new Date();
      return now.toLocaleString('default', { month: 'long', year: 'numeric' });
    },
    funnelSlice() {
      return [...this.funnel].sort((a, b) => b.date > a.date ? 1 : -1).slice(0, 7);
    },
    capacityCardClass() {
      const pct = this.kpis?.capacity_avg_pct ?? 0;
      if (pct >= 90) return 'spread-kd__kpi-card--red';
      if (pct >= 70) return 'spread-kd__kpi-card--amber';
      return 'spread-kd__kpi-card--green';
    },
    unreadCount() {
      return this.alerts.filter(a => !this.readAlertIds.includes(a.id)).length;
    },
  },

  watch: {
    'content.refreshTrigger'() { this.loadAll(); },
    'content.refreshInterval'() {
      clearInterval(this._pollTimer);
      this._startPolling();
    },
    unreadCount(n) { this.setKpiUnreadAlerts(n); },
  },

  mounted() {
    /* wwEditor:start */
    if (this.isEditorMode) {
      this.kpis = MOCK_KPIS;
      this.funnel = MOCK_FUNNEL;
      this.alerts = MOCK_ALERTS;
      this.regionUsage = MOCK_REGIONS;
      this.setKpiActiveMemberCount(MOCK_KPIS.active_subscribers);
      this.setKpiMrrCents(MOCK_KPIS.mrr_cents);
      return;
    }
    /* wwEditor:end */
    this.loadAll();
    this._startPolling();
    if (this.content.enableRealtime !== false) this._openAlertChannel();
  },

  beforeUnmount() {
    clearInterval(this._pollTimer);
    if (this._realtimeChannel) this._realtimeChannel.close();
  },

  methods: {
    client() {
      return createSpreadClient(this.content?.supabaseUrl, this.content?.supabaseAnonKey, this.content?.accessToken);
    },

    _startPolling() {
      const ms = (this.content.refreshInterval || 60) * 1000;
      this._pollTimer = setInterval(() => this.loadAll(), ms);
    },

    _openAlertChannel() {
      if (!this.content.supabaseUrl || !this.content.supabaseAnonKey) return;
      try {
        const wsBase = this.content.supabaseUrl.replace(/^https/, 'wss').replace(/^http/, 'ws');
        this._realtimeChannel = openRealtimeChannel(wsBase, this.content.supabaseAnonKey, 'service_alerts', (payload) => {
          if (payload.type === 'INSERT' || payload.type === 'UPDATE') {
            const r = payload.record;
            if (!r) return;
            const idx = this.alerts.findIndex(a => a.id === r.id);
            if (idx === -1) {
              this.alerts = [r, ...this.alerts];
              this.$emit('trigger-event', { name: 'kpidashboard:alertReceived', event: { alertId: r.id, headline: r.headline, severity: r.severity } });
            } else {
              const copy = [...this.alerts]; copy[idx] = r; this.alerts = copy;
            }
          }
        });
        this.realtimeConnected = true;
      } catch (_) { this.realtimeConnected = false; }
    },

    async loadAll() {
      if (!this.content.accessToken || !this.content.userId) return;
      if (!this.content.supabaseUrl || !this.content.supabaseAnonKey) return;
      this.loading = true;
      const c = this.client();
      const [kpiRes, funnelRes, regRes, alertsRes] = await Promise.allSettled([
        c.rpc('get_kpi_dashboard', { p_user_id: this.content.userId }),
        c.rpc('get_admin_order_funnel'),
        c.rpc('get_admin_region_usage', { p_limit: 10 }),
        c.fromSelect('service_alerts', {
          select: 'id,headline,body,severity,status,source,created_at',
          filters: 'status=in.(draft,active,sent)&is_public=eq.true',
          order: 'created_at.desc',
          limit: 10,
        }),
      ]);
      if (kpiRes.status === 'fulfilled' && kpiRes.value) {
        this.kpis = kpiRes.value;
        this.setKpiActiveMemberCount(this.kpis.active_subscribers || 0);
        this.setKpiMrrCents(this.kpis.mrr_cents || 0);
      } else if (kpiRes.status === 'rejected') { this.emitError(kpiRes.reason?.message || 'KPI load failed'); }

      if (funnelRes.status === 'fulfilled' && Array.isArray(funnelRes.value)) this.funnel = funnelRes.value;
      if (regRes.status === 'fulfilled' && Array.isArray(regRes.value)) this.regionUsage = regRes.value;
      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)) {
        this.alerts = alertsRes.value;
        this.setKpiUnreadAlerts(this.unreadCount);
      }

      this.loading = false;
      const loaded = [kpiRes, funnelRes, regRes, alertsRes].filter(r => r.status === 'fulfilled').length;
      this.$emit('trigger-event', { name: 'kpidashboard:loaded', event: { sections: `${loaded}/4` } });
    },

    markAlertRead(id) {
      if (!this.readAlertIds.includes(id)) {
        this.readAlertIds = [...this.readAlertIds, id];
        this.setKpiUnreadAlerts(this.unreadCount);
      }
    },

    emitError(msg) {
      this.$emit('trigger-event', { name: 'kpidashboard:error', event: { message: msg } });
    },

    formatCurrency(cents) {
      if (cents === null || cents === undefined) return '$—';
      const dollars = (cents / 100);
      if (dollars >= 1000000) return `$${(dollars / 1000000).toFixed(2)}M`;
      if (dollars >= 1000)    return `$${(dollars / 1000).toFixed(1)}k`;
      return `$${dollars.toFixed(2)}`;
    },

    formatDate(dateStr) {
      try { return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); } catch (_) { return dateStr; }
    },

    relativeTime(ts) {
      try {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      } catch (_) { return ''; }
    },
  },
};
</script>

<style scoped>
.spread-kd {
  /* Design tokens */
  --spread-primary:        #4B162D;
  --spread-accent:         #CE6632;
  --spread-accent-hover:   #B85A2B;
  --spread-black:          #141414;
  --spread-dark-grey:      #2B2B2B;
  --spread-mid-grey:       #4B5563;
  --spread-light-grey:     #6B7280;
  --spread-border:         #F3EADF;
  --spread-border-outer:   #EFE7DE;
  --spread-background:     #FBFAF8;
  --spread-success:        #16A34A;
  --spread-warning:        #D97706;
  --spread-error:          #D14343;
  --spread-info:           #2563EB;
  --spread-radius:         12px;
  --spread-radius-sm:      8px;
  --spread-font:           ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

  font-family: var(--spread-font);
  width: 100%;
  box-sizing: border-box;
  padding: 1.5rem;
  background: var(--spread-background);
  min-height: 400px;
  max-width: 1440px;
  margin-inline: auto;
}

.spread-kd *,
.spread-kd *::before,
.spread-kd *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* Gate */
.spread-kd__gate {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; min-height: 200px; color: var(--spread-mid-grey);
}
.spread-kd__gate-text { font-size: 14px; font-weight: 500; }

/* Header */
.spread-kd__header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
}
.spread-kd__title { font-size: 1.375rem; font-weight: 800; color: var(--spread-primary); line-height: 1.2; }
.spread-kd__subtitle { font-size: 0.8125rem; color: var(--spread-light-grey); margin-top: 2px; }

.spread-kd__refresh-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; background: var(--spread-primary); color: #fff;
  border: none; border-radius: var(--spread-radius-sm); font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: background 0.15s ease; flex-shrink: 0;
}
.spread-kd__refresh-btn:hover:not(:disabled) { background: #3a0f22; }
.spread-kd__refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Sections */
.spread-kd__section { margin-bottom: 2rem; }
.spread-kd__section-title {
  font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--spread-mid-grey); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;
}
.spread-kd__section-sub { font-size: 0.75rem; font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--spread-light-grey); }

/* KPI Grid */
.spread-kd__kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
@media (min-width: 480px) { .spread-kd__kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 768px) { .spread-kd__kpi-grid { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 1200px) { .spread-kd__kpi-grid { grid-template-columns: repeat(7, 1fr); } }

.spread-kd__kpi-card {
  background: #fff; border: 1px solid var(--spread-border);
  border-radius: var(--spread-radius); padding: 1rem 0.875rem;
  display: flex; flex-direction: column; gap: 6px;
  border-left: 3px solid var(--spread-border-outer);
}
.spread-kd__kpi-card--warn  { border-left-color: var(--spread-warning); }
.spread-kd__kpi-card--red   { border-left-color: var(--spread-error); }
.spread-kd__kpi-card--amber { border-left-color: var(--spread-warning); }
.spread-kd__kpi-card--green { border-left-color: var(--spread-success); }

.spread-kd__kpi-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--spread-light-grey); }
.spread-kd__kpi-value { font-size: 1.25rem; font-weight: 800; color: var(--spread-dark-grey); }
.spread-kd__kpi-value--lg { font-size: 1.5rem; }

/* Skeletons */
.spread-kd__skeleton-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.spread-kd__skeleton-card { height: 76px; background: linear-gradient(90deg, #f0ebe6 25%, #e8e2dc 50%, #f0ebe6 75%); background-size: 200% 100%; border-radius: var(--spread-radius); animation: spread-kd-shimmer 1.5s infinite; }
.spread-kd__skeleton-table { height: 120px; background: linear-gradient(90deg, #f0ebe6 25%, #e8e2dc 50%, #f0ebe6 75%); background-size: 200% 100%; border-radius: var(--spread-radius); animation: spread-kd-shimmer 1.5s infinite; }
@keyframes spread-kd-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Funnel table */
.spread-kd__funnel-wrap { overflow-x: auto; }
.spread-kd__funnel-table { min-width: 480px; }
.spread-kd__funnel-row {
  display: grid; grid-template-columns: 90px 1fr 1fr 1fr 1fr 140px;
  align-items: center; padding: 8px 12px; gap: 8px;
  font-size: 13px; border-bottom: 1px solid var(--spread-border);
}
.spread-kd__funnel-row--head {
  background: #fff; border-radius: var(--spread-radius-sm) var(--spread-radius-sm) 0 0;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--spread-mid-grey);
}
.spread-kd__funnel-date { font-weight: 600; color: var(--spread-dark-grey); }
.spread-kd__funnel-cancelled { color: var(--spread-error); }
.spread-kd__funnel-conv { display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--spread-dark-grey); }
.spread-kd__funnel-bar { flex: 1; height: 6px; background: var(--spread-border); border-radius: 3px; overflow: hidden; }
.spread-kd__funnel-bar-fill { height: 100%; background: var(--spread-accent); border-radius: 3px; transition: width 0.4s ease; }

/* Empty */
.spread-kd__empty { display: flex; align-items: center; gap: 8px; padding: 1.5rem; color: var(--spread-light-grey); font-size: 13px; font-weight: 500; background: #fff; border: 1px solid var(--spread-border); border-radius: var(--spread-radius); }

/* Alerts feed */
.spread-kd__alerts-unread-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  background: var(--spread-error); color: #fff; font-size: 10px; font-weight: 700;
  border-radius: 9px; letter-spacing: 0; text-transform: none;
}
.spread-kd__realtime-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--spread-success);
  animation: spread-kd-pulse 2s infinite;
}
@keyframes spread-kd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.spread-kd__alerts-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.spread-kd__alert-item {
  background: #fff; border: 1px solid var(--spread-border); border-radius: var(--spread-radius-sm);
  padding: 10px 14px; cursor: pointer; border-left: 3px solid transparent; transition: background 0.12s;
}
.spread-kd__alert-item:hover { background: var(--spread-background); }
.spread-kd__alert-item--critical,
.spread-kd__alert-item--outage    { border-left-color: var(--spread-error); }
.spread-kd__alert-item--warning,
.spread-kd__alert-item--degraded  { border-left-color: var(--spread-warning); }
.spread-kd__alert-item--info,
.spread-kd__alert-item--maintenance { border-left-color: var(--spread-info); }

.spread-kd__alert-item-top { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.spread-kd__alert-pill {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  padding: 2px 6px; border-radius: 4px;
}
.spread-kd__alert-pill--critical,
.spread-kd__alert-pill--outage   { background: #FEE2E2; color: #991B1B; }
.spread-kd__alert-pill--warning,
.spread-kd__alert-pill--degraded { background: #FEF3C7; color: #92400E; }
.spread-kd__alert-pill--info,
.spread-kd__alert-pill--maintenance { background: #DBEAFE; color: #1E40AF; }

.spread-kd__alert-source-icon { color: var(--spread-light-grey); display: flex; }
.spread-kd__alert-time { font-size: 11px; color: var(--spread-light-grey); margin-left: auto; }
.spread-kd__alert-unread-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--spread-accent); flex-shrink: 0; }
.spread-kd__alert-headline { font-size: 13px; font-weight: 600; color: var(--spread-dark-grey); line-height: 1.4; }
.spread-kd__alert-body { font-size: 12px; color: var(--spread-mid-grey); margin-top: 2px; line-height: 1.4; }

/* Region table */
.spread-kd__region-table-wrap { overflow-x: auto; }
.spread-kd__region-table { min-width: 320px; }
.spread-kd__region-row {
  display: grid; grid-template-columns: 1fr 1fr 80px 80px;
  align-items: center; padding: 9px 12px; gap: 8px;
  font-size: 13px; border-bottom: 1px solid var(--spread-border);
}
.spread-kd__region-row--head {
  background: #fff; border-radius: var(--spread-radius-sm) var(--spread-radius-sm) 0 0;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--spread-mid-grey);
}
.spread-kd__region-name { font-weight: 600; color: var(--spread-dark-grey); }
.spread-kd__region-state { color: var(--spread-mid-grey); }

/* Spinner */
.spread-kd__spinner {
  display: inline-block; width: 20px; height: 20px;
  border: 2px solid var(--spread-border); border-top-color: var(--spread-accent);
  border-radius: 50%; animation: spread-kd-spin 0.6s linear infinite;
}
.spread-kd__spinner--sm { width: 14px; height: 14px; }
@keyframes spread-kd-spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 479px) {
  .spread-kd { padding: 1rem; }
  .spread-kd__kpi-grid { grid-template-columns: 1fr 1fr; }
}
</style>
