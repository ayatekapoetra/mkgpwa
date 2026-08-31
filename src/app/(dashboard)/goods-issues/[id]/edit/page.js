import GoodsIssueFormScreen from 'views/warehouse/goods-issues/form-screen';

export const metadata = { title: 'Edit Goods Issue' };

export default function Page({ params }) {
  return <GoodsIssueFormScreen id={params.id} mode="edit" />;
}