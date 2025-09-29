import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { NextResponse } from 'next/server';
import axios from 'axios';
import moment from 'moment';

const axiosServices = axios.create({ baseURL: process.env.NEXT_APP_API_URL });

export async function POST(req) {
  const apiPenyewa = await axiosServices('/api/public/penyewa/list');
  const { rows: arrPenyewa } = apiPenyewa?.data;

  const apiLokasi = await axiosServices('/api/public/lokasi-kerja/list');
  const { rows: arrLokasi } = apiLokasi?.data;

  const apiEquipment = await axiosServices('/api/public/equipment/list');
  const { rows: arrEquipemnt } = apiEquipment?.data;

  const apiMaterial = await axiosServices('/api/public/material/list');
  const { rows: arrMaterial } = apiMaterial?.data;

  const apiKegiatan = await axiosServices('/api/public/kegiatan/list');
  const { rows: arrKegiatan } = apiKegiatan?.data;
  // console.log(arrKegiatan);

  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Textract client
    const textract = new TextractClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: buffer },
      FeatureTypes: ['FORMS']
    });

    const response = await textract.send(command);

    let keyValuePairs = extractKeyValuePairs(response.Blocks);
    keyValuePairs = keyValuePairs.sort((a, b) => a.key.localeCompare(b.key));

    console.log('keyValuePairs----', keyValuePairs);
    console.log(JSON.stringify(keyValuePairs, null, 2));

    let result = [];
    let original = keyValuePairs;

    // CHECK BLOCK TANGGAL
    for (const obj of original) {
      const array = ['TANGGAL'];
      if (array.includes(obj.key)) {
        result.push({
          tanggal: moment(obj.value, 'DDMMYY').format('YYYY-MM-DD')
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK ID KARYAWAN
    for (const obj of original) {
      const array = ['ID KARYAWAN'];
      if (array.includes(obj.key)) {
        result.push({
          nik: obj.value
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK EQUIPMENT
    for (const obj of original) {
      const array = ['ID UNIT'];
      if (array.includes(obj.key)) {
        result.push({
          equipment_id: arrEquipemnt.find((item) => item.abbr == obj.value)?.id || ''
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK HM START
    for (const obj of original) {
      const array = ['HM START'];
      if (array.includes(obj.key)) {
        result.push({
          hmstart: obj.value
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK HM FINISH
    for (const obj of original) {
      const array = ['HM FINISH'];
      if (array.includes(obj.key)) {
        result.push({
          hmfinish: obj.value
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK BBM
    for (const obj of original) {
      const array = ['BBM'];
      if (array.includes(obj.key)) {
        result.push({
          bbm: obj.value
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK ACTIVITY BARGING
    for (const obj of original) {
      const array = ['BARGING'];
      if (array.includes(obj.key)) {
        result.push({
          activity: 'barging'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK ACTIVITY MINING
    for (const obj of original) {
      const array = ['MINING'];
      if (array.includes(obj.key)) {
        result.push({
          activity: 'mining'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK ACTIVITY RENTAL
    for (const obj of original) {
      const array = ['RENTAL'];
      if (array.includes(obj.key)) {
        result.push({
          activity: 'rental'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK LONGSHIFT
    for (const obj of original) {
      const array = ['LS0', 'LSO'];
      if (array.includes(obj.key)) {
        result.push({
          overtime: 'ls0'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK LONGSHIFT
    for (const obj of original) {
      const array = ['LS1', 'LSI'];
      if (array.includes(obj.key)) {
        result.push({
          overtime: 'ls1'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK LONGSHIFT
    for (const obj of original) {
      const array = ['LS2', 'LSS', 'LS5'];
      if (array.includes(obj.key)) {
        result.push({
          overtime: 'ls2'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK PENYEWA
    for (const obj of original) {
      const array = ['MPR', 'M PR', 'MP R'];
      if (array.includes(obj.key)) {
        result.push({
          penyewa_id: arrPenyewa.find((item) => item.abbr == 'MPR').id,
          penyewa: 'MPR',
          value: 'selected'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK PENYEWA
    for (const obj of original) {
      const array = ['IMN', 'I MN', 'IM N'];
      if (array.includes(obj.key)) {
        result.push({
          penyewa_id: arrPenyewa.find((item) => item.abbr == 'IMN').id,
          penyewa: 'IMN',
          value: 'selected'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK PENYEWA
    for (const obj of original) {
      const array = ['ALJ', 'A LJ', 'AL J'];
      if (array.includes(obj.key)) {
        result.push({
          penyewa_id: arrPenyewa.find((item) => item.abbr == 'ALJ').id,
          penyewa: 'ALJ',
          value: 'selected'
        });
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // CHECK BLOCK LOKASI
    const incomingLokasi = new Set(original.map((item) => item.key));
    const arrayLokasi = [
      { key: '2A3', value: '', abbr: ['2A3'] },
      { key: '2A4', value: '', abbr: ['2A4'] },
      { key: '2C1', value: '', abbr: ['2C1'] },
      { key: 'ECHO', value: '', abbr: ['ECHO'] },
      { key: 'C ITA', value: '', abbr: ['C ITA'] },
      { key: 'E ITA', value: '', abbr: ['E ITA'] },
      { key: 'MHR', value: '', abbr: ['MHR'] },
      { key: 'WS', value: '', abbr: ['WS'] },
      { key: 'SLAG', value: '', abbr: ['SLAG'] },
      { key: 'CRUSHER', value: '', abbr: ['CRUSHER'] },
      { key: 'DOMATO', value: '', abbr: ['DOMATO'] },
      { key: '#A', value: '', abbr: ['#A'] },
      { key: '#A2', value: '', abbr: ['#A2'] },
      { key: '#B', value: '', abbr: ['#B', '#8'] },
      { key: '#B2', value: '', abbr: ['#B2', '#82'] },
      { key: '#B3', value: '', abbr: ['#B3', '#83'] },
      { key: '#C', value: '', abbr: ['#C'] },
      { key: '#C1', value: '', abbr: ['#C1'] },
      { key: '#C2', value: '', abbr: ['#C2'] },
      { key: '#C3', value: '', abbr: ['#C3'] },
      { key: '#C4', value: '', abbr: ['#C4'] },
      { key: '#C5', value: '', abbr: ['#C5'] },
      { key: '#C6', value: '', abbr: ['#C6'] },
      { key: '#D', value: '', abbr: ['#D'] },
      { key: 'F NOVI', value: '', abbr: ['F NOVI'] },
      { key: 'FEBRI', value: '', abbr: ['FEBRI'] },
      { key: 'JENY1', value: '', abbr: ['JENY1'] },
      { key: 'JENY2', value: '', abbr: ['JENY2'] },
      { key: 'OKTO', value: '', abbr: ['OKTO'] },
      { key: 'SEPHIA', value: '', abbr: ['SEPHIA'] }
    ];

    for (const obj of arrayLokasi) {
      for (const val of incomingLokasi) {
        if (obj.abbr.includes(val)) {
          result.push({
            lokasi_id: arrLokasi.find((item) => item.abbr == obj.key)?.id || '',
            lokasi: obj,
            value: 'selected'
          });
        }
      }
    }

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - A
    const incomingKegiatan1 = new Set(original.map((item) => item.key));
    const arrayKegiatan1 = [
      { key: 'TUNGGU ARAHAN', value: '', abbr: ['TUNGGU ARAHAN'] },
      { key: 'SUPPORT', value: '', abbr: ['SUPPORT'] },
      { key: 'BREAKDOWN', value: '', abbr: ['BREAKDOWN'] },
      { key: 'TRAVEL KE PIT', value: '', abbr: ['TRAVEL KE PIT'] },
      { key: 'TRAVEL KE STP', value: '', abbr: ['TRAVEL KE STP'] },
      { key: 'MOBILISASI KE PIT', value: '', abbr: ['MOBILISASI KE PIT'] },
      { key: 'MOBILISASI KE STP', value: '', abbr: ['MOBILISASI KE STP'] }
    ];

    for (const obj of arrayKegiatan1) {
      for (const val of incomingKegiatan1) {
        if (obj.abbr.includes(val)) {
          var kegiatan_id = arrKegiatan.find((item) => item.level == 'AA' && item.abbr == obj.key?.toLocaleLowerCase())?.id || '';
          result.push({
            kegiatan: [
              {
                ctg: 'A',
                nama: obj.key,
                kegiatan_id: kegiatan_id,
                start: original.find((d) => d.key === `A-START`)?.value,
                finish: original.find((d) => d.key === `A-STOP`)?.value,
                total: original.find((d) => d.key === `A-TOTAL`)?.value
              }
            ]
          });
          original = original.filter((f) => f.key !== val);
          original = original.filter((f) => f.key !== 'A-START');
          original = original.filter((f) => f.key !== 'A-STOP');
          original = original.filter((f) => f.key !== 'A-TOTAL');
        }
      }
    }

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - B
    const incomingKegiatan2 = new Set(original.map((item) => item.key));
    const arrayKegiatan2 = [
      { key: 'B-LAND CLEARING', value: '', abbr: ['B-LAND CLEARING'], material: ['B-OB', 'B-SAPROLITE', 'B-LIMONITE'] },
      { key: 'B-GALIAN OB', value: '', abbr: ['B-GALIAN OB'], material: ['B-OB', 'B-SAPROLITE', 'B-LIMONITE'] },
      { key: 'B-STRIPING', value: '', abbr: ['B-STRIPING'], material: ['B-OB', 'B-SAPROLITE', 'B-LIMONITE'] },
      { key: 'B-ORE GETTING', value: '', abbr: ['B-ORE GETTING'], material: ['B-OB', 'B-SAPROLITE', 'B-LIMONITE'] },
      { key: 'B-ESTAFET', value: '', abbr: ['B-ESTAFET'], material: ['B-OB', 'B-SAPROLITE', 'B-LIMONITE'] },
      { key: 'B-LOADING', value: '', abbr: ['B-LOADING'], material: ['B-OB', 'B-SAPROLITE', 'B-LIMONITE'] },
      { key: 'B-UNLOADING', value: '', abbr: ['B-UNLOADING'], material: ['B-OB', 'B-SAPROLITE', 'B-LIMONITE'] },
      { key: 'B-BREAKER', value: '', abbr: ['B-BREAKER'], material: ['B-OB', 'B-SAPROLITE', 'B-LIMONITE'] }
    ];

    for (const obj of arrayKegiatan2) {
      for (const val of incomingKegiatan2) {
        if (obj.abbr.includes(val)) {
          var kegiatanB = convertValues(obj.key);
          var kegiatan_id = arrKegiatan.find((item) => item.level == 'BC' && item.abbr == kegiatanB?.toLocaleLowerCase())?.id || '';
          // Cari material yang cocok di dalam obj.material
          let materialB = obj.material.find((m) => incomingKegiatan2.has(m)) || '';
          materialB = convertValues(materialB);
          var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialB)?.id || '';
          result.push({
            kegiatan: [
              {
                ctg: 'B',
                nama: obj.key,
                kegiatan_id: kegiatan_id,
                material: materialB,
                material_id: material_id,
                start: original.find((d) => d.key === `B-START`)?.value,
                finish: original.find((d) => d.key === `B-STOP`)?.value,
                total: original.find((d) => d.key === `B-TOTAL`)?.value
              }
            ]
          });
          original = original.filter((f) => f.key !== val);
          original = original.filter((f) => f.key !== materialB);
          original = original.filter((f) => f.key !== 'B-START');
          original = original.filter((f) => f.key !== 'B-STOP');
          original = original.filter((f) => f.key !== 'B-TOTAL');
        }
      }
    }

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - C
    const incomingKegiatan3 = new Set(original.map((item) => item.key));
    const arrayKegiatan3 = [
      { key: 'C-LAND CLEARING', value: '', abbr: ['C-LAND CLEARING'], material: ['C-OB', 'C-SAPROLITE', 'C-LIMONITE'] },
      { key: 'C-GALIAN OB', value: '', abbr: ['C-GALIAN OB'], material: ['C-OB', 'C-SAPROLITE', 'C-LIMONITE'] },
      { key: 'C-STRIPING', value: '', abbr: ['C-STRIPING'], material: ['C-OB', 'C-SAPROLITE', 'C-LIMONITE'] },
      { key: 'C-ORE GETTING', value: '', abbr: ['C-ORE GETTING'], material: ['C-OB', 'C-SAPROLITE', 'C-LIMONITE'] },
      { key: 'C-ESTAFET', value: '', abbr: ['C-ESTAFET'], material: ['C-OB', 'C-SAPROLITE', 'C-LIMONITE'] },
      { key: 'C-LOADING', value: '', abbr: ['C-LOADING'], material: ['C-OB', 'C-SAPROLITE', 'C-LIMONITE'] },
      { key: 'C-UNLOADING', value: '', abbr: ['C-UNLOADING'], material: ['C-OB', 'C-SAPROLITE', 'C-LIMONITE'] },
      { key: 'C-BREAKER', value: '', abbr: ['C-BREAKER'], material: ['C-OB', 'C-SAPROLITE', 'C-LIMONITE'] }
    ];

    for (const obj of arrayKegiatan3) {
      for (const val of incomingKegiatan3) {
        if (obj.abbr.includes(val)) {
          var kegiatanC = convertValues(obj.key);
          var kegiatan_id = arrKegiatan.find((item) => item.level == 'BC' && item.abbr == kegiatanC?.toLocaleLowerCase())?.id || '';
          // Cari material yang cocok di dalam obj.material
          let materialC = obj.material.find((m) => incomingKegiatan3.has(m)) || '';
          materialC = convertValues(materialC);
          var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialC)?.id || '';
          result.push({
            kegiatan: [
              {
                ctg: 'C',
                nama: obj.key,
                kegiatan_id: kegiatan_id,
                material: materialC,
                material_id: material_id,
                start: original.find((d) => d.key === `C-START`)?.value,
                finish: original.find((d) => d.key === `C-STOP`)?.value,
                total: original.find((d) => d.key === `C-TOTAL`)?.value
              }
            ]
          });
          original = original.filter((f) => f.key !== val);
          original = original.filter((f) => f.key !== materialC);
          original = original.filter((f) => f.key !== 'C-START');
          original = original.filter((f) => f.key !== 'C-STOP');
          original = original.filter((f) => f.key !== 'C-TOTAL');
        }
      }
    }

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - D
    const incomingKegiatan4 = new Set(original.map((item) => item.key));
    const arrayKegiatan4 = [
      {
        key: 'D-LOADING',
        value: '',
        abbr: ['D-LOADING'],
        material: ['D-QUARRY', 'D-DOMATO', 'D-TAILING', 'D-BATU KAPUR', 'D-LUMPUR', 'D-KAYU', 'D-BAN']
      },
      {
        key: 'D-LOADING POINT',
        value: '',
        abbr: ['D-LOADING POINT'],
        material: ['D-QUARRY', 'D-DOMATO', 'D-TAILING', 'D-BATU KAPUR', 'D-LUMPUR', 'D-KAYU', 'D-BAN']
      },
      {
        key: 'D-JALAN PIT',
        value: '',
        abbr: ['D-JALAN PIT'],
        material: ['D-QUARRY', 'D-DOMATO', 'D-TAILING', 'D-BATU KAPUR', 'D-LUMPUR', 'D-KAYU', 'D-BAN']
      },
      {
        key: 'D-TANGGUL',
        value: '',
        abbr: ['D-TANGGUL'],
        material: ['D-QUARRY', 'D-DOMATO', 'D-TAILING', 'D-BATU KAPUR', 'D-LUMPUR', 'D-KAYU', 'D-BAN']
      },
      {
        key: 'D-CHECK DAM',
        value: '',
        abbr: ['D-CHECK DAM'],
        material: ['D-QUARRY', 'D-DOMATO', 'D-TAILING', 'D-BATU KAPUR', 'D-LUMPUR', 'D-KAYU', 'D-BAN']
      },
      {
        key: 'D-AREA DOME',
        value: '',
        abbr: ['D-AREA DOME'],
        material: ['D-QUARRY', 'D-DOMATO', 'D-TAILING', 'D-BATU KAPUR', 'D-LUMPUR', 'D-KAYU', 'D-BAN']
      },
      {
        key: 'D-JALAN STP',
        value: '',
        abbr: ['D-JALAN STP'],
        material: ['D-QUARRY', 'D-DOMATO', 'D-TAILING', 'D-BATU KAPUR', 'D-LUMPUR', 'D-KAYU', 'D-BAN']
      }
    ];

    for (const obj of arrayKegiatan4) {
      for (const val of incomingKegiatan4) {
        if (obj.abbr.includes(val)) {
          var kegiatanD = convertValues(obj.key);
          var kegiatan_id = arrKegiatan.find((item) => item.level == 'DD' && item.abbr == kegiatanD?.toLocaleLowerCase())?.id || '';
          // Cari material yang cocok di dalam obj.material
          let materialD = obj.material.find((m) => incomingKegiatan4.has(m)) || '';
          materialD = convertValues(materialD);
          var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialD)?.id || '';
          result.push({
            kegiatan: [
              {
                ctg: 'D',
                nama: obj.key,
                kegiatan_id: kegiatan_id,
                material: materialD,
                material_id: material_id,
                start: original.find((d) => d.key === `D-START`)?.value,
                finish: original.find((d) => d.key === `D-STOP`)?.value,
                total: original.find((d) => d.key === `D-TOTAL`)?.value
              }
            ]
          });
          original = original.filter((f) => f.key !== val);
          original = original.filter((f) => f.key !== materialD);
          original = original.filter((f) => f.key !== 'D-START');
          original = original.filter((f) => f.key !== 'D-STOP');
          original = original.filter((f) => f.key !== 'D-TOTAL');
        }
      }
    }

    // const resKegiatan4 = arrayKegiatan4.filter((item) => {
    //   return !incomingKegiatan4.has(`${item.key}`);
    // });

    // // CHECK BLOCK MATERIAL - D
    // const incomingMaterial4 = new Set(original.map((item) => item.key));
    // const arrayMaterial4 = [
    //   { key: 'D-QUARRY', value: '' },
    //   { key: 'D-DOMATO', value: '' },
    //   { key: 'D-TAILING', value: '' },
    //   { key: 'D-BATU KAPUR', value: '' },
    //   { key: 'D-LUMPUR', value: '' },
    //   { key: 'D-KAYU', value: '' },
    //   { key: 'D-BAN', value: '' }
    // ];
    // const resMaterial4 = arrayMaterial4.filter((item) => {
    //   return !incomingMaterial4.has(`${item.key}`);
    // });

    // var kegiatanD = convertValues(resKegiatan4[0]?.key);
    // var materialD = convertValues(resMaterial4[0]?.key);
    // var kegiatan_id = arrKegiatan.find((item) => item.level == 'DD' && item.abbr == kegiatanD)?.id || '';
    // var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialD)?.id || '';

    // result.push({
    //   kegiatan: [
    //     {
    //       ctg: 'D',
    //       nama: kegiatanD,
    //       kegiatan_id: kegiatan_id,
    //       material: materialD,
    //       material_id: material_id,
    //       start: original.find((d) => d.key === `D-START`)?.value,
    //       finish: original.find((d) => d.key === `D-STOP`)?.value,
    //       total: original.find((d) => d.key === `D-TOTAL`)?.value
    //     }
    //   ]
    // });
    // original = original.filter((f) => f.key !== resKegiatan4[0]?.key);
    // original = original.filter((f) => f.key !== resMaterial4[0]?.key);
    // original = original.filter((f) => f.key !== 'D-START');
    // original = original.filter((f) => f.key !== 'D-STOP');
    // original = original.filter((f) => f.key !== 'D-TOTAL');

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - E
    const incomingKegiatan5 = new Set(original.map((item) => item.key));
    const arrayKegiatan5 = [
      {
        key: 'E-PENGGALIAN MHR',
        value: '',
        abbr: ['E-PENGGALIAN MHR'],
        material: ['E-QUARRY', 'E-DOMATO', 'E-TAILING', 'E-BATU KAPUR', 'E-LUMPUR', 'E-KAYU', 'E-BAN']
      },
      {
        key: 'E-BREAKER',
        value: '',
        abbr: ['E-BREAKER'],
        material: ['E-QUARRY', 'E-DOMATO', 'E-TAILING', 'E-BATU KAPUR', 'E-LUMPUR', 'E-KAYU', 'E-BAN']
      },
      {
        key: 'E-LOADING',
        value: '',
        abbr: ['E-LOADING'],
        material: ['E-QUARRY', 'E-DOMATO', 'E-TAILING', 'E-BATU KAPUR', 'E-LUMPUR', 'E-KAYU', 'E-BAN']
      },
      {
        key: 'E-UNLOADING',
        value: '',
        abbr: ['E-UNLOADING'],
        material: ['E-QUARRY', 'E-DOMATO', 'E-TAILING', 'E-BATU KAPUR', 'E-LUMPUR', 'E-KAYU', 'E-BAN']
      },
      {
        key: 'E-HAMPAR',
        value: '',
        abbr: ['E-HAMPAR'],
        material: ['E-QUARRY', 'E-DOMATO', 'E-TAILING', 'E-BATU KAPUR', 'E-LUMPUR', 'E-KAYU', 'E-BAN']
      },
      {
        key: 'E-MAINTENANCE MHR',
        value: '',
        abbr: ['E-MAINTENANCE MHR'],
        material: ['E-QUARRY', 'E-DOMATO', 'E-TAILING', 'E-BATU KAPUR', 'E-LUMPUR', 'E-KAYU', 'E-BAN']
      }
    ];

    for (const obj of arrayKegiatan5) {
      for (const val of incomingKegiatan5) {
        if (obj.abbr.includes(val)) {
          var kegiatanE = convertValues(obj.key);
          var kegiatan_id = arrKegiatan.find((item) => item.level == 'EE' && item.abbr == kegiatanE?.toLocaleLowerCase())?.id || '';
          // Cari material yang cocok di dalam obj.material
          let materialE = obj.material.find((m) => incomingKegiatan5.has(m)) || '';
          materialE = convertValues(materialE);
          var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialE)?.id || '';
          result.push({
            kegiatan: [
              {
                ctg: 'E',
                nama: obj.key,
                kegiatan_id: kegiatan_id,
                material: materialE,
                material_id: material_id,
                start: original.find((d) => d.key === `E-START`)?.value,
                finish: original.find((d) => d.key === `E-STOP`)?.value,
                total: original.find((d) => d.key === `E-TOTAL`)?.value
              }
            ]
          });
          original = original.filter((f) => f.key !== val);
          original = original.filter((f) => f.key !== materialE);
          original = original.filter((f) => f.key !== 'E-START');
          original = original.filter((f) => f.key !== 'E-STOP');
          original = original.filter((f) => f.key !== 'E-TOTAL');
        }
      }
    }

    // const resKegiatan5 = arrayKegiatan5.filter((item) => {
    //   return !incomingKegiatan5.has(`${item.key}`);
    // });

    // // CHECK BLOCK MATERIAL - E
    // const incomingMaterial5 = new Set(original.map((item) => item.key));
    // const arrayMaterial5 = [
    //   { key: 'E-QUARRY', value: '' },
    //   { key: 'E-DOMATO', value: '' },
    //   { key: 'E-TAILING', value: '' },
    //   { key: 'E-BATU KAPUR', value: '' },
    //   { key: 'E-LUMPUR', value: '' },
    //   { key: 'E-KAYU', value: '' },
    //   { key: 'E-BAN', value: '' }
    // ];
    // const resMaterial5 = arrayMaterial5.filter((item) => {
    //   return !incomingMaterial5.has(`${item.key}`);
    // });

    // var kegiatanE = convertValues(resKegiatan5[0]?.key);
    // var materialE = convertValues(resMaterial5[0]?.key);
    // var kegiatan_id = arrKegiatan.find((item) => item.level == 'EE' && item.abbr == kegiatanE)?.id || '';
    // var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialE)?.id || '';
    // result.push({
    //   kegiatan: [
    //     {
    //       ctg: 'E',
    //       nama: kegiatanE,
    //       kegiatan_id: kegiatan_id,
    //       material: materialE,
    //       material_id: material_id,
    //       start: original.find((d) => d.key === `E-START`)?.value,
    //       finish: original.find((d) => d.key === `E-STOP`)?.value,
    //       total: original.find((d) => d.key === `E-TOTAL`)?.value
    //     }
    //   ]
    // });
    // original = original.filter((f) => f.key !== resKegiatan5[0]?.key);
    // original = original.filter((f) => f.key !== resMaterial5[0]?.key);
    // original = original.filter((f) => f.key !== 'E-START');
    // original = original.filter((f) => f.key !== 'E-STOP');
    // original = original.filter((f) => f.key !== 'E-TOTAL');

    console.log('ORIGINAL---', original);

    const resData = result.reduce(
      (acc, item) => {
        if (item.kegiatan) {
          // Jika key "kegiatan" ada, gabung semua ke dalam acc.kegiatan
          const newObj = { ...item.kegiatan };
          if (newObj[0].nama && newObj[0].start && newObj[0].finish) {
            acc.kegiatan.push(...item.kegiatan);
          }
        } else {
          // Gabungkan key lainnya ke acc
          Object.assign(acc, item);
        }
        return acc;
      },
      { kegiatan: [] }
    );

    return NextResponse.json({ data: resData });
  } catch (err) {
    console.error('Textract Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function convertValues(teks) {
  if (teks) {
    var value = teks.replace(/[A-E]-|maintenance pit|PENYEWA/g, '')?.toLowerCase();
    return value;
  } else {
    return '';
  }
}

function extractKeyValuePairs(blocks) {
  const keyMap = {};
  const valueMap = {};
  const blockMap = {};

  blocks.forEach((block) => {
    blockMap[block.Id] = block;
    if (block.BlockType === 'KEY_VALUE_SET') {
      if (block.EntityTypes.includes('KEY')) {
        keyMap[block.Id] = block;
      } else {
        valueMap[block.Id] = block;
      }
    }
  });

  const keyValues = [];

  Object.keys(keyMap).forEach((keyBlockId) => {
    const keyBlock = keyMap[keyBlockId];
    const valueBlock = findValueBlock(keyBlock, valueMap);
    const keyText = getText(keyBlock, blockMap);
    const valueText = getText(valueBlock, blockMap);

    if (keyText) {
      keyValues.push({ key: keyText || '', value: valueText });
    }
  });

  return keyValues;
}

function findValueBlock(keyBlock, valueMap) {
  const relationships = keyBlock.Relationships || [];
  for (const rel of relationships) {
    if (rel.Type === 'VALUE') {
      for (const id of rel.Ids) {
        return valueMap[id];
      }
    }
  }
  return null;
}

function getText(block, blockMap) {
  if (!block || !block.Relationships) return '';
  let text = '';
  block.Relationships.forEach((rel) => {
    if (rel.Type === 'CHILD') {
      rel.Ids.forEach((id) => {
        const word = blockMap[id];
        if (word.BlockType === 'WORD') {
          text += word.Text + ' ';
        }
      });
    }
  });
  return text.trim();
}

// const data = [
//   {
//     type: "HE", //Pilihan HE atau DT
//     tanggal: "2025-07-20", //tanggal
//     lokasi: "1", //ID lokasi
//     kegiatan: [
//       {
//         kegiatan_id: "5", //ID Kegiatan
//         start: "07:00", // Waktu mulai
//         finish: "10:00" //Waktu selesai
//       }
//     ]
//   }
// ]
