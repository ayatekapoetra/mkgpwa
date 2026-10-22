import dynamic from 'next/dynamic';

const AssetResourceForm = dynamic(() => import('views/asset-purchases/resource-form'), { ssr: false });

export default function Page({ params }) { return <AssetResourceForm definitionKey="providers" resourceId={params.id} mode="edit" />; }