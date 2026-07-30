import type { Child, FC } from "hono/jsx";
import type { OrderStatus } from "../lib/orders";
import { CSRF_FIELD } from "../lib/auth/csrf";

export const CsrfField: FC<{ token: string }> = ({ token }) => (
  <input type="hidden" name={CSRF_FIELD} value={token} />
);

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const PageHeader: FC<{
  title: string;
  description?: string;
  actions?: Child;
  breadcrumb?: { label: string; href?: string }[];
}> = ({ title, description, actions, breadcrumb }) => (
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav class="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          {breadcrumb.map((b, i) => (
            <>
              {i > 0 ? <span class="text-faint">/</span> : null}
              {b.href ? (
                <a href={b.href} class="hover:text-foreground transition-colors">
                  {b.label}
                </a>
              ) : (
                <span class="text-foreground/80">{b.label}</span>
              )}
            </>
          ))}
        </nav>
      ) : null}
      <h1 class="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? <p class="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
    </div>
    {actions ? <div class="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export const Alert: FC<{ tone: "success" | "error" | "info"; children: Child }> = ({
  tone,
  children,
}) => {
  const styles =
    tone === "success"
      ? "border-brand/25 bg-brand/10 text-brand"
      : tone === "error"
        ? "border-red-500/25 bg-red-500/10 text-red-200"
        : "border-border bg-elevated text-muted";
  return (
    <div class={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <span class="mt-0.5 font-mono text-xs opacity-70">
        {tone === "success" ? "OK" : tone === "error" ? "!" : "i"}
      </span>
      <div class="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export const StatusBadge: FC<{ status: OrderStatus }> = ({ status }) => {
  const map: Record<OrderStatus, string> = {
    pending: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
    paid: "bg-brand/15 text-brand ring-1 ring-inset ring-brand/30",
    expired: "bg-elevated text-muted ring-1 ring-inset ring-border",
  };
  const label: Record<OrderStatus, string> = {
    pending: "Pending",
    paid: "Paid",
    expired: "Expired",
  };
  return (
    <span
      class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {label[status]}
    </span>
  );
};

export const Pill: FC<{
  tone?: "neutral" | "success" | "warning" | "danger";
  children: Child;
}> = ({ tone = "neutral", children }) => {
  const map = {
    neutral: "bg-elevated text-muted ring-border",
    success: "bg-brand/15 text-brand ring-brand/25",
    warning: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
    danger: "bg-red-500/15 text-red-300 ring-red-500/25",
  };
  return (
    <span
      class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${map[tone]}`}
    >
      {children}
    </span>
  );
};

export const Card: FC<{
  children: Child;
  class?: string;
  padding?: boolean;
}> = ({ children, class: className = "", padding = true }) => (
  <div
    class={`rounded-xl border border-border bg-panel shadow-sm shadow-black/20 ${padding ? "p-5" : ""} ${className}`}
  >
    {children}
  </div>
);

export const CardHeader: FC<{ title: string; description?: string; action?: Child }> = ({
  title,
  description,
  action,
}) => (
  <div class="mb-4 flex items-start justify-between gap-3 border-b border-border pb-4">
    <div>
      <h2 class="text-sm font-semibold text-foreground">{title}</h2>
      {description ? <p class="mt-0.5 text-xs text-muted">{description}</p> : null}
    </div>
    {action}
  </div>
);

export const Btn: FC<{
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: Child;
  class?: string;
}> = ({ href, type = "submit", variant = "secondary", size = "md", children, class: extra = "" }) => {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50";
  const sizes = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm";
  const variants = {
    primary: "bg-brand text-background hover:bg-brand-strong",
    secondary: "border border-border bg-elevated text-foreground hover:bg-border/40 hover:border-border-strong",
    ghost: "text-muted hover:bg-elevated hover:text-foreground",
    danger: "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
  };
  const cls = `${base} ${sizes} ${variants[variant]} ${extra}`;
  if (href) {
    return (
      <a href={href} class={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} class={cls}>
      {children}
    </button>
  );
};

export const Field: FC<{
  label: string;
  name?: string;
  hint?: string;
  children: Child;
}> = ({ label, name, hint, children }) => (
  <div class="space-y-1.5">
    <label class="block text-xs font-medium text-muted" for={name}>
      {label}
    </label>
    {children}
    {hint ? <p class="text-xs text-faint">{hint}</p> : null}
  </div>
);

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-faint transition-colors hover:border-border-strong focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";

export const selectClass = inputClass;

export const EmptyState: FC<{ title: string; description?: string; action?: Child }> = ({
  title,
  description,
  action,
}) => (
  <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-elevated text-muted">
      <span class="font-mono text-xs">—</span>
    </div>
    <p class="text-sm font-medium text-foreground">{title}</p>
    {description ? <p class="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
    {action ? <div class="mt-4">{action}</div> : null}
  </div>
);
