import dynamic from 'next/dynamic';

const PemasokScreen = dynamic(() => import('views/master/pemasok'), { ssr: false });

export default function Page() {
  return <PemasokScreen />;
}
