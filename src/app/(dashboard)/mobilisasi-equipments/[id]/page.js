import EquipmentMobilizationShowScreen from 'views/operational/equipment-mobilization/show';

export default function Page({ params }) {
  return <EquipmentMobilizationShowScreen id={params?.id} />;
}
