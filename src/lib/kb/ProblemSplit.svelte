<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // One row per problem the ticket really holds. causes.ts tells `parser` from `hint`; the reports
  // the desk read as a one-day move (desk-notes.json) are a third problem, so they get their own row
  // instead of a footnote under `parser`.
  type Problem = { key: string; label: string; issue: string };
  let { ticket, problems }: { ticket: number; problems: Problem[] } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const shifted = $derived(merged.filter((r) => notes.oneDayMove.includes(r.id)));
  const rest = $derived(merged.filter((r) => !notes.oneDayMove.includes(r.id)));

  const rows = $derived.by(() => {
    const byKey = new Map<string, Report[]>(groupByCause(rest, tenantOf).map((g) => [g.cause, g.reports]));
    byKey.set('one-day', shifted);
    return problems.map((p) => {
      const rs = byKey.get(p.key) ?? [];
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      const count = (pick: (r: Report) => string) =>
        Object.entries(rs.reduce<Record<string, number>>((n, r) => ({ ...n, [pick(r)]: (n[pick(r)] ?? 0) + 1 }), {}))
          .sort((a, b) => b[1] - a[1])
          .map(([k, n]) => `${k} ×${n}`)
          .join(' · ');
      return { ...p, n: rs.length, tenants: new Set(rs.map((r) => r.tenant)).size, channels: count((r) => r.channel), tagged: count((r) => r.meta.intakeTag), seen: rs.length ? `${days[0]} → ${days[days.length - 1]}` : '—' };
    });
  });
  const placed = $derived(rows.reduce((n, r) => n + r.n, 0));
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} · <strong>{rows.length}</strong> problems ·
  {placed === merged.length ? 'every report placed' : `${merged.length - placed} not placed`}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows as r (r.key)}
      <tr>
        <td>{r.label}</td>
        <td><strong>{r.n}</strong></td>
        <td>{r.tenants}</td>
        <td class="small">{r.channels}</td>
        <td class="small">{r.tagged}</td>
        <td class="small">{r.seen}</td>
        <td><a href={r.issue}>#{r.issue.split('/').pop()}</a></td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
</style>
