import PurchaseOrderDetailPage from "views/scm/purchasing-orders/detail";

export const metadata = {
  title: "Detail Purchase Order",
};

/** Connects the dynamic Purchase Order route to the detail view. */
export default function Page() {
  return <PurchaseOrderDetailPage />;
}