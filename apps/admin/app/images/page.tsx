'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  fetchMediaAssets,
  formatFileSize,
  MediaApiError,
} from '../../src/lib/media-client';
import type { MediaAsset } from '../../src/types/media';

const PAGE_SIZE = 100;

export default function ImagesPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = useCallback(async (pageToLoad = 1) => {
    const append = pageToLoad > 1;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const nextAssets = await fetchMediaAssets({
        page: pageToLoad,
        limit: PAGE_SIZE,
      });
      setAssets((current) =>
        append ? [...current, ...nextAssets] : nextAssets,
      );
      setPage(pageToLoad);
      setHasMore(nextAssets.length === PAGE_SIZE);
    } catch (cause) {
      setError(
        cause instanceof MediaApiError
          ? cause.message
          : 'Could not load the image library.',
      );
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Images</h1>
        <p style={{ color: '#555', marginTop: 0 }}>
          Images are shown for reference. All website content and media are
          currently read-only.
        </p>
      </header>

      {error && (
        <p role="alert" style={{ color: '#991b1b' }}>
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading images…</p>
      ) : assets.length === 0 ? (
        <p>No images are available in the media library.</p>
      ) : (
        <>
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
                </div>
              </article>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void loadAssets(page + 1)}
              style={{
                marginTop: '1rem',
                padding: '0.65rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                background: '#fff',
                color: '#111827',
                cursor: loadingMore ? 'wait' : 'pointer',
              }}
            >
              {loadingMore ? 'Loading…' : 'Load more images'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
