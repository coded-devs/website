'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { Button, Feedback, PageHeader } from '../../src/components/admin-ui';
import { useAuth } from '../../src/context/auth-context';
import { uploadMediaAsset } from '../../src/lib/media-client';
import {
  fetchAdminSettingsRecord,
  publishAdminSettingsContact,
  SettingsApiError,
  updateAdminSettings,
} from '../../src/lib/settings-client';
import type { SiteSettings } from '../../src/types/settings';

const inputClass =
  'w-full border-0 border-b border-[color:var(--cms-border-strong)] bg-transparent px-0 py-2 outline-none focus:border-[color:var(--cms-accent)]';
const blank: SiteSettings = {
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  twitterUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  facebookUrl: '',
  instagramUrl: '',
};

function cropImage(source: string, area: Area): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context)
        return reject(new Error('Could not crop the selected photo.'));
      context.drawImage(
        image,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        512,
        512,
      );
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(
                new File([blob], 'admin-profile.jpg', { type: 'image/jpeg' }),
              )
            : reject(new Error('Could not crop the selected photo.')),
        'image/jpeg',
        0.9,
      );
    };
    image.onerror = () =>
      reject(new Error('Could not read the selected photo.'));
    image.src = source;
  });
}

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSource, setPhotoSource] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [contact, setContact] = useState<SiteSettings>(blank);
  const [contactLoaded, setContactLoaded] = useState(false);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactLoadError, setContactLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
  const [contactFeedback, setContactFeedback] = useState<{
    error: boolean;
    text: string;
  } | null>(null);

  const loadContactSettings = useCallback(async () => {
    setContactLoading(true);
    setContactLoadError(null);
    try {
      const record = await fetchAdminSettingsRecord();
      setContact(record.draftPayload);
      setContactLoaded(true);
    } catch (error) {
      if (error instanceof SettingsApiError && error.statusCode === 404) {
        setContact({ ...blank });
        setContactLoaded(true);
      } else {
        setContactLoadError(
          error instanceof Error
            ? error.message
            : 'Could not load contact settings.',
        );
      }
    } finally {
      setContactLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContactSettings();
  }, [loadContactSettings]);

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/v1/admin/auth/me', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
        },
        body: JSON.stringify({ firstName, lastName, avatarUrl }),
      });
      if (!response.ok) throw new Error('Could not save your account details.');
      await refresh();
      setFeedback({ error: false, text: 'Account details saved.' });
    } catch (error) {
      setFeedback({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : 'Could not save your account details.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file?: File): Promise<boolean> {
    if (!file) return false;
    setUploadingPhoto(true);
    setFeedback(null);
    try {
      const asset = await uploadMediaAsset(file, 'Admin profile photo');
      setAvatarUrl(asset.url);
      setFeedback({
        error: false,
        text: 'Photo uploaded. Save your account to show it in the sidebar.',
      });
      return true;
    } catch (error) {
      setFeedback({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : 'Could not upload your photo.',
      });
      return false;
    } finally {
      setUploadingPhoto(false);
    }
  }

  const onCropComplete = useCallback(
    (_area: Area, pixels: Area) => setCropArea(pixels),
    [],
  );
  async function confirmPhotoCrop() {
    if (!photoSource || !cropArea) return;
    try {
      const file = await cropImage(photoSource, cropArea);
      if (!(await uploadPhoto(file))) return;
      URL.revokeObjectURL(photoSource);
      setPhotoSource(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (error) {
      setFeedback({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : 'Could not crop the selected photo.',
      });
    }
  }

  async function saveContactDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contactLoaded) return;
    setContactBusy(true);
    setContactFeedback(null);
    try {
      const draft = await updateAdminSettings({
        contactEmail: contact.contactEmail,
        contactPhone: contact.contactPhone,
        address: contact.address,
        twitterUrl: contact.twitterUrl,
        linkedinUrl: contact.linkedinUrl,
        githubUrl: contact.githubUrl,
        facebookUrl: contact.facebookUrl,
        instagramUrl: contact.instagramUrl,
      });
      setContact(draft);
      setContactFeedback({
        error: false,
        text: 'Contact details and social links saved as a draft.',
      });
    } catch (error) {
      setContactFeedback({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : 'Could not save contact settings.',
      });
    } finally {
      setContactBusy(false);
    }
  }

  async function publishContact() {
    if (!contactLoaded || contactBusy) return;
    if (
      !window.confirm(
        'Publish these contact and social link values to the website footer now?',
      )
    )
      return;
    setContactBusy(true);
    setContactFeedback(null);
    try {
      const draft = await updateAdminSettings({
        contactEmail: contact.contactEmail,
        contactPhone: contact.contactPhone,
        address: contact.address,
        twitterUrl: contact.twitterUrl,
        linkedinUrl: contact.linkedinUrl,
        githubUrl: contact.githubUrl,
        facebookUrl: contact.facebookUrl,
        instagramUrl: contact.instagramUrl,
      });
      setContact(draft);
      await publishAdminSettingsContact();
      setContactFeedback({
        error: false,
        text: 'Contact details and social links published to the website footer.',
      });
    } catch (error) {
      setContactFeedback({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : 'Could not publish contact settings.',
      });
    } finally {
      setContactBusy(false);
    }
  }

  function setField(key: keyof SiteSettings, value: string) {
    setContact((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="max-w-[720px]">
      <PageHeader
        title="Settings"
        description="Manage your Admin account and contact details."
      />
      <div className="grid gap-8">
        <form
          className="grid gap-5 border-t border-[color:var(--cms-border-strong)] pt-5"
          onSubmit={saveAccount}
        >
          <h2 className="m-0 text-base font-semibold">Admin account</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-center gap-4 sm:col-span-2">
              {avatarUrl ? (
                <img
                  className="admin-user-avatar"
                  src={avatarUrl}
                  alt="Admin profile"
                />
              ) : (
                <span className="admin-user-avatar" aria-hidden="true">
                  {(firstName.trim().charAt(0) || 'A').toUpperCase()}
                </span>
              )}
              <label className="grid gap-1 text-sm font-medium">
                Profile photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingPhoto}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setPhotoSource(URL.createObjectURL(file));
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }
                    event.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              First name
              <input
                className={inputClass}
                autoComplete="given-name"
                maxLength={100}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Last name
              <input
                className={inputClass}
                autoComplete="family-name"
                maxLength={100}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>
            <div>
              <span className="text-sm font-medium">Email</span>
              <p className="m-0 mt-2 text-[color:var(--cms-text-secondary)]">
                {user?.email ?? '—'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Role</span>
              <p className="m-0 mt-2 text-[color:var(--cms-text-secondary)]">
                Super Admin
              </p>
            </div>
          </div>
          {feedback && (
            <Feedback tone={feedback.error ? 'error' : 'success'}>
              {feedback.text}
            </Feedback>
          )}
          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={busy || uploadingPhoto}
            >
              {busy ? 'Saving…' : 'Save account'}
            </Button>
          </div>
        </form>
        <form
          className="grid gap-5 border-t border-[color:var(--cms-border-strong)] pt-5"
          onSubmit={saveContactDraft}
        >
          {contactLoadError ? (
            <Feedback tone="error">
              <span className="flex flex-wrap items-center gap-3">
                <span>{contactLoadError}</span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={contactLoading}
                  onClick={() => void loadContactSettings()}
                >
                  {contactLoading ? 'Loading…' : 'Retry'}
                </Button>
              </span>
            </Feedback>
          ) : null}
          <fieldset
            className="grid gap-5 border-0 p-0"
            disabled={!contactLoaded || contactBusy}
            aria-busy={contactLoading}
          >
            <h2 className="m-0 text-base font-semibold">Contact details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                Contact email
                <input
                  className={inputClass}
                  type="email"
                  maxLength={320}
                  value={contact.contactEmail}
                  onChange={(event) =>
                    setField('contactEmail', event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Contact phone
                <input
                  className={inputClass}
                  maxLength={50}
                  value={contact.contactPhone ?? ''}
                  onChange={(event) =>
                    setField('contactPhone', event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Address
                <input
                  className={inputClass}
                  maxLength={500}
                  value={contact.address ?? ''}
                  onChange={(event) => setField('address', event.target.value)}
                />
              </label>
            </div>
            <h2 className="m-0 border-t border-[color:var(--cms-border-strong)] pt-5 text-base font-semibold">
              Social links
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                X (Twitter) URL
                <input
                  className={inputClass}
                  type="url"
                  placeholder="https://"
                  value={contact.twitterUrl ?? ''}
                  onChange={(event) =>
                    setField('twitterUrl', event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                LinkedIn URL
                <input
                  className={inputClass}
                  type="url"
                  placeholder="https://"
                  value={contact.linkedinUrl ?? ''}
                  onChange={(event) =>
                    setField('linkedinUrl', event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                GitHub URL
                <input
                  className={inputClass}
                  type="url"
                  placeholder="https://"
                  value={contact.githubUrl ?? ''}
                  onChange={(event) =>
                    setField('githubUrl', event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Facebook page URL
                <input
                  className={inputClass}
                  type="url"
                  placeholder="https://www.facebook.com/your-page"
                  value={contact.facebookUrl ?? ''}
                  onChange={(event) =>
                    setField('facebookUrl', event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Instagram URL
                <input
                  className={inputClass}
                  type="url"
                  placeholder="https://www.instagram.com/your-account"
                  value={contact.instagramUrl ?? ''}
                  onChange={(event) =>
                    setField('instagramUrl', event.target.value)
                  }
                />
              </label>
            </div>
            {contactFeedback && (
              <Feedback tone={contactFeedback.error ? 'error' : 'success'}>
                {contactFeedback.text}
              </Feedback>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary">
                {contactBusy ? 'Saving…' : 'Save as draft'}
              </Button>
              <Button type="button" onClick={() => void publishContact()}>
                Publish footer details
              </Button>
            </div>
          </fieldset>
        </form>
      </div>
      {photoSource && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-photo-heading"
            className="grid w-full max-w-lg gap-4 rounded-xl bg-white p-5"
          >
            <h2 id="crop-photo-heading" className="m-0 text-lg font-semibold">
              Adjust profile photo
            </h2>
            <div className="relative h-80 overflow-hidden rounded-lg bg-neutral-900">
              <Cropper
                image={photoSource}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <label className="grid gap-2 text-sm">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(photoSource);
                  setPhotoSource(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={uploadingPhoto || !cropArea}
                onClick={() => void confirmPhotoCrop()}
              >
                {uploadingPhoto ? 'Uploading…' : 'Crop and upload'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
