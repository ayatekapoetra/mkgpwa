import dynamic from 'next/dynamic';

const AddPemasokScreen = dynamic(() => import('views/master/pemasok/create'), { ssr: false });

export default function Page() {
  return <AddPemasokScreen />;
}
