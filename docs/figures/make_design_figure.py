#!/usr/bin/env python3
"""Experimental-design flowchart for the argument-coaching study (like Fig 1C
of arXiv:2603.15245). Renders a vector PDF + PNG for the Overleaf.

    python make_design_figure.py   # -> design_flow.pdf, design_flow.png
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

INK = "#2a2521"
CTRL = "#8d8379"      # control (grey)
TREAT = "#3b342f"     # treatment (dark)
SHARED = "#c9bfb5"    # shared steps
LIGHT = "#efe9e3"

fig, ax = plt.subplots(figsize=(8.2, 6.4))
ax.set_xlim(0, 10); ax.set_ylim(0, 12); ax.axis("off")


def box(x, y, w, h, text, face, fg="white", fs=9.5, ls="round,pad=0.02"):
    ax.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle=ls,
                                linewidth=1.1, edgecolor=INK, facecolor=face))
    ax.text(x, y, text, ha="center", va="center", color=fg, fontsize=fs, wrap=True)


def arrow(x1, y1, x2, y2, color=INK):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>",
                                 mutation_scale=13, linewidth=1.1, color=color))


# shared top funnel
box(5, 11.3, 5.4, 0.8, "Prolific recruitment  (target ~30 / condition)", SHARED, INK)
box(5, 10.1, 5.4, 0.8, "Consent + baseline survey\n(topic stances, disagreement-style items)", SHARED, INK)
box(5, 8.9, 5.4, 0.7, "Random assignment  (50 / 50)", LIGHT, INK)
arrow(5, 10.9, 5, 10.5); arrow(5, 9.7, 5, 9.25)

# split
arrow(5, 8.55, 3.0, 7.95); arrow(5, 8.55, 7.0, 7.95)

# two condition columns
box(3.0, 7.5, 3.6, 0.9, "CONTROL\nthree rounds, no coach", CTRL)
box(7.0, 7.5, 3.6, 0.9, "TREATMENT (AICoach)\nthree rounds + between-round coach", TREAT)

# the round loop (shared description under each)
for cx, face in [(3.0, CTRL), (7.0, TREAT)]:
    box(cx, 6.05, 3.6, 1.15,
        "Each round vs. good-faith\nLLM co-player:\nargue -> co-player replies ->\nrespond", face, "white", 8.6)
    arrow(cx, 7.05, cx, 6.65)

# coach annotation on treatment
box(7.0, 4.55, 3.6, 0.8, "Between rounds: coaching on\n3 shown dimensions + rewrite", TREAT, "white", 8.6)
arrow(7.0, 5.45, 7.0, 4.98)
# control has no coach — dashed spacer
ax.text(3.0, 4.55, "(no coaching\nbetween rounds)", ha="center", va="center",
        color=CTRL, fontsize=8.6, style="italic")
arrow(3.0, 5.45, 3.0, 4.98, color=CTRL)

# rejoin -> scoring
arrow(3.0, 4.15, 5, 3.55); arrow(7.0, 4.15, 5, 3.55)
box(5, 3.1, 6.2, 0.95,
    "LLM judge scores each round on 6 dimensions (1-5)\n"
    "helpful: reasoning, engagement, constructive stance  |  "
    "counterproductive: fallacies, evasion, hostility", LIGHT, INK, 8.4)
arrow(5, 2.62, 5, 2.25)
box(5, 1.8, 5.4, 0.7, "Exit survey", SHARED, INK)
arrow(5, 1.45, 5, 1.08)
box(5, 0.62, 6.6, 0.8,
    "Primary outcome: change in composite across rounds,\ntreatment vs. control (condition x round)", "#e7dfd7", INK, 8.8)

fig.tight_layout()
fig.savefig("design_flow.pdf", bbox_inches="tight")
fig.savefig("design_flow.png", dpi=170, bbox_inches="tight")
print("wrote design_flow.pdf and design_flow.png")
