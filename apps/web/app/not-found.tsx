import { ButtonLink } from '../src/components/button';
import { EmptyState } from '../src/components/empty-state';

export default function GlobalNotFound() {
  return (
    <EmptyState
      headingLevel={1}
      heading="Page not found"
      body="The page you are looking for does not exist or has been moved."
      action={<ButtonLink href="/">Back to home</ButtonLink>}
    />
  );
}
