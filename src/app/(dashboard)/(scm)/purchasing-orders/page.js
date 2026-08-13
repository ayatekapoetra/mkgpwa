import PurchaseOrderPage from "views/scm/purchasing-orders";

export const metadata = {
  title: "Purchase Order",
};

/** Connects the Purchase Order list route to its feature view. */
export default function Page() {
  return <PurchaseOrderPage />;
}