import SpotifyLayout from '@/components/ui/SpotifyLayout';

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SpotifyLayout>{children}</SpotifyLayout>;
}

