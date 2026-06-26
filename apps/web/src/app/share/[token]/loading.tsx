import { PageLoader } from '~/components/feedback';

export default function SharedLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <PageLoader label="Loading shared collection…" />
    </div>
  );
}
