'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  fetchMediaAssets,
  formatFileSize,
  MediaApiError,
} from '../../src/lib/media-client';
import type { MediaAsset } from '../../src/types/media';
import {
  Button,
  Feedback,
  PageHeader,
  SurfaceCard,
} from '../../src/components/admin-ui';

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
    <section className="admin-page media-page">
      <PageHeader
        title="Media Library"
        description="Browse images available for article covers and website content."
      />

      {error && <Feedback tone="error">{error}</Feedback>}
      {loading ? (
        <SurfaceCard className="media-message" role="status">
          Loading images…
        </SurfaceCard>
      ) : assets.length === 0 ? (
        <SurfaceCard className="media-message">
          <h2>No images available</h2>
          <p>No images are available in the media library.</p>
        </SurfaceCard>
      ) : (
        <>
          <div className="media-grid">
            {assets.map((asset) => (
              <article key={asset.id} className="ui-card media-asset">
                <Image
                  unoptimized
                  width={400}
                  height={180}
                  src={`${asset.url}${asset.url.includes('?') ? '&' : '?'}v=${encodeURIComponent(asset.updatedAt)}`}
                  alt={asset.altText ?? ''}
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
                <div className="media-asset-details">
                  <p className="media-asset-key">{asset.objectKey}</p>
                  <p className="media-asset-meta">
                    {asset.referencesCount} page reference
                    {asset.referencesCount === 1 ? '' : 's'} ·{' '}
                    {formatFileSize(asset.byteSize)}
                  </p>
                </div>
              </article>
            ))}
          </div>
          {hasMore && (
            <Button
              type="button"
              variant="secondary"
              disabled={loadingMore}
              onClick={() => void loadAssets(page + 1)}
              className="media-load-more"
            >
              {loadingMore ? 'Loading…' : 'Load more images'}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
