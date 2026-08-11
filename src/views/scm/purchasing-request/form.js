"use client";

import { useMemo } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { Alert, Button, Divider, Stack } from "@mui/material";

import {
  createPurchasingRequest,
  getPurchasingRequestError,
  submitPurchasingRequest,
  updatePurchasingRequest,
  usePurchasingRequestBarang,
  usePurchasingRequestBisnis,
  usePurchasingRequestCabang,
  usePurchasingRequestEquipment,
  usePurchasingRequestGudang,
} from "api/purchasing-request";
import { openNotification } from "api/notification";
import {
  EMPTY_REQUEST_ITEM,
  RequestHeaderFields,
  RequestItemsFields,
} from "./components";

const TODAY = new Date().toISOString().slice(0, 10);

const PURCHASING_REQUEST_SCHEMA = Yup.object({
  bisnis_id: Yup.number().required("Bisnis wajib dipilih"),
  cabang_id: Yup.number().required("Cabang wajib dipilih"),
  gudang_id: Yup.number().required("Gudang wajib dipilih"),
  date_ro: Yup.date().required("Tanggal wajib diisi"),
  prioritas: Yup.string().oneOf(["P1", "P2", "P3"]).required(),
  items: Yup.array()
    .min(1, "Minimal satu item")
    .of(
      Yup.object({
        barang_id: Yup.number().required("Barang wajib dipilih"),
        qty_req: Yup.number().positive("Qty harus lebih dari 0").required(),
        stn: Yup.string().required("Satuan wajib diisi"),
      }),
    ),
});

/** Loads scoped master options and renders the interactive request form body. */
function PurchasingRequestFormBody({
  values,
  errors,
  touched,
  setFieldValue,
  handleChange,
  handleSubmit,
  isSubmitting,
  validateForm,
  isEditMode,
  initialData,
  onSuccess,
}) {
  const { rows: businessOptions = [] } = usePurchasingRequestBisnis();
  const { rows: branches = [] } = usePurchasingRequestCabang(
    values.bisnis_id ? { bisnis_id: values.bisnis_id } : {},
  );
  const { rows: warehouses = [] } = usePurchasingRequestGudang();
  // Load all spare parts without bisnis filter so search works across all units.
  const { rows: itemOptions = [], loading: itemLoading } =
    usePurchasingRequestBarang({}, true);
  // Master equipment returns a full array when page/perPages are omitted.
  // Keep cabang filter optional so the list still appears before branch is chosen.
  const { rows: equipmentOptions = [], loading: equipmentLoading } =
    usePurchasingRequestEquipment(
      {
        ...(values.cabang_id ? { cabang_id: values.cabang_id } : {}),
      },
      true,
    );

  const branchOptions = branches.filter(
    (branch) =>
      !values.bisnis_id ||
      !branch.bisnis_id ||
      String(branch.bisnis_id) === String(values.bisnis_id),
  );
  const warehouseOptions = warehouses.filter(
    (warehouse) =>
      !values.cabang_id ||
      !warehouse.cabang_id ||
      String(warehouse.cabang_id) === String(values.cabang_id),
  );

  const notify = (color, message) => {
    openNotification({
      open: true,
      title: color,
      message,
      alert: { color },
    });
  };

  const saveRequest = async (formValues, shouldSubmit) => {
    const payload = {
      ...formValues,
      status: "draft",
      items: formValues.items.map(
        ({ barang, equipment: equipmentObject, ...item }) => item,
      ),
    };
    let result;

    if (isEditMode) {
      result = await updatePurchasingRequest(initialData.id, payload);
    } else {
      result = await createPurchasingRequest(payload);
    }

    const requestId =
      result?.rows?.id || result?.data?.id || result?.id || initialData?.id;

    // If submitting, call the submit endpoint to transition draft → active.
    if (shouldSubmit) {
      await submitPurchasingRequest(requestId);
    }

    notify(
      "success",
      shouldSubmit
        ? "Purchasing Request berhasil diajukan"
        : "Draft berhasil disimpan",
    );
    onSuccess(requestId);
  };

  const submitDocument = async () => {
    const validation = await validateForm();

    if (Object.keys(validation).length) {
      notify("error", "Lengkapi data wajib sebelum submit");
      return;
    }

    try {
      await saveRequest(values, true);
    } catch (error) {
      notify(
        "error",
        getPurchasingRequestError(error, "Gagal submit PR").message,
      );
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(event);
      }}
    >
      <Stack spacing={3}>
        <Alert severity="info">
          Pastikan sparepart dipilih berdasarkan kode, part number, manufaktur,
          dan brand. Harga serta pemasok ditentukan purchasing saat validasi.
        </Alert>
        <RequestHeaderFields
          values={values}
          errors={errors}
          touched={touched}
          businessOptions={businessOptions}
          branchOptions={branchOptions}
          warehouseOptions={warehouseOptions}
          setFieldValue={setFieldValue}
          handleChange={handleChange}
        />
        <Divider />
        <RequestItemsFields
          values={values}
          errors={errors}
          itemOptions={itemOptions}
          equipmentOptions={equipmentOptions}
          itemLoading={itemLoading}
          equipmentLoading={equipmentLoading}
          setFieldValue={setFieldValue}
          handleChange={handleChange}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="flex-end"
          spacing={1.5}
        >
          <Button
            type="button"
            variant="outlined"
            disabled={isSubmitting}
            onClick={() => {
              saveRequest(values, false).catch((error) => {
                notify(
                  "error",
                  getPurchasingRequestError(error, "Gagal menyimpan PR")
                    .message,
                );
              });
            }}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Draft"}
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={submitDocument}
            disabled={isSubmitting}
          >
            Submit PR
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}

/** Creates or edits a purchasing request while preserving draft and submit flows. */
export default function PurchasingRequestForm({
  mode,
  initialData,
  onSuccess,
}) {
  const isEditMode = mode === "edit";
  const initialValues = useMemo(
    () => ({
      bisnis_id: initialData?.bisnis_id || "",
      cabang_id: initialData?.cabang_id || "",
      gudang_id: initialData?.gudang_id || "",
      date_ro: initialData?.date_ro || TODAY,
      prioritas: initialData?.prioritas || "P3",
      description: initialData?.description || "",
      items: initialData?.items
        ?.filter((item) => item.aktif !== "N")
        .map((item) => ({
          ...item,
          barang: item.barang || null,
          equipment: item.equipment || null,
        })) || [{ ...EMPTY_REQUEST_ITEM }],
    }),
    [initialData],
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={PURCHASING_REQUEST_SCHEMA}
      enableReinitialize
      onSubmit={() => undefined}
    >
      {(formikProps) => (
        <PurchasingRequestFormBody
          {...formikProps}
          isEditMode={isEditMode}
          initialData={initialData}
          onSuccess={onSuccess}
        />
      )}
    </Formik>
  );
}
