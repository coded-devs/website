'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  retryAfterMinutes,
  toInquiryPayload,
  validateInquiry,
  validateInquiryField,
  type InquiryErrors,
  type InquiryField,
  type InquiryInput,
} from '../../lib/inquiry';
import { Band } from '../band';
import { Button } from '../button';
import styles from './inquiry-form.module.css';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'rateLimited'; minutes: number | null }
  | { kind: 'failed' };

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
  const sentRef = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSummary) summaryRef.current?.focus();
  }, [showSummary, errors]);
  useEffect(() => {
    if (status.kind === 'sent') sentRef.current?.focus();
    if (status.kind === 'rateLimited' || status.kind === 'failed') {
      alertRef.current?.focus();
    }
  }, [status]);

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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === 'sending') return;
    const found = validateInquiry(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setShowSummary(true);
      return;
    }
    setShowSummary(false);
    setStatus({ kind: 'sending' });
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toInquiryPayload(values)),
      });
      if (response.status === 201) {
        setStatus({ kind: 'sent' });
        setValues(EMPTY);
      } else if (response.status === 429) {
        setStatus({
          kind: 'rateLimited',
          minutes: retryAfterMinutes(response.headers.get('retry-after')),
        });
      } else if (response.status === 400) {
        // The API rejected something the client accepted; show field rules.
        setErrors(validateInquiry(values));
        setShowSummary(true);
        setStatus({ kind: 'idle' });
      } else {
        setStatus({ kind: 'failed' });
      }
    } catch {
      setStatus({ kind: 'failed' });
    }
  };

  if (status.kind === 'sent') {
    return (
      <div className={styles.sent}>
        <Band />
        <h3 ref={sentRef} tabIndex={-1} className={styles.sentTitle}>
          Message sent
        </h3>
        <p className={styles.muted}>
          Thanks for writing to CodedDevs. We have your message and will reply
          by email.
        </p>
        <Button variant="secondary" onClick={() => setStatus({ kind: 'idle' })}>
          Send another message
        </Button>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([, m]) => Boolean(m)) as [
    InquiryField,
    string,
  ][];

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

      {status.kind === 'rateLimited' || status.kind === 'failed' ? (
        <div ref={alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          <p className={styles.alertTitle}>
            {status.kind === 'rateLimited'
              ? 'Too many messages from this connection.'
              : 'Your message was not sent.'}
          </p>
          <p className={styles.alertText}>
            {status.kind === 'rateLimited'
              ? status.minutes
                ? `Wait ${status.minutes} ${status.minutes === 1 ? 'minute' : 'minutes'}, then send again. Your text is still here.`
                : 'Wait a few minutes, then send again. Your text is still here.'
              : `We could not reach our server. Send again, or email ${fallbackEmail}.`}
          </p>
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
        <Button
          type="submit"
          loading={status.kind === 'sending'}
          loadingLabel="Sending"
          fullWidthOnMobile
        >
          Send message
        </Button>
        <p className={styles.note}>We use your details only to reply to you.</p>
      </div>
    </form>
  );
}
