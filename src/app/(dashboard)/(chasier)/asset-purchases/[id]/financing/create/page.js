import AssetResourceForm from 'views/asset-purchases/resource-form';

export default function Page({ params }) { return <AssetResourceForm definitionKey="financing" purchaseId={params.id} mode="create" />; }