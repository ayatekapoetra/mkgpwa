import RentalContractShow from 'views/operational/rental-contract/show';

export default async function Page({ params }) {
  const { id } = await params;
  return <RentalContractShow id={id} />;
}
