import useSWR from 'swr';
import { useMemo } from 'react';

// UTIL
import { fetcher } from 'utils/axios';

export const endpoints = {
  key: '/msc/delivery-order',
  keypemasok: '/master/pemasok',
  list: '/list', // server URL
  show: '/show', // server URL
  prepPickup: '/list-prepare-pickup', // Data prepare for pickup
  prepOrder: '/list-prepare-delor' // Data prepare for delivery order
};

export const useGetDelorByPemasok = () => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.prepOrder, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows || [],
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

// export const useGetPemasokDelor = () => {
//   const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.prepOrder, fetcher, {
//     revalidateIfStale: false,
//     revalidateOnFocus: false,
//     revalidateOnReconnect: false
//   });

//   const memoizedValue = useMemo(
//     () => ({
//       data: data?.rows || [],
//       dataLoading: isLoading,
//       dataError: error,
//       dataValidating: isValidating,
//       dataEmpty: !isLoading && !data?.data?.length
//     }),
//     [data, error, isLoading, isValidating]
//   );

//   return memoizedValue;
// };

export const useGetDeliveryOrder = (params) => {
  const key = params ? `${endpoints.key}${endpoints.list}?${new URLSearchParams(params)}` : `${endpoints.key}${endpoints.list}`;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && (!data?.rows || data?.rows.length === 0)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

// export const useGetDeliveryOrder = (params) => {
//   if (params) {
//     const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.list + `?${new URLSearchParams(params)}`, fetcher, {
//       revalidateIfStale: true,
//       revalidateOnFocus: true,
//       revalidateOnReconnect: false
//     });

//     const memoizedValue = useMemo(
//       () => ({
//         data: data?.rows,
//         dataLoading: isLoading,
//         dataError: error,
//         dataValidating: isValidating,
//         dataEmpty: !isLoading && !data?.data?.length
//       }),
//       [data, error, isLoading, isValidating]
//     );

//     return memoizedValue;
//   } else {
//     const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.list, fetcher, {
//       revalidateIfStale: true,
//       revalidateOnFocus: true,
//       revalidateOnReconnect: false
//     });

//     const memoizedValue = useMemo(
//       () => ({
//         data: data?.rows,
//         dataLoading: isLoading,
//         dataError: error,
//         dataValidating: isValidating,
//         dataEmpty: !isLoading && !data?.data?.length
//       }),
//       [data, error, isLoading, isValidating]
//     );

//     return memoizedValue;
//   }
// };

export const useShowDeliveryOrder = (id) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + `/${id}` + endpoints.show, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
};

export const useGetPrepareDo = (pemasok_id) => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    endpoints.key + endpoints.prepOrder + '?pemasok_id=' + pemasok_id,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.rows,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.data?.length,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
};

// export const useGetReadyPickup = (arrselected = []) => {
//   const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.prepPickup, fetcher, {
//     revalidateIfStale: true,
//     revalidateOnFocus: false,
//     revalidateOnReconnect: false
//   });

//   const memoizedValue = useMemo(
//     () => ({
//       data: data?.rows?.map((m) => (arrselected.includes(m.id) ? { ...m, selected: true } : m)),
//       dataLoading: isLoading,
//       dataError: error,
//       dataValidating: isValidating,
//       dataEmpty: !isLoading && !data?.data?.length
//     }),
//     [data, error, isLoading, isValidating]
//   );

//   return memoizedValue;
// };

export const useGetReadyPickup = (arrselected = []) => {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key + endpoints.prepPickup, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(() => {
    const safeArrSelected = Array.isArray(arrselected) ? arrselected : [];

    const updatedData =
      data?.rows?.map((item) => ({
        ...item,
        selected: safeArrSelected.includes(item.id)
      })) || [];

    return {
      data: updatedData,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && updatedData.length === 0
    };
  }, [data, arrselected, error, isLoading, isValidating]);

  return memoizedValue;
};
