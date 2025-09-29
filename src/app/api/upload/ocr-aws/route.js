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

    // CHECK BLOCK TANGGAL, EQUIPMENT, HM, BBM
    for (const obj of original) {
      const array = ['TANGGAL', 'ID UNIT', 'HM START', 'HM FINISH', 'TOTAL', 'BBM'];
      if (obj.key === 'TANGGAL ID UNIT') {
        result.push({
          tanggal: obj.value
        });
        original = original.filter((f) => f.key !== 'TANGGAL ID UNIT');
      }
      if (array.includes(obj.key)) {
        if (obj.key == 'TANGGAL') {
          result.push({
            [`${obj.key.toLowerCase()}`]: moment(obj.value, 'DDMMYY').format('YYYY-MM-DD')
          });
        } else if (obj.key == 'ID UNIT') {
          result.push({
            equipment_id: arrEquipemnt.find((item) => item.abbr == obj.value)?.id || ''
          });
        } else {
          const keyNoSpace = obj.key.replace(/\s/g, ''); // Menghilangkan semua spasi
          result.push({
            [`${keyNoSpace.toLowerCase()}`]: obj.value
          });
        }
        original = original.filter((f) => f.key !== obj.key);
      }
    }

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK ACTIVITY
    const incomingOvertime = new Set(original.map((item) => item.key));
    const arrayOvertime = [
      { key: 'LS0', value: '' },
      { key: 'LS1', value: '' },
      { key: 'LS2', value: '' }
    ];

    const resOvertime = arrayOvertime.filter((item) => {
      return !incomingOvertime.has(`${item.key}`);
    });

    var overtime = convertValues(resOvertime[0]?.key);
    result.push({ overtime: overtime, value: 'selected' });
    original = original.filter((f) => f.key !== resOvertime[0]?.key);

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK ACTIVITY
    const incomingActivity = new Set(original.map((item) => item.key));
    const arrayActivity = [
      { key: 'MINING', value: '' },
      { key: 'MINING PENYEWA', value: '' },
      { key: 'BARGING', value: '' },
      { key: 'RENTAL', value: '' }
    ];

    const resActivity = arrayActivity.filter((item) => {
      return !incomingActivity.has(`${item.key}`);
    });

    var activity = convertValues(resActivity[0]?.key);
    result.push({ activity: activity, value: 'selected' });
    original = original.filter((f) => f.key !== resActivity[0]?.key);

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK PENYEWA
    const incomingPenyewa = new Set(original.map((item) => item.key));

    const arrayPenyewa = [
      { key: 'MPR', value: '' },
      { key: 'IMN', value: '' },
      { key: 'ALJ', value: '' }
    ];

    const resPenyewa = arrayPenyewa.filter((item) => {
      const keyNoSpace = item.key.replaceAll(' ', '');
      return !incomingPenyewa.has(`${keyNoSpace}`);
    });
    // console.log('STEP-1.3', resPenyewa)
    result.push({
      penyewa_id: arrPenyewa.find((item) => item.abbr == resPenyewa[0]?.key).id,
      penyewa: resPenyewa[0]?.key,
      value: 'selected'
    });
    original = original.filter((f) => f.key !== resPenyewa[0]?.key);

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK LOKASI
    const incomingLokasi = new Set(original.map((item) => item.key));
    const arrayLokasi = [
      { key: '2A3', value: '' },
      { key: '2A4', value: '' },
      { key: '2C1', value: '' },
      { key: 'ECHO', value: '' },
      { key: 'C ITA', value: '' },
      { key: 'E ITA', value: '' },
      { key: 'MHR', value: '' },
      { key: 'WS', value: '' },
      { key: 'SLAG', value: '' },
      { key: 'CRUSHER', value: '' },
      { key: 'DOMATO', value: '' },
      { key: '#A', value: '' },
      { key: '#A2', value: '' },
      { key: '#B', value: '' },
      { key: '#8', value: '' },
      { key: '#B2', value: '' },
      { key: '#82', value: '' },
      { key: '#83', value: '' },
      { key: '#B3', value: '' },
      { key: '#C', value: '' },
      { key: '#C1', value: '' },
      { key: '#C2', value: '' },
      { key: '#C3', value: '' },
      { key: '#C4', value: '' },
      { key: '#C5', value: '' },
      { key: '#C6', value: '' },
      { key: '#D', value: '' },
      { key: 'F NOVI', value: '' },
      { key: 'FEBRI', value: '' },
      { key: 'JENY1', value: '' },
      { key: 'JENY2', value: '' },
      { key: 'OKTO', value: '' },
      { key: 'SEPHIA', value: '' }
    ];

    const resLokasi = arrayLokasi.filter((item) => {
      return !incomingLokasi.has(`${item.key}`);
    });

    var lokasi = convertValues(resLokasi[0]?.key);
    result.push({
      lokasi_id: arrLokasi.find((item) => item.abbr == resLokasi[0]?.key)?.id || '',
      lokasi: lokasi,
      value: 'selected'
    });
    original = original.filter((f) => f.key !== resLokasi[0]?.key);

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - A
    const incomingKegiatan1 = new Set(original.map((item) => item.key));
    const arrayKegiatan1 = [
      { key: 'TUNGGU ARAHAN', value: '' },
      { key: 'SUPPORT', value: '' },
      { key: 'BREAKDOWN', value: '' },
      { key: 'TRAVEL KE PIT', value: '' },
      { key: 'TRAVEL KE STP', value: '' },
      { key: 'MOBILISASI KE PIT', value: '' },
      { key: 'MOBILISASI KE STP', value: '' }
    ];

    const resKegiatan1 = arrayKegiatan1.filter((item) => {
      return !incomingKegiatan1.has(`${item.key}`);
    });

    var kegiatanA = convertValues(resKegiatan1[0]?.key);
    var kegiatan_id = arrKegiatan.find((item) => item.level == 'AA' && item.abbr == kegiatanA)?.id || '';
    result.push({
      kegiatan: [
        {
          ctg: 'A',
          nama: kegiatanA,
          kegiatan_id: kegiatan_id,
          start: original.find((d) => d.key === `A-START`)?.value,
          finish: original.find((d) => d.key === `A-STOP`)?.value,
          total: original.find((d) => d.key === `A-TOTAL`)?.value
        }
      ]
    });
    original = original.filter((f) => f.key !== resKegiatan1[0]?.key);
    original = original.filter((f) => f.key !== 'A-START');
    original = original.filter((f) => f.key !== 'A-STOP');
    original = original.filter((f) => f.key !== 'A-TOTAL');

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - B
    const incomingKegiatan2 = new Set(original.map((item) => item.key));
    const arrayKegiatan2 = [
      { key: 'B-LAND CLEARING', value: '' },
      { key: 'B-GALIAN OB', value: '' },
      { key: 'B-STRIPING', value: '' },
      { key: 'B-ORE GETTING', value: '' },
      { key: 'B-ESTAFET', value: '' },
      { key: 'B-LOADING', value: '' },
      { key: 'B-UNLOADING', value: '' },
      { key: 'B-BREAKER', value: '' }
    ];

    const resKegiatan2 = arrayKegiatan2.filter((item) => {
      return !incomingKegiatan2.has(`${item.key}`);
    });

    // CHECK BLOCK MATERIAL - B
    const incomingMaterial2 = new Set(original.map((item) => item.key));
    const arrayMaterial2 = [
      { key: 'B-OB', value: '' },
      { key: 'B-SAPROLITE', value: '' },
      { key: 'B-LIMONITE', value: '' }
    ];
    const resMaterial2 = arrayMaterial2.filter((item) => {
      return !incomingMaterial2.has(`${item.key}`);
    });

    var kegiatanB = convertValues(resKegiatan2[0]?.key);
    var materialB = convertValues(resMaterial2[0]?.key);
    var kegiatan_id = arrKegiatan.find((item) => item.level == 'BC' && item.abbr == kegiatanB)?.id || '';
    var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialB)?.id || '';
    result.push({
      kegiatan: [
        {
          ctg: 'B',
          nama: kegiatanB,
          kegiatan_id: kegiatan_id,
          material: materialB,
          material_id: material_id,
          start: original.find((d) => d.key === `B-START`)?.value,
          finish: original.find((d) => d.key === `B-STOP`)?.value,
          total: original.find((d) => d.key === `B-TOTAL`)?.value
        }
      ]
    });
    original = original.filter((f) => f.key !== resKegiatan2[0]?.key);
    original = original.filter((f) => f.key !== resMaterial2[0]?.key);
    original = original.filter((f) => f.key !== 'B-START');
    original = original.filter((f) => f.key !== 'B-STOP');
    original = original.filter((f) => f.key !== 'B-TOTAL');

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - C
    const incomingKegiatan3 = new Set(original.map((item) => item.key));
    const arrayKegiatan3 = [
      { key: 'C-LAND CLEARING', value: '' },
      { key: 'C-GALIAN OB', value: '' },
      { key: 'C-STRIPING', value: '' },
      { key: 'C-ORE GETTING', value: '' },
      { key: 'C-ESTAFET', value: '' },
      { key: 'C-LOADING', value: '' },
      { key: 'C-UNLOADING', value: '' },
      { key: 'C-BREAKER', value: '' }
    ];

    const resKegiatan3 = arrayKegiatan3.filter((item) => {
      return !incomingKegiatan3.has(`${item.key}`);
    });

    // CHECK BLOCK MATERIAL - C
    const incomingMaterial3 = new Set(original.map((item) => item.key));
    const arrayMaterial3 = [
      { key: 'C-OB', value: '' },
      { key: 'C-SAPROLITE', value: '' },
      { key: 'C-LIMONITE', value: '' }
    ];
    const resMaterial3 = arrayMaterial3.filter((item) => {
      return !incomingMaterial3.has(`${item.key}`);
    });

    var kegiatanC = convertValues(resKegiatan3[0]?.key);
    var materialC = convertValues(resMaterial3[0]?.key);
    var kegiatan_id = arrKegiatan.find((item) => item.level == 'BC' && item.abbr == kegiatanC)?.id || '';
    var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialC)?.id || '';
    result.push({
      kegiatan: [
        {
          ctg: 'C',
          nama: kegiatanC,
          kegiatan_id: kegiatan_id,
          material: materialC,
          material_id: material_id,
          start: original.find((d) => d.key === `C-START`)?.value,
          finish: original.find((d) => d.key === `C-STOP`)?.value,
          total: original.find((d) => d.key === `C-TOTAL`)?.value
        }
      ]
    });
    original = original.filter((f) => f.key !== resKegiatan3[0]?.key);
    original = original.filter((f) => f.key !== resMaterial3[0]?.key);
    original = original.filter((f) => f.key !== 'C-START');
    original = original.filter((f) => f.key !== 'C-STOP');
    original = original.filter((f) => f.key !== 'C-TOTAL');

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - D
    const incomingKegiatan4 = new Set(original.map((item) => item.key));
    const arrayKegiatan4 = [
      { key: 'D-LOADING', value: '' },
      { key: 'D-LOADING POINT', value: '' },
      { key: 'D-JALAN PIT', value: '' },
      { key: 'D-TANGGUL', value: '' },
      { key: 'D-CHECK DAM', value: '' },
      { key: 'D-AREA DOME', value: '' },
      { key: 'D-JALAN STP', value: '' }
    ];

    const resKegiatan4 = arrayKegiatan4.filter((item) => {
      return !incomingKegiatan4.has(`${item.key}`);
    });

    // CHECK BLOCK MATERIAL - D
    const incomingMaterial4 = new Set(original.map((item) => item.key));
    const arrayMaterial4 = [
      { key: 'D-QUARRY', value: '' },
      { key: 'D-DOMATO', value: '' },
      { key: 'D-TAILING', value: '' },
      { key: 'D-BATU KAPUR', value: '' },
      { key: 'D-LUMPUR', value: '' },
      { key: 'D-KAYU', value: '' },
      { key: 'D-BAN', value: '' }
    ];
    const resMaterial4 = arrayMaterial4.filter((item) => {
      return !incomingMaterial4.has(`${item.key}`);
    });

    var kegiatanD = convertValues(resKegiatan4[0]?.key);
    var materialD = convertValues(resMaterial4[0]?.key);
    var kegiatan_id = arrKegiatan.find((item) => item.level == 'DD' && item.abbr == kegiatanD)?.id || '';
    var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialD)?.id || '';

    result.push({
      kegiatan: [
        {
          ctg: 'D',
          nama: kegiatanD,
          kegiatan_id: kegiatan_id,
          material: materialD,
          material_id: material_id,
          start: original.find((d) => d.key === `D-START`)?.value,
          finish: original.find((d) => d.key === `D-STOP`)?.value,
          total: original.find((d) => d.key === `D-TOTAL`)?.value
        }
      ]
    });
    original = original.filter((f) => f.key !== resKegiatan4[0]?.key);
    original = original.filter((f) => f.key !== resMaterial4[0]?.key);
    original = original.filter((f) => f.key !== 'D-START');
    original = original.filter((f) => f.key !== 'D-STOP');
    original = original.filter((f) => f.key !== 'D-TOTAL');

    // ---------------------------------------------------------------------------------------------------------------
    // CHECK BLOCK KEGIATAN - E
    const incomingKegiatan5 = new Set(original.map((item) => item.key));
    const arrayKegiatan5 = [
      { key: 'E-PENGGALIAN MHR', value: '' },
      { key: 'E-BREAKER', value: '' },
      { key: 'E-LOADING', value: '' },
      { key: 'E-UNLOADING', value: '' },
      { key: 'E-HAMPAR', value: '' },
      { key: 'E-MAINTENANCE MHR', value: '' }
    ];

    const resKegiatan5 = arrayKegiatan5.filter((item) => {
      return !incomingKegiatan5.has(`${item.key}`);
    });

    // CHECK BLOCK MATERIAL - E
    const incomingMaterial5 = new Set(original.map((item) => item.key));
    const arrayMaterial5 = [
      { key: 'E-QUARRY', value: '' },
      { key: 'E-DOMATO', value: '' },
      { key: 'E-TAILING', value: '' },
      { key: 'E-BATU KAPUR', value: '' },
      { key: 'E-LUMPUR', value: '' },
      { key: 'E-KAYU', value: '' },
      { key: 'E-BAN', value: '' }
    ];
    const resMaterial5 = arrayMaterial5.filter((item) => {
      return !incomingMaterial5.has(`${item.key}`);
    });

    var kegiatanE = convertValues(resKegiatan5[0]?.key);
    var materialE = convertValues(resMaterial5[0]?.key);
    var kegiatan_id = arrKegiatan.find((item) => item.level == 'EE' && item.abbr == kegiatanE)?.id || '';
    var material_id = arrMaterial.find((item) => item.abbr.toLowerCase() == materialE)?.id || '';
    result.push({
      kegiatan: [
        {
          ctg: 'E',
          nama: kegiatanE,
          kegiatan_id: kegiatan_id,
          material: materialE,
          material_id: material_id,
          start: original.find((d) => d.key === `E-START`)?.value,
          finish: original.find((d) => d.key === `E-STOP`)?.value,
          total: original.find((d) => d.key === `E-TOTAL`)?.value
        }
      ]
    });
    original = original.filter((f) => f.key !== resKegiatan5[0]?.key);
    original = original.filter((f) => f.key !== resMaterial5[0]?.key);
    original = original.filter((f) => f.key !== 'E-START');
    original = original.filter((f) => f.key !== 'E-STOP');
    original = original.filter((f) => f.key !== 'E-TOTAL');

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
