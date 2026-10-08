import RentalContractForm from 'views/operational/rental-contract/form';

export default async function Page({ params }) {
  const { id } = await params;
  return <RentalContractForm id={id} />;
}
