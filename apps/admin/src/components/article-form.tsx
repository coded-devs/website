'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, ImagePlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  generateSlug,
  calculateReadTime,
  createArticle,
  updateArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  ArticleApiError,
} from '../lib/articles-client';
import { MediaApiError, uploadMediaAsset } from '../lib/media-client';
import type { AdminArticle, AdminArticleInput } from '../types/article';
import { useDialogFocus } from '../hooks/use-dialog-focus';

interface ArticleFormProps {
  initialArticle?: AdminArticle;
  mode: 'create' | 'edit';
}

export function ArticleForm({ initialArticle, mode }: ArticleFormProps) {
  const router = useRouter();
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);

  // Form field state
  const [title, setTitle] = useState(initialArticle?.draftPayload.title || '');
  const [slug, setSlug] = useState(initialArticle?.draftSlug || '');
  const [excerpt, setExcerpt] = useState(
    initialArticle?.draftPayload.excerpt || '',
  );
  const [body, setBody] = useState(initialArticle?.draftPayload.body || '');
  const [tagsInput, setTagsInput] = useState(
    (initialArticle?.draftPayload.tags || []).join(', '),
  );
  const [isSpotlight, setIsSpotlight] = useState(
    initialArticle?.draftPayload.isSpotlight ?? false,
  );
  const [readTime, setReadTime] = useState<number>(
    initialArticle?.draftPayload.readTimeMinutes || 3,
  );
  const [coverImage, setCoverImage] = useState(
    initialArticle?.draftPayload.coverImage || '',
  );
  const [coverImageAlt, setCoverImageAlt] = useState(
    initialArticle?.draftPayload.coverImageAlt || '',
  );
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [bodyUploadError, setBodyUploadError] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState(
    initialArticle?.draftPayload.metaTitle || '',
  );
  const [metaDescription, setMetaDescription] = useState(
    initialArticle?.draftPayload.metaDescription || '',
  );

  // Status & publication state
  const [currentArticle, setCurrentArticle] = useState<
    AdminArticle | undefined
  >(initialArticle);
  const isPublished = currentArticle?.status === 'published';

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSeoSection, setShowSeoSection] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const previewDialog = useDialogFocus(showPreviewModal, () =>
    setShowPreviewModal(false),
  );
  const deleteDialog = useDialogFocus(showDeleteModal, () =>
    setShowDeleteModal(false),
  );

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleTitleBlur() {
    if (!slug.trim() && title.trim()) {
      setSlug(generateSlug(title));
    }
  }

  function handleBodyChange(value: string) {
    setBody(value);
    const calculated = calculateReadTime(value);
    setReadTime(calculated);
  }

  async function handleCoverImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCoverUploadError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCoverUploadError('The image must be 10 MB or smaller.');
      return;
    }

    setCoverUploadError(null);
    setIsUploadingMedia(true);
    try {
      const asset = await uploadMediaAsset(
        file,
        coverImageAlt.trim() || undefined,
      );
      setCoverImage(asset.url);
      if (asset.altText) setCoverImageAlt(asset.altText);
      setSuccessMessage('Cover image uploaded.');
    } catch (cause) {
      setCoverUploadError(
        cause instanceof MediaApiError
          ? cause.message
          : 'Could not upload the cover image. Please try again.',
      );
    } finally {
      setIsUploadingMedia(false);
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!slug.trim()) {
      errors.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      errors.slug =
        'Slug must only contain lowercase letters, numbers, and hyphens.';
    }

    if (!excerpt.trim()) {
      errors.excerpt = 'Excerpt is required.';
    }

    if (!body.trim()) {
      errors.body = 'Article body content cannot be empty.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function getArticleInput(): AdminArticleInput {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      tags,
      readTimeMinutes: Number(readTime) || 1,
      isSpotlight,
      coverImage: coverImage.trim() || undefined,
      coverImageAlt: coverImageAlt.trim() || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
    };
  }

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const input = getArticleInput();
      if (mode === 'create') {
        const created = await createArticle(input, false);
        setSuccessMessage('Draft created successfully!');
        router.push(`/insights/${created.id}/edit`);
      } else if (currentArticle) {
        const updated = await updateArticle(currentArticle.id, input);
        setCurrentArticle(updated);
        setSuccessMessage('Draft changes saved successfully.');
      }
    } catch (err) {
      if (err instanceof ArticleApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save draft. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const input = getArticleInput();
      if (mode === 'create') {
        const created = await createArticle(input, true);
        setSuccessMessage('Article published successfully!');
        router.push(`/insights/${created.id}/edit`);
      } else if (currentArticle) {
        // Save pending edits then publish
        await updateArticle(currentArticle.id, input);
        const published = await publishArticle(currentArticle.id);
        setCurrentArticle(published);
        setSuccessMessage('Article published successfully to the live site!');
      }
    } catch (err) {
      if (err instanceof ArticleApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to publish article. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnpublish() {
    if (!currentArticle) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const unpublished = await unpublishArticle(currentArticle.id);
      setCurrentArticle(unpublished);
      setSuccessMessage(
        'Article unpublished. It is no longer accessible on the public site.',
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to unpublish article.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!currentArticle) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await deleteArticle(currentArticle.id);
      router.push('/insights');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete article.',
      );
      setShowDeleteModal(false);
      setIsSubmitting(false);
    }
  }

  const tagsList = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="article-editor">
      <header className="article-editor-header">
        <h1>{mode === 'create' ? 'New article' : 'Edit article'}</h1>
        <div className="article-editor-actions">
          <Link href="/insights" className="article-editor-cancel">Cancel</Link>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isUploadingMedia}
            className="article-editor-save"
          >
            {isSubmitting ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting || isUploadingMedia}
            className="article-editor-publish"
          >
            {isSubmitting
              ? 'Publishing…'
              : isPublished
                ? 'Update'
                : 'Publish'}
          </button>
        </div>
      </header>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="bg-[color:#ecfdf5] [border:1px_solid_#a7f3d0] text-[color:#065f46] [padding:0.75rem_1rem] rounded-[6px] mb-[1.5rem] text-[length:0.9rem]"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="bg-[color:#fef2f2] [border:1px_solid_#fecaca] text-[color:#991b1b] [padding:0.75rem_1rem] rounded-[6px] mb-[1.5rem] text-[length:0.9rem]"
        >
          {errorMessage}
        </div>
      )}

      {/* Single-column writing surface */}
      <div className="editor-columns">
        <div className="editor-primary-column">
          <div className="editor-article-meta-fields">
            <div className="article-field-row">
              <label htmlFor="article-title">Title</label>
              <input
                id="article-title"
                className={
                  'article-line-input' + (fieldErrors.title ? ' has-error' : '')
                }
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="What the post is called"
                aria-invalid={Boolean(fieldErrors.title)}
              />
            </div>
            {fieldErrors.title ? <p className="article-field-error">{fieldErrors.title}</p> : null}

            <div className="article-field-row">
              <label htmlFor="article-slug">Address</label>
              <span className="article-address-value">
                <span>/insights/</span>
                <input
                  id="article-slug"
                  className={'article-line-input article-line-mono' + (fieldErrors.slug ? ' has-error' : '')}
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="article-address"
                  aria-invalid={Boolean(fieldErrors.slug)}
                />
              </span>
            </div>
            {fieldErrors.slug ? <p className="article-field-error">{fieldErrors.slug}</p> : null}

            <div className="article-field-row article-field-row-start">
              <label htmlFor="article-excerpt">Subtitle</label>
              <textarea
                id="article-excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short description of the article"
                className={
                  'article-line-input article-line-textarea' + (fieldErrors.excerpt ? ' has-error' : '')
                }
                aria-invalid={Boolean(fieldErrors.excerpt)}
              />
            </div>
            {fieldErrors.excerpt ? <p className="article-field-error">{fieldErrors.excerpt}</p> : null}
          </div>

          <div>
            {/* Body Content */}
            <div className="mb-[1.25rem]">
              <div className="article-body-toolbar">
                <label
                  htmlFor="article-body"
                  className="article-body-label"
                >
                  BODY <span className="article-body-format">Markdown</span>
                </label>
                <div className="article-body-actions">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="article-editor-tool"
                  >
                    <Eye size={16} aria-hidden="true" /> Preview
                  </button>
                  <button
                    type="button"
                    className="article-editor-tool"
                    disabled={isUploadingMedia}
                    onClick={() => document.getElementById('article-body-image')?.click()}
                  >
                    <ImagePlus size={16} aria-hidden="true" /> Insert image
                  </button>
                  <input
                    id="article-body-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-label="Choose an image to insert into the article"
                    tabIndex={-1}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                        setBodyUploadError('Choose a JPG, PNG, or WebP image.');
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        setBodyUploadError('The image must be 10 MB or smaller.');
                        return;
                      }
                      setIsUploadingMedia(true);
                      setBodyUploadError(null);
                      try {
                        const asset = await uploadMediaAsset(file);
                        const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
                        const textarea = bodyInputRef.current;
                        const current = textarea?.value ?? body;
                        const from = Math.min(textarea?.selectionStart ?? current.length, current.length);
                        const to = Math.min(textarea?.selectionEnd ?? from, current.length);
                        const prefix = from > 0 && current[from - 1] !== '\n' ? '\n\n' : '';
                        const suffix = to < current.length && current[to] !== '\n' ? '\n\n' : '\n';
                        const markdown = `${prefix}![${alt}](${asset.url})${suffix}`;
                        handleBodyChange(`${current.slice(0, from)}${markdown}${current.slice(to)}`);
                        requestAnimationFrame(() => {
                          const cursor = from + markdown.length;
                          textarea?.focus();
                          textarea?.setSelectionRange(cursor, cursor);
                        });
                      } catch (cause) {
                        setBodyUploadError(cause instanceof MediaApiError ? cause.message : 'Could not upload the image.');
                      } finally {
                        setIsUploadingMedia(false);
                      }
                    }}
                  />
                </div>
              </div>
              <textarea
                id="article-body"
                ref={bodyInputRef}
                rows={16}
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Write in Markdown."
                className={
                  'article-editor-body article-line-input w-full [padding:0] [border:none] rounded-none text-[length:0.9rem] [font-family:ui-monospace,_monospace] box-border leading-[1.5] resize-y [outline:none]' +
                  ' ' +
                  (fieldErrors.body ? 'has-error' : '')
                }
              />
              {bodyUploadError ? <p className="editor-upload-error" role="alert">{bodyUploadError}</p> : null}
              {fieldErrors.body && (
                <p className="text-[color:#ef4444] text-[length:0.8rem] mt-[0.3rem]">
                  {fieldErrors.body}
                </p>
              )}
            </div>

          </div>
        </div>

        <div className="article-extra-fields">
          <h2>Article details</h2>
          <div className="article-field-row">
            <label htmlFor="article-tags">Category and tags</label>
            <input
              id="article-tags"
              className="article-line-input"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Engineering, Design"
            />
          </div>

          <div className="article-field-row">
            <span className="article-field-label">Spotlight</span>
            <label className="article-spotlight-control">
              <input
                type="checkbox"
                checked={isSpotlight}
                onChange={(event) => setIsSpotlight(event.target.checked)}
                className="mt-[0.15rem]"
              />
              <span>Spotlight on Insights</span>
            </label>
          </div>

          <div className="article-field-row">
            <label htmlFor="article-read-time">Read time</label>
            <span className="article-read-time-value">
              <input
                id="article-read-time"
                className="article-line-input article-line-mono"
                type="number"
                min={1}
                max={120}
                value={readTime}
                onChange={(e) =>
                  setReadTime(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
              />
              <span>minutes</span>
            </span>
          </div>

          <div className="article-extra-field">
            <label className="article-extra-label" htmlFor="article-cover-image">Cover image</label>

            {coverImage ? (
              <div className="editor-cover-upload-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt={coverImageAlt || ''} />
              </div>
            ) : null}

            <div>
              <input
                id="article-cover-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void handleCoverImageUpload(event)}
                disabled={isUploadingMedia}
                className="w-full [padding:0.45rem_0.65rem] rounded-[6px] [border:1px_solid_#d1d5db] text-[length:0.85rem] box-border"
              />
              <p className="editor-upload-hint">JPG, PNG, or WebP. Up to 10 MB.</p>
              {isUploadingMedia ? (
                <p className="editor-upload-hint" role="status">
                  Uploading image…
                </p>
              ) : null}
              {coverUploadError ? (
                <p className="editor-upload-error" role="alert">
                  {coverUploadError}
                </p>
              ) : null}
            </div>

            <div className="article-field-row">
              <label htmlFor="article-cover-alt">Image alt text</label>
              <input
                id="article-cover-alt"
                className="article-line-input"
                type="text"
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                placeholder="Describe the image"
              />
            </div>
          </div>

          <div className="article-extra-field">
            <button
              type="button"
              onClick={() => setShowSeoSection(!showSeoSection)}
              className="article-seo-toggle"
              aria-expanded={showSeoSection}
            >
              {showSeoSection ? 'Hide SEO fields' : 'SEO fields'}
            </button>
            {showSeoSection ? (
              <div className="article-seo-fields">
                <div className="article-field-row">
                  <label htmlFor="article-meta-title">Meta title</label>
                  <input id="article-meta-title" className="article-line-input" type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                </div>
                <div className="article-field-row article-field-row-start">
                  <label htmlFor="article-meta-desc">Meta description</label>
                  <textarea id="article-meta-desc" className="article-line-input article-line-textarea" rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                </div>
              </div>
            ) : null}
          </div>

          {mode === 'edit' ? (
            <div className="article-management-actions">
              {isPublished ? (
                <button type="button" onClick={handleUnpublish} disabled={isSubmitting || isUploadingMedia}>Unpublish</button>
              ) : null}
              <button type="button" onClick={() => setShowDeleteModal(true)} disabled={isSubmitting || isUploadingMedia}>Delete article</button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          ref={previewDialog.dialogRef}
          onKeyDown={previewDialog.onDialogKeyDown}
          tabIndex={-1}
          className="fixed [inset:0] bg-[color:rgba(0,_0,_0,_0.6)] flex items-center justify-center z-60 p-[1.5rem]"
        >
          <div className="bg-white rounded-[10px] max-w-[800px] w-full max-h-[90vh] flex flex-col [box-shadow:0_25px_50px_-12px_rgba(0,_0,_0,_0.25)] overflow-hidden">
            {/* Modal Header */}
            <div className="[padding:1rem_1.5rem] [border-bottom:1px_solid_#e5e7eb] flex justify-between items-center bg-[color:#f9fafb]">
              <div>
                <span
                  id="preview-modal-title"
                  className="font-bold text-[length:1rem] text-[color:#111827]"
                >
                  Article Live Preview
                </span>
                <span className="ml-[0.75rem] bg-[color:#e0e7ff] text-[color:#4338ca] text-[length:0.75rem] font-semibold [padding:0.2rem_0.5rem] rounded-[4px]">
                  Unpublished Draft Preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                aria-label="Close preview"
                className="[background:none] [border:none] text-[length:1.25rem] cursor-pointer text-[color:#6b7280]"
              >
                &times;
              </button>
            </div>

            {/* Modal Body: rendered Markdown draft preview */}
            <div className="p-[2rem] overflow-y-auto [flex:1] [font-family:system-ui,_-apple-system,_sans-serif]">
              <p className="editor-preview-meta">
                {tagsList[0] ? <strong>{tagsList[0]}</strong> : null}
                <span>Not published</span>
                <span>{readTime} min read</span>
                {isSpotlight ? <span>Insights spotlight</span> : null}
              </p>

              <h1 className="text-[length:2rem] [font-weight:800] leading-[1.25] [margin:0_0_1rem_0] text-[color:#111827]">
                {title || 'Untitled Article'}
              </h1>

              {excerpt && (
                <p className="text-[length:1.1rem] leading-[1.6] text-[color:#4b5563] italic mb-[1.5rem]">
                  {excerpt}
                </p>
              )}

              {coverImage && (
                <div className="editor-preview-cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt={coverImageAlt || title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="editor-preview-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {body || 'No content written yet.'}
                </ReactMarkdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="[padding:0.75rem_1.5rem] [border-top:1px_solid_#e5e7eb] flex justify-end bg-[color:#f9fafb]">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="[padding:0.45rem_1rem] rounded-[6px] [border:1px_solid_#d1d5db] bg-white text-[color:#374151] text-[length:0.875rem] font-medium cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && currentArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          ref={deleteDialog.dialogRef}
          onKeyDown={deleteDialog.onDialogKeyDown}
          tabIndex={-1}
          className="fixed [inset:0] bg-[color:rgba(0,_0,_0,_0.5)] flex items-center justify-center z-60 p-[1rem]"
        >
          <div className="bg-white rounded-[8px] max-w-[460px] w-full p-[1.5rem] [box-shadow:0_20px_25px_-5px_rgba(0,_0,_0,_0.1)]">
            <h3
              id="delete-dialog-title"
              className="text-[length:1.15rem] font-bold text-[color:#991b1b] mt-[0] mb-[0.75rem]"
            >
              Delete Article
            </h3>
            <p className="text-[color:#4b5563] text-[length:0.9rem] mb-[1.5rem]">
              Are you sure you want to permanently delete &ldquo;
              {currentArticle.draftPayload.title}&rdquo;?
              {isPublished && (
                <span className="block mt-[0.5rem] text-[color:#b91c1c]">
                  This article is currently published and will immediately
                  disappear from the public website.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-[0.75rem]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
                className="[padding:0.5rem_1rem] rounded-[6px] [border:1px_solid_#d1d5db] bg-white text-[color:#374151] text-[length:0.875rem] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className={
                  '[padding:0.5rem_1rem] rounded-[6px] [border:none] bg-[color:#dc2626] text-white text-[length:0.875rem] font-semibold' +
                  ' ' +
                  (isSubmitting ? 'cursor-wait' : 'cursor-pointer')
                }
              >
                {isSubmitting ? 'Deleting...' : 'Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
