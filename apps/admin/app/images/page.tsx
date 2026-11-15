'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  fetchMediaAssets,
  formatFileSize,
  MediaApiError,
  replaceMediaAsset,
} from '../../src/lib/media-client';
import type { MediaAsset } from '../../src/types/media';

export default function ImagesPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssets(await fetchMediaAssets({ limit: 100 }));
    } catch (cause) {
      setError(
        cause instanceof MediaApiError
          ? cause.message
          : 'Could not load the image library.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  async function handleReplace(asset: MediaAsset, file?: File) {
    if (!file) return;
    setError(null);
    setNotice(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`Image exceeds the 10 MB limit (${formatFileSize(file.size)}).`);
      return;
    }

    setReplacingId(asset.id);
    try {
      const updated = await replaceMediaAsset(asset.id, file);
      setAssets((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        `Image replaced. Existing pages continue using the same image URL.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not replace the image.',
      );
    } finally {
      setReplacingId(null);
    }
  }

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Images</h1>
        <p style={{ color: '#555', marginTop: 0 }}>
          Replace an existing image. Its current URL and placement stay the
          same; text, links, and section order cannot be changed here.
        </p>
      </header>

      {error && (
        <p role="alert" style={{ color: '#991b1b' }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: '#166534' }}>
          {notice}
        </p>
      )}
      {loading ? (
        <p>Loading images…</p>
      ) : assets.length === 0 ? (
        <p>No images are available in the media library.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '1rem',
          }}
        >
          {assets.map((asset) => (
            <article
              key={asset.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <Image
                unoptimized
                width={400}
                height={180}
                src={`${asset.url}${asset.url.includes('?') ? '&' : '?'}v=${encodeURIComponent(asset.updatedAt)}`}
                alt={asset.altText ?? ''}
                style={{ width: '100%', height: 180, objectFit: 'cover' }}
              />
              <div style={{ padding: '0.9rem' }}>
                <p style={{ margin: '0 0 0.4rem', overflowWrap: 'anywhere' }}>
                  {asset.objectKey}
                </p>
                <p
                  style={{
                    margin: '0 0 0.8rem',
                    color: '#6b7280',
                    fontSize: '0.85rem',
                  }}
                >
                  {asset.referencesCount} page reference
                  {asset.referencesCount === 1 ? '' : 's'} ·{' '}
                  {formatFileSize(asset.byteSize)}
                </p>
                <label
                  style={{
                    display: 'inline-block',
                    padding: '0.45rem 0.7rem',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    cursor: replacingId === asset.id ? 'wait' : 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  {replacingId === asset.id ? 'Replacing…' : 'Replace image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={replacingId !== null}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      void handleReplace(asset, file);
                      event.currentTarget.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
