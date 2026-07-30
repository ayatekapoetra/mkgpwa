import WarehouseTransferShowScreen from 'views/warehouse/transfers/show';

export default function Page({ params }) {
  return <WarehouseTransferShowScreen id={params.id} />;
}
