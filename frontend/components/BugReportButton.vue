<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

// ── Google Form config ──────────────────────────────────────────────────────
const FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSeZc2cVASxFwQeW7Oy8-oMNezSPWq0z5ZeXSUpPvL8qDX6Kdg/formResponse";

const ENTRY = {
  stage:       "entry.1371036053",
  description: "entry.1033400018",
  severity:    "entry.1451194169",
  device:      "entry.1858496027",
  extra:       "entry.1167692329",   // used for category tag
};

// ── Route → stage auto-detection ───────────────────────────────────────────
const route = useRoute();

const detectedStage = computed((): string => {
  const path = route.path;
  if (path === "/" || path === "/login")            return "Sign-in / account creation";
  if (path.startsWith("/auth"))                     return "Sign-in / account creation";
  if (path === "/home")                             return "Onboarding/tutorial";
  if (path.startsWith("/lobby"))                    return "Waiting for opponent";
  if (path.startsWith("/game") || path === "/demo") return "Active gameplay";
  return "Other";
});

// ── Category chips ──────────────────────────────────────────────────────────
const CHIPS = [
  { id: "bug",   label: "🐛 Bug"        },
  { id: "ai",    label: "🤖 AI issue"   },
  { id: "other", label: "💬 Other"      },
] as const;

type ChipId = typeof CHIPS[number]["id"];

// ── State ───────────────────────────────────────────────────────────────────
const open      = ref(false);
const submitted = ref(false);
const loading   = ref(false);

const category    = ref<ChipId | "">("");
const description = ref("");

function openModal() {
  category.value    = "";
  description.value = "";
  submitted.value   = false;
  open.value        = true;
}

function closeModal() {
  open.value = false;
}

function submit() {
  if (!description.value.trim()) return;
  loading.value = true;

  // Use a hidden <form> + <iframe> target — the only cross-origin technique
  // that sends proper browser cookies so Google Forms actually saves the row.
  // fetch() with no-cors omits cookies and Google silently drops the submission.
  const form = document.createElement("form");
  form.method  = "POST";
  form.action  = FORM_ACTION;
  form.target  = "bug-report-sink";   // targets the hidden iframe below
  form.style.display = "none";

  const fields: Record<string, string> = {
    [ENTRY.stage]:       detectedStage.value,
    [ENTRY.description]: description.value.trim(),
    [ENTRY.severity]:    "3",
    [ENTRY.device]:      navigator.userAgent,
    [ENTRY.extra]:       category.value,
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type  = "hidden";
    input.name  = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  submitted.value = true;
  loading.value   = false;
  setTimeout(closeModal, 1800);
}
</script>

<template>
  <!-- Hidden iframe absorbs the Google Form POST response (no-cors workaround) -->
  <iframe name="bug-report-sink" style="display:none" aria-hidden="true" />

  <!-- Floating trigger -->
  <button class="br-fab" aria-label="Share feedback" @click="openModal">
    💬
  </button>

  <Teleport to="body">
    <Transition name="br-pop">
      <div v-if="open" class="br-backdrop" @click.self="closeModal">
        <div class="br-modal" role="dialog" aria-modal="true">

          <!-- Success -->
          <div v-if="submitted" class="br-success">
            <span class="br-success-icon">✅</span>
            <p>Got it — thanks!</p>
          </div>

          <!-- Form -->
          <template v-else>
            <div class="br-header">
              <div>
                <span class="br-title">Share feedback</span>
                <p class="br-subtitle">Bugs, AI felt off, confusing UI — anything helps!</p>
              </div>
              <button class="br-close" aria-label="Close" @click="closeModal">✕</button>
            </div>

            <!-- Category chips -->
            <div class="br-chips">
              <button
                v-for="chip in CHIPS"
                :key="chip.id"
                type="button"
                class="br-chip"
                :class="{ active: category === chip.id }"
                @click="category = category === chip.id ? '' : chip.id"
              >{{ chip.label }}</button>
            </div>

            <!-- Text box -->
            <textarea
              v-model="description"
              class="br-textarea"
              rows="3"
              maxlength="500"
              placeholder="What's on your mind? Bugs, reactions, suggestions…"
              autofocus
            />

            <!-- Footer -->
            <div class="br-footer">
              <span class="br-stage-hint">📍 {{ detectedStage }}</span>
              <button
                class="br-send"
                :disabled="!description.trim() || loading"
                @click="submit"
              >{{ loading ? "Sending…" : "Send" }}</button>
            </div>

            <!-- Full form link -->
            <div class="br-form-link">
              Want to share more?
              <a href="https://forms.gle/KXAKu1x7FZaVemC46" target="_blank" rel="noopener">
                Open the full feedback form ↗
              </a>
            </div>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── FAB ── */
.br-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9000;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #1e1e2e;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: transform 0.15s, opacity 0.15s;
}
.br-fab:hover { transform: scale(1.1); opacity: 1; }

/* ── Backdrop ── */
.br-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9100;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 80px 24px 24px;
}

/* ── Modal ── */
.br-modal {
  background: #fff;
  border-radius: 14px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  overflow: hidden;
}

/* ── Header ── */
.br-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
}
.br-title {
  font-weight: 700;
  font-size: 15px;
  color: #1e1e2e;
}
.br-close {
  background: none;
  border: none;
  color: #aaa;
  font-size: 15px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.br-close:hover { color: #555; background: #f5f5f5; }
.br-subtitle {
  font-size: 11px;
  font-weight: 400;
  color: #999;
  margin: 2px 0 0;
}

/* ── Chips ── */
.br-chips {
  display: flex;
  gap: 6px;
  padding: 0 16px 10px;
}
.br-chip {
  border: 1.5px solid #e0e0e0;
  background: #fafafa;
  border-radius: 20px;
  padding: 4px 11px;
  font-size: 12px;
  cursor: pointer;
  color: #555;
  transition: all 0.12s;
  white-space: nowrap;
}
.br-chip:hover  { border-color: #7c6ef7; color: #7c6ef7; }
.br-chip.active { border-color: #7c6ef7; background: #7c6ef7; color: #fff; }

/* ── Textarea ── */
.br-textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 16px;
  font-size: 14px;
  font-family: inherit;
  color: #1e1e2e;
  resize: none;
  outline: none;
  background: #fff;
}
.br-textarea::placeholder { color: #bbb; }

/* ── Footer ── */
.br-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 14px;
}
.br-stage-hint {
  font-size: 11px;
  color: #bbb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 170px;
}
.br-send {
  background: #7c6ef7;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.br-send:hover:not(:disabled) { background: #6558e0; }
.br-send:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Full form link ── */
.br-form-link {
  text-align: center;
  font-size: 11px;
  color: #bbb;
  padding: 0 16px 14px;
  border-top: 1px solid #f5f5f5;
  padding-top: 10px;
}
.br-form-link a {
  color: #7c6ef7;
  text-decoration: none;
  font-weight: 500;
}
.br-form-link a:hover { text-decoration: underline; }

/* ── Success ── */
.br-success {
  padding: 28px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1e1e2e;
}
.br-success-icon { font-size: 24px; }

/* ── Transition ── */
.br-pop-enter-active { transition: opacity 0.15s, transform 0.15s; }
.br-pop-leave-active { transition: opacity 0.12s, transform 0.12s; }
.br-pop-enter-from   { opacity: 0; transform: translateY(12px) scale(0.97); }
.br-pop-leave-to     { opacity: 0; transform: translateY(8px)  scale(0.98); }
</style>
