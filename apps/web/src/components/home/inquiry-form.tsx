'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  validateInquiry,
  validateInquiryField,
  type InquiryErrors,
  type InquiryField,
  type InquiryInput,
} from '../../lib/inquiry';
import { Band } from '../band';
import { Button } from '../button';
import styles from './inquiry-form.module.css';

type Status = { kind: 'idle' } | { kind: 'emailReady' };

const EMPTY: InquiryInput = { name: '', email: '', company: '', message: '' };

const FIELDS: {
  name: InquiryField;
  label: string;
  type?: string;
  autoComplete?: string;
  optional?: boolean;
  hint?: string;
  multiline?: boolean;
}[] = [
  { name: 'name', label: 'Name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    name: 'company',
    label: 'Company',
    autoComplete: 'organization',
    optional: true,
  },
  {
    name: 'message',
    label: 'Message',
    hint: 'What are you building, and how can we help? 20 to 5,000 characters.',
    multiline: true,
  },
];

export function InquiryForm({ fallbackEmail }: { fallbackEmail: string }) {
  const id = useId();
  const [values, setValues] = useState<InquiryInput>(EMPTY);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSummary) summaryRef.current?.focus();
  }, [showSummary, errors]);

  const fieldId = (name: InquiryField) => `${id}-${name}`;

  const onChange = (name: InquiryField, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    // Recheck a field once it has been marked invalid.
    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: validateInquiryField(name, value),
      }));
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateInquiry(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setShowSummary(true);
      return;
    }
    setShowSummary(false);
    setStatus({ kind: 'emailReady' });
  };

  const errorList = Object.entries(errors).filter(([, m]) => Boolean(m)) as [
    InquiryField,
    string,
  ][];
  const emailBody = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    ...(values.company ? [`Company: ${values.company}`] : []),
    '',
    values.message,
  ].join('\n');
  const emailHref = `mailto:${fallbackEmail}?subject=${encodeURIComponent(`Website enquiry from ${values.name}`)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={onSubmit}
      aria-label="Contact form"
    >
      {showSummary && errorList.length > 0 ? (
        <div
          ref={summaryRef}
          className={styles.alert}
          role="alert"
          tabIndex={-1}
        >
          <p className={styles.alertTitle}>
            {errorList.length === 1
              ? 'Check 1 field and send again.'
              : `Check ${errorList.length} fields and send again.`}
          </p>
          <ul className={styles.alertList}>
            {errorList.map(([name, message]) => (
              <li key={name}>
                <a
                  href={`#${fieldId(name)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(fieldId(name))?.focus();
                  }}
                >
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {status.kind === 'emailReady' ? (
        <div className={styles.emailNotice} role="status">
          <p>
            This website does not send or store your submission. Continue in
            your email app to send it directly to CodedDevs.
          </p>
          <a href={emailHref}>Open your email app</a>
        </div>
      ) : null}

      <div className={styles.fields}>
        {FIELDS.map((field) => {
          const error = errors[field.name];
          const hintId = field.hint ? `${fieldId(field.name)}-hint` : undefined;
          const errorId = `${fieldId(field.name)}-error`;
          const describedBy = [hintId, error ? errorId : undefined]
            .filter(Boolean)
            .join(' ');
          const common = {
            id: fieldId(field.name),
            name: field.name,
            value: values[field.name],
            autoComplete: field.autoComplete,
            required: !field.optional,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy || undefined,
            className: styles.input,
          };
          return (
            <div
              key={field.name}
              className={`${styles.field} ${field.multiline ? styles.full : ''}`}
            >
              <label className={styles.label} htmlFor={fieldId(field.name)}>
                {field.label}
                {field.optional ? (
                  <span className={styles.optional}> (optional)</span>
                ) : null}
              </label>
              {field.hint ? (
                <p id={hintId} className={styles.hint}>
                  {field.hint}
                </p>
              ) : null}
              {field.multiline ? (
                <textarea
                  {...common}
                  rows={6}
                  onChange={(event) => onChange(field.name, event.target.value)}
                />
              ) : (
                <input
                  {...common}
                  type={field.type ?? 'text'}
                  onChange={(event) => onChange(field.name, event.target.value)}
                />
              )}
              {error ? (
                <p id={errorId} className={styles.error}>
                  <Band size="small" tone="danger" />
                  <span className="visually-hidden">Error: </span>
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <Button type="submit" fullWidthOnMobile>
          Prepare email message
        </Button>
        <p className={styles.note}>
          Your message is not sent or stored until you send it from your email
          app.
        </p>
      </div>
    </form>
  );
}
