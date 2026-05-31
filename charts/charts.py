import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

tests = [
    "tc14\nregistro",
    "tc15\nlogin",
    "tc29\npedidos-pocos",
    "tc30\npedidos-muchos",
    "tc45\nload",
    "tc59\nload-me",
    "tc60\nstress",
]

avg_ms     = [231.95, 103.48, 17.59, 10.94, 168.67, 125.53, 22.96]
p90_ms     = [229.09, 115.64, 75.55,  3.44, 340.72, 246.35, 49.68]
p95_ms     = [248.82, 119.11, 84.47, 50.69, 381.78, 303.90, 64.40]
throughput = [24.19, 27.05, 55.74, 88.60, 74.63, 79.20, 3784.68]
checks_pct = [100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0]

x = np.arange(len(tests))
w = 0.26

fig, axes = plt.subplots(1, 3, figsize=(18, 6))
fig.suptitle("Reporte de Pruebas de Rendimiento — k6", fontsize=15, fontweight='bold', y=1.02)

COLORS = {
    'avg': '#4C72B0',
    'p90': '#DD8452',
    'p95': '#55A868',
    'thr': '#C44E52',
    'chk': '#8172B2',
}

# ── 1. Response times ────────────────────────────────────────────────────────
ax1 = axes[0]
ax1.bar(x - w, avg_ms, w, label='avg', color=COLORS['avg'])
ax1.bar(x,     p90_ms, w, label='p90', color=COLORS['p90'])
ax1.bar(x + w, p95_ms, w, label='p95', color=COLORS['p95'])
ax1.set_title("Tiempos de Respuesta (ms)", fontsize=12, fontweight='bold')
ax1.set_ylabel("Tiempo (ms)")
ax1.set_xticks(x)
ax1.set_xticklabels(tests, fontsize=8)
ax1.legend(fontsize=9)
ax1.axhline(1000, color='red', linestyle='--', linewidth=1, alpha=0.7)
ax1.yaxis.grid(True, linestyle='--', alpha=0.5)
ax1.set_axisbelow(True)

# ── 2. Throughput ────────────────────────────────────────────────────────────
ax2 = axes[1]
ax2.bar(x, throughput, color=COLORS['thr'], edgecolor='white')
ax2.set_title("Throughput — Peticiones por Segundo", fontsize=12, fontweight='bold')
ax2.set_ylabel("req/s")
ax2.set_xticks(x)
ax2.set_xticklabels(tests, fontsize=8)
ax2.set_yscale('log')
ax2.yaxis.grid(True, linestyle='--', alpha=0.5, which='both')
ax2.set_axisbelow(True)

# ── 3. Checks passed % ───────────────────────────────────────────────────────
ax3 = axes[2]
ax3.bar(x, checks_pct, color=COLORS['chk'], edgecolor='white')
ax3.set_title("Checks Exitosos (%)", fontsize=12, fontweight='bold')
ax3.set_ylabel("%")
ax3.set_ylim(0, 115)
ax3.set_xticks(x)
ax3.set_xticklabels(tests, fontsize=8)
ax3.axhline(100, color='green', linestyle='--', linewidth=1.2, alpha=0.7)
ax3.yaxis.grid(True, linestyle='--', alpha=0.5)
ax3.set_axisbelow(True)

plt.tight_layout()
out = '/home/jony/springboot-react-jwt-token/charts/charts.png'
plt.savefig(out, dpi=150, bbox_inches='tight')
print(f"Saved: {out}")
