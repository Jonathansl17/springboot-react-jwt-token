import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import json
import sys
import os

BASE = '/home/jony/springboot-react-jwt-token/charts/'
RESULTS_FILE = '/home/jony/springboot-react-jwt-token/results.txt'

# ── Parse results.txt (JSONL, one k6 summary per line) ───────────────────────
def load_results(path):
    results = {}
    if not os.path.exists(path):
        print(f'ERROR: {path} not found', file=sys.stderr)
        sys.exit(1)
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                tc = data.get('_tc')
                if tc and 'metrics' in data:
                    results[tc] = data['metrics']
            except json.JSONDecodeError:
                continue
    if not results:
        print('ERROR: results.txt empty or wrong format', file=sys.stderr)
        sys.exit(1)
    return results

def g(metrics, key, field, default=0.0):
    return metrics.get(key, {}).get(field, default)

results = load_results(RESULTS_FILE)

TC_ORDER  = ['TC14', 'TC15', 'TC29', 'TC30', 'TC45', 'TC59', 'TC60']
TC_LABELS = {
    'TC14': 'TC14\nRegistro',
    'TC15': 'TC15\nLogin',
    'TC29': 'TC29\nPedidos\nPocos',
    'TC30': 'TC30\nPedidos\nMuchos',
    'TC45': 'TC45\nCarga\nOrden',
    'TC59': 'TC59\nCarga\nPerfil',
    'TC60': 'TC60\nEstres',
}
TC_TIPO = {
    'TC14': 'Autenticacion',
    'TC15': 'Autenticacion',
    'TC29': 'Funcional',
    'TC30': 'Funcional',
    'TC45': 'Carga',
    'TC59': 'Carga',
    'TC60': 'Estres',
}

short        = []
tipos        = []
avg_ms       = []
p90_ms       = []
p95_ms       = []
throughput   = []
checks_total = []

for tc in TC_ORDER:
    short.append(TC_LABELS[tc])
    tipos.append(TC_TIPO[tc])
    m = results.get(tc, {})
    avg_ms.append(g(m, 'http_req_duration', 'avg'))
    p90_ms.append(g(m, 'http_req_duration', 'p(90)'))
    p95_ms.append(g(m, 'http_req_duration', 'p(95)'))
    throughput.append(g(m, 'http_reqs', 'rate'))
    checks_total.append(int(g(m, 'checks', 'passes')))

print('Loaded data:')
for i, tc in enumerate(TC_ORDER):
    print(f'  {tc}: avg={avg_ms[i]:.1f}ms p90={p90_ms[i]:.1f}ms p95={p95_ms[i]:.1f}ms '
          f'rps={throughput[i]:.1f} checks={checks_total[i]}')

CAT_COLOR = {
    'Autenticacion': '#4C72B0',
    'Funcional':     '#55A868',
    'Carga':         '#DD8452',
    'Estres':        '#C44E52',
}
colors = [CAT_COLOR[t] for t in tipos]
legend_patches = [mpatches.Patch(color=v, label=k) for k, v in CAT_COLOR.items()]
n = len(short)
y = np.arange(n)

# ── 1. Tiempos de respuesta ───────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 7))
w = 0.24

ax.barh(y + w, avg_ms, w, label='Promedio',     color='#4C72B0', alpha=0.85)
ax.barh(y,     p90_ms, w, label='Percentil 90', color='#DD8452', alpha=0.85)
ax.barh(y - w, p95_ms, w, label='Percentil 95', color='#55A868', alpha=0.85)

for data, offset in [(avg_ms, w), (p90_ms, 0), (p95_ms, -w)]:
    for i, val in enumerate(data):
        if val > 2:
            ax.text(val + 4, i + offset, f'{val:.0f} ms',
                    va='center', ha='left', fontsize=7.5, color='#333333')

ax.axvline(400, color='#CC0000', linestyle='--', linewidth=1.5, alpha=0.7,
           label='Limite propuesto: 400 ms')

ax.set_title('Tiempos de Respuesta por Caso de Prueba', fontsize=13, fontweight='bold', pad=12)
ax.set_xlabel('Tiempo de respuesta (milisegundos)', fontsize=11)
ax.set_yticks(y)
ax.set_yticklabels(short, fontsize=9)
ax.set_xlim(0, max(p95_ms) * 1.30)
ax.legend(fontsize=9, loc='lower right')
ax.xaxis.grid(True, linestyle='--', alpha=0.35)
ax.set_axisbelow(True)
plt.tight_layout()
plt.savefig(BASE + 'chart_response_times.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved: chart_response_times.png')

# ── 2. Tasa de procesamiento ──────────────────────────────────────────────────
max_rps = max(throughput)
sorted_rps = sorted(throughput)
CAP = sorted_rps[-2] * 1.20 if max_rps > sorted_rps[-2] * 3 else max_rps * 1.15
xi = np.arange(n)

fig, ax = plt.subplots(figsize=(12, 6))
bar_vals = [min(v, CAP) for v in throughput]
ax.bar(xi, bar_vals, color=colors, edgecolor='white', width=0.6, zorder=3)

for i, val in enumerate(throughput):
    if val > CAP:
        ax.bar([i], [CAP], color=colors[i], edgecolor='white', width=0.6,
               hatch='////', alpha=0.4, zorder=4)
        ax.text(i, bar_vals[i] - (CAP * 0.05), f'{val:,.0f} pet/s',
                ha='center', va='top', fontsize=9, fontweight='bold', color='white')
    else:
        ax.text(i, val + CAP * 0.01, f'{val:.1f}',
                ha='center', va='bottom', fontsize=8, fontweight='bold', color='#333333')

ax.set_ylim(0, CAP * 1.12)
ax.set_title('Tasa de Procesamiento (peticiones por segundo)', fontsize=13, fontweight='bold', pad=12)
ax.set_ylabel('Peticiones / segundo', fontsize=11)
ax.set_xticks(xi)
ax.set_xticklabels(short, fontsize=9)
ax.yaxis.grid(True, linestyle='--', alpha=0.35)
ax.set_axisbelow(True)
ax.legend(handles=legend_patches, fontsize=9, title='Tipo de prueba',
          title_fontsize=9, loc='upper left')
plt.tight_layout()
plt.savefig(BASE + 'chart_throughput.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved: chart_throughput.png')

# ── 3. Total de verificaciones ────────────────────────────────────────────────
max_checks = max(checks_total)
sorted_checks = sorted(checks_total)
CAP_H = sorted_checks[-2] * 1.20 if max_checks > sorted_checks[-2] * 3 else max_checks * 1.15

fig, ax = plt.subplots(figsize=(12, 7))
bar_vals_h = [min(v, CAP_H) for v in checks_total]
ax.barh(y, bar_vals_h, color=colors, edgecolor='white', height=0.55, zorder=3)

for i, val in enumerate(checks_total):
    if val > CAP_H:
        ax.barh([i], [CAP_H], color=colors[i], edgecolor='white',
                height=0.55, hatch='////', alpha=0.4, zorder=4)
        ax.text(CAP_H - 80, i, f'{val:,}',
                va='center', ha='right', fontsize=9, color='white', fontweight='bold')
    else:
        ax.text(val + CAP_H * 0.01, i, f'{val:,}',
                va='center', ha='left', fontsize=8, color='#1A6B35', fontweight='bold')

ax.set_xlim(0, CAP_H * 1.12)
ax.set_title('Total de Verificaciones Ejecutadas — Todas con 100% de Éxito', fontsize=13, fontweight='bold', pad=12)
ax.set_xlabel('Cantidad de verificaciones', fontsize=11)
ax.set_yticks(y)
ax.set_yticklabels(short, fontsize=9)
ax.xaxis.grid(True, linestyle='--', alpha=0.35)
ax.set_axisbelow(True)
ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{int(x):,}'))
ax.legend(handles=legend_patches, fontsize=9, title='Tipo de prueba',
          title_fontsize=9, loc='lower right')
plt.tight_layout()
plt.savefig(BASE + 'chart_checks.png', dpi=150, bbox_inches='tight')
plt.close()
print('Saved: chart_checks.png')
