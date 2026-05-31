import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

tests_short = ["TC14\nRegistro", "TC15\nLogin", "TC29\nPedidos\nPocos",
               "TC30\nPedidos\nMuchos", "TC45\nLoad", "TC59\nLoad-Me", "TC60\nStress"]

avg_ms     = [231.95, 103.48, 17.59, 10.94, 168.67, 125.53, 22.96]
p90_ms     = [229.09, 115.64, 75.55,  3.44, 340.72, 246.35, 49.68]
p95_ms     = [248.82, 119.11, 84.47, 50.69, 381.78, 303.90, 64.40]
throughput = [24.19, 27.05, 55.74, 88.60, 74.63, 79.20, 3784.68]
checks_total = [750, 840, 20, 20, 4496, 4836, 454525]

x = np.arange(len(tests_short))
w = 0.26
BASE = '/home/jony/springboot-react-jwt-token/charts/'

# ── 1. Response times → Horizontal grouped bar ───────────────────────────────
fig, ax = plt.subplots(figsize=(10, 6))
y = np.arange(len(tests_short))
ax.barh(y + w, avg_ms, w, label='Promedio',     color='#4C72B0', alpha=0.88)
ax.barh(y,     p90_ms, w, label='Percentil 90', color='#DD8452', alpha=0.88)
ax.barh(y - w, p95_ms, w, label='Percentil 95', color='#55A868', alpha=0.88)
ax.set_title("Tiempos de Respuesta por Caso de Prueba", fontsize=13, fontweight='bold')
ax.set_xlabel("Tiempo (ms)")
ax.set_yticks(y)
ax.set_yticklabels(tests_short, fontsize=8)
ax.set_xlim(0, max(p95_ms) * 1.15)
ax.legend(fontsize=9, loc='lower right')
ax.xaxis.grid(True, linestyle='--', alpha=0.5)
ax.set_axisbelow(True)
plt.tight_layout()
plt.savefig(BASE + 'chart_response_times.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved: chart_response_times.png")

# ── 2. Throughput → Line + area (log scale) ───────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 6))
xi = np.arange(len(tests_short))
ax.plot(xi, throughput, color='#C44E52', linewidth=2.5, marker='o',
        markersize=8, markerfacecolor='white', markeredgewidth=2, zorder=3)
ax.fill_between(xi, throughput, alpha=0.18, color='#C44E52')
ax.set_title("Throughput — Peticiones por Segundo", fontsize=13, fontweight='bold')
ax.set_ylabel("req/s (escala logarítmica)")
ax.set_xticks(xi)
ax.set_xticklabels(tests_short, fontsize=8)
ax.set_yscale('log')
ax.yaxis.grid(True, linestyle='--', alpha=0.5, which='both')
ax.set_axisbelow(True)
plt.tight_layout()
plt.savefig(BASE + 'chart_throughput.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved: chart_throughput.png")

# ── 3. Total checks → Lollipop chart ─────────────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 6))
colors = ['#8172B2'] * len(tests_short)
for i, (val, lbl) in enumerate(zip(checks_total, tests_short)):
    ax.plot([0, val], [i, i], color='#AAAAAA', linewidth=1.5, zorder=1)
    ax.scatter(val, i, color=colors[i], s=120, zorder=2)
ax.set_title("Total de Verificaciones Ejecutadas por Caso de Prueba", fontsize=13, fontweight='bold')
ax.set_xlabel("Cantidad de checks")
ax.set_yticks(range(len(tests_short)))
ax.set_yticklabels(tests_short, fontsize=8)
ax.set_xscale('log')
ax.xaxis.grid(True, linestyle='--', alpha=0.5, which='both')
ax.set_axisbelow(True)
plt.tight_layout()
plt.savefig(BASE + 'chart_checks.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved: chart_checks.png")
