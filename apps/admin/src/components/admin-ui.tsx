import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  Ref,
} from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

export function Button({
  children,
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      className={`ui-button ui-button-${variant} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function SurfaceCard({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
}) {
  return (
    <section {...props} className={`ui-card ${className}`.trim()}>
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ui-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </header>
  );
}

export function Feedback({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'error';
}) {
  return (
    <div
      className={`admin-feedback is-${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="ui-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

export function DataTable({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      className="ui-table-wrap"
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export function Dialog({
  children,
  labelledBy,
  className = '',
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  labelledBy: string;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      {...props}
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      className={`admin-dialog ${className}`.trim()}
    >
      {children}
    </div>
  );
}
