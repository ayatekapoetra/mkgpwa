import AssetResourceForm from 'views/asset-purchases/resource-form';

export default function Page({ params }) { return <AssetResourceForm definitionKey="offers" purchaseId={params.id} mode="create" />; }