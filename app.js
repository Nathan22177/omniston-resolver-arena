const API_URL = "https://omni-history.ston.fi/json-rpc";
const API_METHOD = "stonfi.omni.history.v1.AggregatesRpc.FinalizedOrderAggregates";
const WINDOW_SECONDS = 31 * 24 * 60 * 60;
const FALLBACK_FROM = 1785056820;
const FALLBACK_TO = 1787735220;
const FALLBACK_RETRIEVED = "2026-08-26 09:07 UTC";
const YOU = "__you__";
const OTHER = "__other__";

const FALLBACK_ROWS = [
  ["ton","ton","EQC7ND-pWJBHwN76wGLCr1mQ6zJoqKDBe7GDOoplIIND9S7V",3898729.6143920855,1776],
  ["bnb","ton","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",405182.0734303641,473],
  ["ton","ton","EQCsFsKGW4dooGkPyYl1PMpaWdXNw7ucOI-Yrf6Lgkdn46sI",143291.3892303921,2168],
  ["ton","ton","EQBUwtK6XryBBh4HbAEobisw8oQgJAlIyD0u_etpsVSIlMn-",118898.2972926624,87],
  ["ton","polygon","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",98509.7787935323,1783],
  ["ethereum","ton","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",97143.6218047372,152],
  ["polygon","ton","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",51422.5260061093,705],
  ["ton","bnb","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",36416.0594521368,228],
  ["bnb","tron","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",29990.9,39],
  ["arbitrum","ton","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",25368.4276146715,100],
  ["base","polygon","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",25017.2118166211,33],
  ["ton","base","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",16487.0729444991,96],
  ["base","arbitrum","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",15453.2067955928,16],
  ["base","avalanche","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",14802.178616,16],
  ["robinhood","bnb","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",12736.882824,18],
  ["ton","robinhood","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",12729.5493324306,45],
  ["ton","arbitrum","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",12547.6919835696,115],
  ["bnb","robinhood","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",10991.2630522805,22],
  ["ton","tron","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",9873.2533835691,21],
  ["ton","ethereum","EQDE_TwSRO95P4fWSeCaIqIBgVubITNHQIOicLkiYJb4mQ-r",9121.8206714143,39]
].map(([src, dst, resolver, volume, orders]) => ({ src, dst, resolver, volume, orders }));

const state = {
  rows: [],
  from: 0,
  to: 0,
  sources: new Set(),
  destinations: new Set(),
  capture: 10,
  margin: 25,
  give: 5
};

const $ = id => document.getElementById(id);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const titleCase = value => value === OTHER ? "Other" : value.charAt(0).toUpperCase() + value.slice(1);
const formatUtc = seconds => `${new Date(seconds * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC`;
const shortResolver = id => id === OTHER ? "Other resolvers" : id.length > 14 ? `${id.slice(0, 5)}…${id.slice(-4)}` : id;

function setSnapshot(mode, message, retrieved) {
  const status = $("data-status");
  status.textContent = message;
  status.className = `status-pill ${mode}`;
  $("window-label").textContent = `Historical window: ${formatUtc(state.from)} → ${formatUtc(state.to)}`;
  $("retrieved-label").textContent = `Retrieved: ${retrieved}`;
}

function buildRequest(from, to) {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: API_METHOD,
    params: {
      filters: [{ time_range: { from_timestamp: String(from), to_timestamp: String(to) } }],
      dimensions: { values: ["src_chain_id", "dst_chain_id", "resolver_id"] },
      aggregates_list: { values: ["filled_orders_volume_usd", "finalized_orders_count"] }
    }
  };
}

async function fetchHistory() {
  const to = Math.floor(Date.now() / 1000);
  const from = to - WINDOW_SECONDS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildRequest(from, to)),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`History API returned ${response.status}`);
    const body = await response.json();
    if (body.error) throw new Error(body.error.message || "History API error");
    const rows = (body.result?.rows || []).map(row => ({
      src: row.src_chain_id,
      dst: row.dst_chain_id,
      resolver: row.resolver_id,
      volume: Number(row.filled_orders_volume_usd),
      orders: Number(row.finalized_orders_count)
    })).filter(row => row.src && row.dst && row.resolver && Number.isFinite(row.volume) && row.volume > 0);
    if (!rows.length) throw new Error("History API returned no finalized flows");
    state.rows = rows;
    state.from = from;
    state.to = to;
    setSnapshot("live", "Live production snapshot", formatUtc(Math.floor(Date.now() / 1000)));
  } finally {
    clearTimeout(timeout);
  }
}

function useFallback() {
  state.rows = FALLBACK_ROWS;
  state.from = FALLBACK_FROM;
  state.to = FALLBACK_TO;
  setSnapshot("fallback", "Live refresh failed · fallback snapshot", FALLBACK_RETRIEVED);
}

function buildChips(containerId, values, selected) {
  const container = $(containerId);
  container.replaceChildren(...values.map(value => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chain-chip";
    button.textContent = titleCase(value);
    button.setAttribute("aria-pressed", "true");
    button.addEventListener("click", () => {
      selected.has(value) ? selected.delete(value) : selected.add(value);
      button.setAttribute("aria-pressed", String(selected.has(value)));
      render();
    });
    return button;
  }));
}

function initializeSelections() {
  const sources = [...new Set(state.rows.map(row => row.src))].sort();
  const destinations = [...new Set(state.rows.map(row => row.dst))].sort();
  state.sources = new Set(sources);
  state.destinations = new Set(destinations);
  buildChips("source-chains", sources, state.sources);
  buildChips("destination-chains", destinations, state.destinations);
  $("resolver-count").textContent = `${new Set(state.rows.map(row => row.resolver)).size} active resolver IDs in this window`;
}

function selectedRows() {
  return state.rows.filter(row => state.sources.has(row.src) && state.destinations.has(row.dst));
}

function rankKeys(rows, key, limit) {
  const totals = new Map();
  rows.forEach(row => totals.set(row[key], (totals.get(row[key]) || 0) + row.volume));
  return new Set([...totals].sort((a, b) => b[1] - a[1]).slice(0, limit).map(entry => entry[0]));
}

function compactRows(rows, mobile) {
  const sourceKeep = rankKeys(rows, "src", mobile ? 4 : 7);
  const destinationKeep = rankKeys(rows, "dst", mobile ? 4 : 7);
  const resolverKeep = rankKeys(rows, "resolver", mobile ? 3 : 5);
  const grouped = new Map();
  rows.forEach(row => {
    const src = sourceKeep.has(row.src) ? row.src : OTHER;
    const dst = destinationKeep.has(row.dst) ? row.dst : OTHER;
    const resolver = resolverKeep.has(row.resolver) ? row.resolver : OTHER;
    const key = `${src}|${resolver}|${dst}`;
    const item = grouped.get(key) || { src, resolver, dst, volume: 0, orders: 0 };
    item.volume += row.volume;
    item.orders += row.orders;
    grouped.set(key, item);
  });
  return [...grouped.values()];
}

function buildGraph(rows, capture, mobile) {
  const compact = compactRows(rows, mobile);
  const nodes = new Map();
  const links = new Map();
  const addNode = (id, kind, raw) => nodes.set(id, { id, kind, raw, label: kind === "resolver" ? (raw === YOU ? "You" : shortResolver(raw)) : titleCase(raw) });
  const addLink = (source, target, volume, orders, resolver) => {
    if (volume <= 0) return;
    const key = `${source}>${target}`;
    const link = links.get(key) || { source, target, value: 0, orders: 0, resolver };
    link.value += volume;
    link.orders += orders;
    links.set(key, link);
  };

  compact.forEach(row => {
    const sourceId = `src:${row.src}`;
    const destinationId = `dst:${row.dst}`;
    const resolverId = `resolver:${row.resolver}`;
    const youId = `resolver:${YOU}`;
    addNode(sourceId, "source", row.src);
    addNode(destinationId, "destination", row.dst);
    if (capture < 1) addNode(resolverId, "resolver", row.resolver);
    if (capture > 0) addNode(youId, "resolver", YOU);
    const capturedVolume = row.volume * capture;
    const capturedOrders = row.orders * capture;
    const incumbentVolume = row.volume - capturedVolume;
    const incumbentOrders = row.orders - capturedOrders;
    addLink(sourceId, resolverId, incumbentVolume, incumbentOrders, row.resolver);
    addLink(resolverId, destinationId, incumbentVolume, incumbentOrders, row.resolver);
    addLink(sourceId, youId, capturedVolume, capturedOrders, YOU);
    addLink(youId, destinationId, capturedVolume, capturedOrders, YOU);
  });
  return { nodes: [...nodes.values()], links: [...links.values()] };
}

function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function renderChart(rows) {
  const svg = d3.select("#sankey");
  svg.selectAll("*").remove();
  const empty = $("chart-empty");
  if (!rows.length || typeof d3.sankey !== "function") {
    svg.attr("hidden", true);
    empty.hidden = false;
    empty.textContent = rows.length ? "The chart library could not be loaded." : "Select at least one matching route to draw the flow.";
    return;
  }
  svg.attr("hidden", null);
  empty.hidden = true;
  const width = Math.max(292, Math.floor($("sankey").getBoundingClientRect().width));
  const mobile = width < 620;
  const height = mobile ? 470 : 480;
  const sideMargin = mobile ? Math.min(76, width * .2) : 92;
  const graph = buildGraph(rows, state.capture / 100, mobile);
  const sankey = d3.sankey().nodeId(d => d.id).nodeWidth(mobile ? 12 : 14).nodePadding(mobile ? 12 : 14).nodeSort(null).extent([[sideMargin, 12], [width - sideMargin, height - 12]]);
  const laidOut = sankey({ nodes: graph.nodes.map(d => ({ ...d })), links: graph.links.map(d => ({ ...d })) });
  svg.attr("viewBox", `0 0 ${width} ${height}`).attr("height", height);

  const resolverOrder = [...new Set(laidOut.nodes.filter(node => node.kind === "resolver" && node.raw !== YOU && node.raw !== OTHER).map(node => node.raw))];
  const palette = [css("--series-1"), css("--series-2"), css("--series-3"), css("--series-4"), css("--series-5")];
  const resolverColor = resolver => resolver === YOU ? css("--accent") : resolver === OTHER ? css("--series-other") : palette[Math.max(0, resolverOrder.indexOf(resolver)) % palette.length];

  svg.append("g").attr("fill", "none").selectAll("path").data(laidOut.links).join("path")
    .attr("d", d3.sankeyLinkHorizontal()).attr("stroke", d => resolverColor(d.resolver)).attr("stroke-opacity", .42).attr("stroke-width", d => Math.max(1, d.width))
    .on("pointermove", (event, d) => showTooltip(event, `${d.source.label} → ${d.target.label}<br>${money.format(d.value)} · ≈ ${integer.format(d.orders)} orders`))
    .on("pointerleave", hideTooltip);

  const node = svg.append("g").selectAll("g").data(laidOut.nodes).join("g")
    .on("pointermove", (event, d) => showTooltip(event, `${d.label}<br>${money.format(d.value)}`)).on("pointerleave", hideTooltip);
  node.append("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(1, d.y1 - d.y0)).attr("rx", 2)
    .attr("fill", d => d.kind === "resolver" ? resolverColor(d.raw) : css("--side-node"));
  node.filter(d => d.y1 - d.y0 >= 9).append("text")
    .attr("x", d => d.kind === "destination" ? d.x0 - 7 : d.x1 + 7)
    .attr("y", d => (d.y0 + d.y1) / 2).attr("dy", ".35em")
    .attr("text-anchor", d => d.kind === "destination" ? "end" : "start")
    .attr("fill", css("--text")).attr("font-size", mobile ? 10 : 11).attr("font-weight", d => d.raw === YOU ? 800 : 650)
    .text(d => d.label);
}

function showTooltip(event, html) {
  const tooltip = $("tooltip");
  tooltip.innerHTML = html;
  tooltip.hidden = false;
  const left = Math.min(window.innerWidth - 265, event.clientX + 12);
  const top = Math.min(window.innerHeight - 80, event.clientY + 12);
  tooltip.style.left = `${Math.max(8, left)}px`;
  tooltip.style.top = `${Math.max(8, top)}px`;
}
function hideTooltip() { $("tooltip").hidden = true; }

function render() {
  const rows = selectedRows();
  const volume = d3.sum(rows, row => row.volume);
  const orders = d3.sum(rows, row => row.orders);
  const scenarioVolume = volume * state.capture / 100;
  const scenarioOrders = orders * state.capture / 100;
  const retainedBp = Math.max(0, state.margin - state.give);
  $("capture-output").textContent = `${state.capture}%`;
  $("margin-output").textContent = `${state.margin} bp`;
  $("give-output").textContent = `${state.give} bp`;
  $("addressable-volume").textContent = money.format(volume);
  $("addressable-orders").textContent = `${integer.format(orders)} finalized orders`;
  $("scenario-volume").textContent = money.format(scenarioVolume);
  $("scenario-orders").textContent = `≈ ${integer.format(scenarioOrders)} orders at ${state.capture}% capture`;
  $("gross-spread").textContent = money.format(scenarioVolume * retainedBp / 10000);
  $("spread-detail").textContent = `${retainedBp} bp remaining after giving ${state.give} bp to the trader`;
  renderChart(rows);
}

function bindControls() {
  [["capture", "capture"], ["margin", "margin"], ["give", "give"]].forEach(([id, key]) => {
    $(id).addEventListener("input", event => {
      state[key] = Number(event.target.value);
      if (key === "margin" && state.give > state.margin) { state.give = state.margin; $("give").value = state.give; }
      if (key === "give" && state.give > state.margin) { state.margin = state.give; $("margin").value = state.margin; }
      render();
    });
  });
}

async function init() {
  bindControls();
  try { await fetchHistory(); } catch (error) { console.warn(error); useFallback(); }
  initializeSelections();
  render();
  let resizeTimer;
  new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 80); }).observe($("sankey"));
}

init();
