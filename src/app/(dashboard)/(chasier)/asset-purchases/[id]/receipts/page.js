import AssetPurchaseDetail from 'views/asset-purchases/detail';

export default function Page({ params }) { return <AssetPurchaseDetail id={params.id} initialTab="receipts" />; }
