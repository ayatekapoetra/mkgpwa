import { useMemo } from 'react';

const useCustomOptions = () => {
  const dropdownOptions = useMemo(() => {
    const arrBisnis = [
      { key: '1', teks: 'CV. Makkuragatama' },
      { key: '3', teks: 'PT. Makkuragatama Kreasindo' }
    ];

    const arrJenisItem = [
      { key: 'dokumen', teks: 'Dukument' },
      { key: 'sparepart', teks: 'Sparepart' },
      { key: 'kargo', teks: 'Kargo' }
    ];

    const arrTypeKirim = [
      { key: 'ekspress', teks: 'Ekspress' },
      { key: 'reguler', teks: 'Reguler' },
      { key: 'ekonomis', teks: 'Ekonomis' }
    ];

    const arrViaKirim = [
      { key: 'via darat', teks: 'Via Darat' },
      { key: 'via laut', teks: 'Via Laut' },
      { key: 'via udara', teks: 'Via Udara' }
    ];

    const optionsMap = {
      bisnis: arrBisnis,
      jenisItem: arrJenisItem,
      typeKirim: arrTypeKirim,
      viaKirim: arrViaKirim
    };

    const getLabel = (type, key) => {
      const found = optionsMap[type]?.find((item) => item.key === key);
      return found?.teks || '';
    };

    return {
      bisnisOptions: arrBisnis,
      jenisItemOptions: arrJenisItem,
      typeKirimOptions: arrTypeKirim,
      viaKirimOptions: arrViaKirim,
      getLabel
    };
  }, []);

  return dropdownOptions;
};

export default useCustomOptions;
