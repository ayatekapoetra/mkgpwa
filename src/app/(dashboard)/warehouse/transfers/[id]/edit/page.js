import WarehouseTransferFormScreen from 'views/warehouse/transfers/form-screen';

export default function Page({ params }) {
  return <WarehouseTransferFormScreen id={params.id} mode="edit" />;
}
