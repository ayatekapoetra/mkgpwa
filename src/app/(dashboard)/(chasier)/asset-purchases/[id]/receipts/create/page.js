import AssetResourceForm from 'views/asset-purchases/resource-form';

export default function Page({ params }) { return <AssetResourceForm definitionKey="receipts" purchaseId={params.id} mode="create" />; }