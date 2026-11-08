import { ButtonLink } from '../../../src/components/button';
import { EmptyState } from '../../../src/components/empty-state';

export default function ArticleNotFound() {
  return (
    <EmptyState
      headingLevel={1}
      heading="Article not found"
      body="The article you are looking for does not exist, has been removed, or has not been published yet."
      action={<ButtonLink href="/insights">All insights</ButtonLink>}
    />
  );
}
