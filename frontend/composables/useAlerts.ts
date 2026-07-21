// composables/useAlerts.ts
type AlertVariant = "success" | "error" | "info" | "warning";
type Alert = {
  id: number;
  message: string;
  variant: AlertVariant;
  timeout: number;
};

let inflightTimers = new Map<number, number>(); // id -> timeout handle

export function useAlerts() {
  const alerts = useState<Alert[]>("alerts:list", () => []);
  const counter = useState<number>("alerts:counter", () => 1);

  const remove = (id: number) => {
    const i = alerts.value.findIndex((a) => a.id === id);
    if (i !== -1) alerts.value.splice(i, 1);
    const h = inflightTimers.get(id);
    if (h) {
      clearTimeout(h);
      inflightTimers.delete(id);
    }
  };

  const push = (
    message: string,
    variant: AlertVariant = "info",
    timeout = 3000
  ) => {
    const id = counter.value++;
    alerts.value.push({ id, message, variant, timeout });
    if (timeout > 0) {
      const h = window.setTimeout(() => remove(id), timeout);
      inflightTimers.set(id, h);
    }
    return id;
  };

  return {
    alerts,
    push,
    remove,
      success: (msg: string, t = 4000) => {
          push(msg, "success", t)
        remove(t)
    },
      error: (msg: string, t = 4000) => {
          push(msg, "error", t)
        remove(t)
    },
    info: (msg: string, t = 4000) => {
        push(msg, "info", t)
      remove(t)
    },
    warning: (msg: string, t = 4000) => {
        push(msg, "warning", t)
      remove(t)
    },
  };
}
