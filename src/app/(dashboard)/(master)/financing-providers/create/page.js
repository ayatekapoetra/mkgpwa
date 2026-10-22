import dynamic from 'next/dynamic';

const AssetResourceForm = dynamic(() => import('views/asset-purchases/resource-form'), { ssr: false });

export default function Page() { return <AssetResourceForm definitionKey="providers" mode="create" />; }