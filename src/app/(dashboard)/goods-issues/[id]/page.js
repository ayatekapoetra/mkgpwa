import GoodsIssueShowScreen from 'views/warehouse/goods-issues/show';

export const metadata = { title: 'Detail Goods Issue' };

export default function Page({ params }) {
  return <GoodsIssueShowScreen id={params.id} />;
}