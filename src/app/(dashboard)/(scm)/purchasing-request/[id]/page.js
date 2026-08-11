import PurchasingRequestDetailPage from "views/scm/purchasing-request/detail";

export const metadata = {
  title: "Detail Purchasing Request",
};

/** Connects the dynamic request route to the Purchasing Request detail view. */
export default function Page() {
  return <PurchasingRequestDetailPage />;
}
