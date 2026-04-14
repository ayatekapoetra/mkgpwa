import dynamic from 'next/dynamic';

const ShowPemasokScreen = dynamic(() => import('views/master/pemasok/show'), { ssr: false });

export default function Page() {
  return <ShowPemasokScreen />;
}
