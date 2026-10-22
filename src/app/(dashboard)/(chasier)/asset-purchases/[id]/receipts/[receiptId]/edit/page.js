import AssetResourceForm from 'views/asset-purchases/resource-form';

export default function Page({ params }) { return <AssetResourceForm definitionKey="receipts" purchaseId={params.id} resourceId={params.receiptId} mode="edit" />; }