import { Section } from '../src/components/section';

// Home sections are built in COD-321. This keeps the single h1 in place.
export default function Home() {
  return (
    <Section
      headingLevel={1}
      heading="CodedDevs"
      introduction="Built for What Is Next."
    />
  );
}
