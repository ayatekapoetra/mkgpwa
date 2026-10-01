"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Alert, CircularProgress, Stack } from "@mui/material";

import {
  usePurchasingRequestAccess,
  usePurchasingRequestPermissions,
  useShowPurchasingRequest,
} from "api/purchasing-request";
import { prepareGoodsIssue } from "api/material-request";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import PurchasingRequestForm from "./form";

/** Resolves access and data before rendering the create or edit request form. */
export default function PurchasingRequestFormPage({ mode = "create" }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Pre-fill dari Material Request (work order) untuk mode create
  const mroParam = searchParams.get("mro");
  const woParam = searchParams.get("wo");
  const [mrPrefill, setMrPrefill] = useState(null);
  const [mrPrefillLoading, setMrPrefillLoading] = useState(false);

  useEffect(() => {
    const ids = mroParam
      ? mroParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    if (ids.length === 0 || edit) return;
    let active = true;
    setMrPrefillLoading(true);
    Promise.all(ids.map((id) => prepareGoodsIssue(id).catch(() => null)))
      .then((list) => {
        if (!active) return;
        const items = list.filter(Boolean);
        if (items.length > 0) {
          const first = items[0];
          setMrPrefill({
            bisnis_id: first.gudang?.bisnis_id || "",
            cabang_id: first.gudang?.cabang_id || "",
            gudang_id: first.gudang?.id || "",
            wo_id: woParam ? Number(woParam) : first.wo_id || null,
            kdwo: first.kdwo || "",
            items: items.map((d) => {
              const hasBarang = Boolean(d.barang?.id);
              return {
                barang_id: d.barang?.id || "",
                barang: d.barang || null,
                equipment_id: d.equipment?.id || d.equipment_id || "",
                equipment: d.equipment || null,
                qty_req: d.qty_requested || d.qty_to_issue || 1,
                stn: d.barang?.satuan_order || d.uom_used || "",
                description: hasBarang ? "" : (d.narasi || d.aliaspart || ""),
                woid: d.wo_id || null,
                mro_id: d.mro_id || null,
              };
            }),
          });
        }
      })
      .finally(() => {
        if (active) setMrPrefillLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mroParam, woParam, edit]);

  const effectiveInitialData = useMemo(
    () => (edit ? row : mrPrefill),
    [edit, row, mrPrefill],
  );

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
        ) : !edit && mrPrefillLoading ? (
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
            initialData={effectiveInitialData}
            onSuccess={(id) =>
              router.push(`/purchasing-request/${id || params.id}`)
            }
          />
        )}
      </MainCard>
    </>
  );
}
