import StokopnameFormScreen from 'views/warehouse/stokopname/form-screen';

export default function Page({ params }) {
  return <StokopnameFormScreen id={params.id} mode="edit" />;
}
