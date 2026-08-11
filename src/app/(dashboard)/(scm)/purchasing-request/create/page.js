import PurchasingRequestFormPage from "views/scm/purchasing-request/form-page";

export const metadata = {
  title: "Create Purchasing Request",
};

/** Connects the create route to the shared Purchasing Request form page. */
export default function Page() {
  return <PurchasingRequestFormPage mode="create" />;
}
