import PurchasingRequestFormPage from "views/scm/purchasing-request/form-page";

export const metadata = {
  title: "Edit Purchasing Request",
};

/** Connects the edit route to the shared Purchasing Request form page. */
export default function Page() {
  return <PurchasingRequestFormPage mode="edit" />;
}
