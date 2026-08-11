"use client";

import { useParams, useRouter } from "next/navigation";
import { Alert, CircularProgress, Stack } from "@mui/material";

import {
  usePurchasingRequestAccess,
  usePurchasingRequestPermissions,
  useShowPurchasingRequest,
} from "api/purchasing-request";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import PurchasingRequestForm from "./form";

/** Resolves access and data before rendering the create or edit request form. */
export default function PurchasingRequestFormPage({ mode = "create" }) {
  const params = useParams();
  const router = useRouter();
  const edit = mode === "edit";
  const { permissions: access } = usePurchasingRequestAccess();
  const { row, rowLoading, rowError } = useShowPurchasingRequest(
    edit ? params.id : null,
    edit && access.can_read,
  );
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePurchasingRequestPermissions(row, edit && Boolean(row));
  const allowed = edit ? permissions.can_update : access.can_insert;
  return (
    <>
      <Breadcrumbs
        custom
        heading={edit ? "Edit Purchasing Request" : "Buat Purchasing Request"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing Request", to: "/purchasing-request" },
          { title: edit ? "Edit" : "Create" },
        ]}
      />
      <MainCard
        title={
          <BtnBack
            href={
              edit ? `/purchasing-request/${params.id}` : "/purchasing-request"
            }
          />
        }
        content
      >
        {edit && (rowLoading || permissionsLoading) ? (
          <Stack alignItems="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : rowError || permissionsError ? (
          <Alert severity="error">
            Gagal memuat dokumen atau hak akses Purchasing Request.
          </Alert>
        ) : !allowed ? (
          <Alert severity="warning">
            Anda tidak memiliki akses untuk {edit ? "mengubah" : "membuat"}{" "}
            Purchasing Request.
          </Alert>
        ) : (
          <PurchasingRequestForm
            mode={mode}
            initialData={row}
            onSuccess={(id) =>
              router.push(`/purchasing-request/${id || params.id}`)
            }
          />
        )}
      </MainCard>
    </>
  );
}
