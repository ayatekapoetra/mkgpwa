import dynamic from 'next/dynamic';

const AssetSettings = dynamic(() => import('views/asset-purchases/settings'), { ssr: false });

export default function Page() { return <AssetSettings type="providers" />; }