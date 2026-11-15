import styles from './historical-home-preview.module.css';

export function HistoricalPreviewNotice() {
  return (
    <aside className={styles.notice} aria-label="Historical preview notice">
      <strong>Historical design preview.</strong> This view uses sample copy and
      Unsplash photos from Git history. It is not recovered website content.
    </aside>
  );
}
