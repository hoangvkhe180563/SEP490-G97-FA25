export type NotifyType = "success" | "error" | "info";

export type NotifyOptions = {
  duration?: number; // ms, default 2500
  type?: NotifyType;
  id?: string;
};

const containerId = "app-toast-container-v1";

function ensureContainer(): HTMLElement {
  let c = document.getElementById(containerId);
  if (c) return c;
  c = document.createElement("div");
  c.id = containerId;
  Object.assign(c.style, {
    position: "fixed",
    top: "16px",
    right: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    zIndex: "2147483647",
    pointerEvents: "none",
    maxWidth: "min(90vw,420px)",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(c);
  return c;
}

function createToastElement(message: string, type: NotifyType) {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  Object.assign(el.style, {
    pointerEvents: "auto",
    background: type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#0ea5e9",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
    fontSize: "14px",
    lineHeight: "1.3",
    whiteSpace: "pre-line",
    transform: "translateY(-6px)",
    opacity: "0",
    transition: "opacity 160ms ease, transform 160ms ease",
    maxWidth: "100%",
    wordBreak: "break-word",
  } as Partial<CSSStyleDeclaration>);

  el.innerText = message;
  return el;
}

export function showNotification(message: string, options?: NotifyOptions) {
  if (typeof document === "undefined") {
    // SSR fallback
    // eslint-disable-next-line no-console
    console.log("notify:", message, options);
    return { close: () => {} };
  }

  const { duration = 2500, type = "info", id } = options ?? {};
  const container = ensureContainer();
  const toast = createToastElement(message, type);
  if (id) toast.dataset.toastId = id;

  container.appendChild(toast);
  // force layout then animate in
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  toast.offsetHeight;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-6px)";
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
      const c = document.getElementById(containerId);
      if (c && c.childElementCount === 0) c.parentElement?.removeChild(c);
    }, 200);
  };

  const t = setTimeout(remove, duration);

  toast.addEventListener("click", () => {
    clearTimeout(t);
    remove();
  });

  return {
    close: () => {
      clearTimeout(t);
      remove();
    },
  };
}