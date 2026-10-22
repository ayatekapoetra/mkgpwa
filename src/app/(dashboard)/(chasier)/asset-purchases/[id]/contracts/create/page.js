import AssetResourceForm from 'views/asset-purchases/resource-form';

export default function Page({ params }) { return <AssetResourceForm definitionKey="contracts" purchaseId={params.id} mode="create" />; }