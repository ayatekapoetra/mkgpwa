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

    // console.log('keyValuePairs----', keyValuePairs);
    console.log(JSON.stringify(keyValuePairs, null, 2));

    let objData = {};
    let kegiatan = [];
    let original = keyValuePairs;

    // CHECK BLOCK DATA
    for (const obj of original) {
      if (['TANGGAL'].includes(obj.key)) {
        // var tanggal = obj.value || moment().format('DDMMYY')
        var isValidDate = moment(obj.value, 'DDMMYY', true).isValid();
        if (isValidDate) {
          objData = { ...objData, tanggal: moment(obj.value, 'DDMMYY').format('YYYY-MM-DD') };
        } else {
          objData = { ...objData, tanggal: moment().format('YYYY-MM-DD') };
        }

        original = original.filter((f) => f.key !== 'TANGGAL');
      }

      if (['ID KARYAWAN', 'NO. ID'].includes(obj.key)) {
        objData = { ...objData, driver_id: parseInt(obj.value) || '' };
        original = original.filter((f) => f.key !== 'ID KARYAWAN');
      }

      if (['SHIFT'].includes(obj.key)) {
        objData = { ...objData, shift_id: obj.value };
        original = original.filter((f) => f.key !== 'ID UNIT');
      }

      if (['ID UNIT'].includes(obj.key)) {
        objData = { ...objData, equipment_id: arrEquipemnt.find((item) => item.abbr == obj.value)?.id || '' };
        original = original.filter((f) => f.key !== 'ID UNIT');
      }

      if (['KM START'].includes(obj.key)) {
        try {
          const startValue = /-/.test(obj?.value) ? obj?.value?.replace('-', ',') || 0 : obj.value;
          objData = { ...objData, kmstart: startValue };
          original = original.filter((f) => f.key !== 'KM START');
        } catch (error) {
          console.log(error);
        }
      }

      if (['KM FINISH'].includes(obj.key)) {
        try {
          const startValue = /-/.test(obj?.value) ? obj?.value?.replace('-', ',') || 0 : obj.value;
          objData = { ...objData, kmfinish: startValue };
          original = original.filter((f) => f.key !== 'KM FINISH');
        } catch (error) {
          console.log(error);
        }
      }

      if (['BBM'].includes(obj.key)) {
        objData = { ...objData, bbm: parseFloat(obj.value || 0) };
        original = original.filter((f) => f.key !== 'BBM');
      }
    }

    // BLOCK LONGSHIFT
    const arrayLongShift = ['LS0', 'LS1', 'LS2'];
    const longshiftOriginal = original.map((item) => item.key);
    let [longShift] = arrayLongShift.filter((key) => !longshiftOriginal.includes(key));
    longShift = longShift?.toLocaleLowerCase() || '';
    objData = { ...objData, overtime: longShift };
    original = original.filter((f) => !arrayLongShift.includes(f.key));

    // BLOCK ACTIVITY
    const arrayActivity = ['MINING', 'BARGING', 'RENTAL'];
    const activityOriginal = original.map((item) => item.key);
    let [activity] = arrayActivity.filter((key) => !activityOriginal.includes(key));
    objData = { ...objData, activity: activity?.toLocaleLowerCase() || '' };
    original = original.filter((f) => !arrayActivity.includes(f.key));

    // BLOCK PENYEWA
    const arrayPenyewa = ['MPR', 'IMN', 'ALJ'];
    const penyewaOriginal = original.map((item) => item.key);
    let [penyewa] = arrayPenyewa.filter((key) => !penyewaOriginal.includes(key));

    // objData = { ...objData, penyewa_id: arrPenyewa.find((item) => item.abbr == penyewa).id };
    if (objData.activity == 'mining') {
      objData = {
        ...objData,
        penyewa_id: 48
      };
    } else {
      objData = {
        ...objData,
        penyewa_id: arrPenyewa.find((item) => item.abbr == penyewa).id
      };
    }

    // BLOCK SECTION A
    const ritase_A = original.find((item) => item.key === 'A-RITASE');
    const start_A = original.find((item) => item.key === 'A-START');
    const stop_A = original.find((item) => item.key === 'A-STOP');
    const seq_A = original.find((item) => ['SEQ-A', 'SEQ- A', 'SEQ -A', 'SEQ - A'].includes(item.key));

    const incomingBlockA = original.filter((item) => item.key.startsWith('A-')).map((m) => m.key);

    const arrayLokasiA = ['A-2A3', 'A-2A4', 'A-2C1', 'A-ECHO', 'A-C ITA', 'A-E ITA'];
    let [lokasiA] = arrayLokasiA.filter((key) => !incomingBlockA.includes(key));

    try {
      lokasiA = lokasiA?.replace('A-', '') || null;
      if (lokasiA) {
        const arrayLokasiX = ['A-ETO', 'A-EFO'];
        let [lokasiX] = arrayLokasiX.filter((key) => !incomingBlockA.includes(key));
        lokasiX = lokasiX?.replace('A-', '');

        const arrayMaterialA = ['A-OB', 'A-LIMONITE', 'A-SAPROLITE'];
        let [materialA] = arrayMaterialA.filter((key) => !incomingBlockA.includes(key));
        materialA = materialA.replace('A-', '');

        if (['SAPROLITE', 'LIMONITE'].includes(materialA)) {
          kegiatan.push({
            ctg: 'A',
            nama: 'HAULING ORE',
            kegiatan_id: 30,
            lokasi_id: arrLokasi.find((item) => item.abbr == lokasiA)?.id || '',
            lokasi: lokasiA,
            lokasi_to: arrLokasi.find((item) => item.abbr == lokasiX)?.id || '',
            lokasi_target: lokasiX,
            material_id: arrMaterial.find((item) => item.abbr == materialA)?.id || '',
            material: materialA,
            seq: seq_A?.value || '',
            ritase: ritase_A?.value || 0,
            start: start_A?.value ? moment(start_A.value, 'HHmm').format('HH:mm') : '',
            finish: stop_A?.value ? moment(stop_A.value, 'HHmm').format('HH:mm') : '',
            value: 'selected'
          });
        } else {
          kegiatan.push({
            ctg: 'A',
            nama: 'HAULING OB',
            kegiatan_id: 29,
            lokasi_id: arrLokasi.find((item) => item.abbr == lokasiA)?.id || '',
            lokasi: lokasiA,
            lokasi_to: arrLokasi.find((item) => item.abbr == lokasiX)?.id || '',
            lokasi_target: lokasiX,
            material_id: arrMaterial.find((item) => item.abbr == materialA)?.id || '',
            material: materialA,
            seq: seq_A?.value || '',
            ritase: ritase_A?.value || 0,
            start: start_A?.value ? moment(start_A.value, 'HHmm').format('HH:mm') : '',
            finish: stop_A?.value ? moment(stop_A.value, 'HHmm').format('HH:mm') : '',
            value: 'selected'
          });
        }
        original = original.filter((item) => !item.key.startsWith('A-'));
      }
    } catch (error) {
      console.log(error, 'error line-212');
    }

    // BLOCK SECTION B
    const ritase_B = original.find((item) => item.key === 'B-RITASE');
    const start_B = original.find((item) => item.key === 'B-START');
    const stop_B = original.find((item) => item.key === 'B-STOP');
    const seq_B = original.find((item) => ['SEQ-B', 'SEQ -B'].includes(item.key));
    const incomingBlockB = original.filter((item) => item.key.startsWith('B-')).map((m) => m.key);

    const arrayLokasiB = ['B-2A3', 'B-2A4', 'B-2C1', 'B-ECHO', 'B-C ITA', 'B-E ITA'];
    const arrayMaterialB = ['B-OB', 'B-LIMONITE', 'B-SAPROLITE'];

    let [lokasiB] = arrayLokasiB.filter((key) => !incomingBlockB.includes(key));
    lokasiB = lokasiB?.replace('B-', '') || null;
    if (lokasiB) {
      const arrayLokasiZ = ['B-ETO', 'B-EFO'];
      let [lokasiZ] = arrayLokasiZ.filter((key) => !incomingBlockA.includes(key));
      lokasiZ = lokasiZ.replace('B-', '');

      let [materialB] = arrayMaterialB.filter((key) => !incomingBlockB.includes(key));
      materialB = materialB.replace('B-', '');

      if (['SAPROLITE', 'LIMONITE'].includes(materialB)) {
        kegiatan.push({
          ctg: 'B',
          nama: 'HAULING ORE',
          kegiatan_id: 30,
          lokasi_id: arrLokasi.find((item) => item.abbr == lokasiB)?.id || '',
          lokasi: lokasiB,
          lokasi_to: arrLokasi.find((item) => item.abbr == lokasiZ)?.id || '',
          lokasi_target: lokasiZ,
          material_id: arrMaterial.find((item) => item.abbr == materialB)?.id || '',
          material: materialB,
          seq: seq_B?.value || '',
          ritase: ritase_B?.value || 0,
          start: start_B?.value ? moment(start_B.value, 'HHmm').format('HH:mm') : '',
          finish: stop_B?.value ? moment(stop_B.value, 'HHmm').format('HH:mm') : '',
          value: 'selected'
        });
      } else {
        kegiatan.push({
          ctg: 'B',
          nama: 'HAULING OB',
          kegiatan_id: 29,
          lokasi_id: arrLokasi.find((item) => item.abbr == lokasiB)?.id || '',
          lokasi: lokasiB,
          material_id: arrMaterial.find((item) => item.abbr == materialB)?.id || '',
          lokasi_to: arrLokasi.find((item) => item.abbr == lokasiZ)?.id || '',
          lokasi_target: lokasiZ,
          material: materialB,
          seq: seq_B?.value || '',
          ritase: ritase_B?.value || 0,
          start: start_B?.value ? moment(start_B.value, 'HHmm').format('HH:mm') : '',
          finish: stop_B?.value ? moment(stop_B.value, 'HHmm').format('HH:mm') : '',
          value: 'selected'
        });
      }
      original = original.filter((item) => !item.key.startsWith('B-'));
    }

    // BLOCK SECTION C
    const ritase_C = original.find((item) => item.key === 'C-RITASE');
    const start_C = original.find((item) => item.key === 'C-START');
    const stop_C = original.find((item) => item.key === 'C-STOP');
    const seq_C = original.find((item) => ['SEQ-C', 'SEQ -C', 'SEQ - C'].includes(item.key));

    const incomingBlockC = original.filter((item) => item.key.startsWith('C-')).map((m) => m.key);

    const arrayLokasiC = ['C-WS', 'C-SLAG', 'C-CRUSHER', 'C-DOMATO'];
    const arrayKegiatanC = [
      'C-HAULING',
      'C-AREA MHR',
      'C-TANGGUL',
      'C-CHECK DAM',
      'C-LOADING POINT',
      'C-JALAN PIT',
      'C-AREA DOM',
      'C-JALAN STP'
    ];

    let [lokasiC] = arrayLokasiC.filter((key) => !incomingBlockC.includes(key));
    lokasiC = lokasiC?.replace('C-', '') || null;
    if (lokasiC) {
      const arrayLokasiY = ['C-2A3', 'C-2A4', 'C-2C1', 'C-ECHO', 'C-C ITA', 'C-E ITA', 'C-F ITA', 'C-MHR'];
      let [lokasiY] = arrayLokasiY.filter((key) => !incomingBlockC.includes(key));
      lokasiY = lokasiY?.replace('C-', '');

      const incomingBlockD = original.filter((item) => item.key.startsWith('M-')).map((m) => m.key);
      const arrayMaterialD = ['M-QUARRY', 'M-DOMATO', 'M-TAILING', 'M-BATU KAPUR', 'M-LUMPUR', 'M-KAYU', 'M-BAN'].sort((a, b) =>
        a.localeCompare(b)
      );
      let [materialC] = arrayMaterialD.filter((key) => !incomingBlockD.includes(key));

      materialC = materialC?.replace('M-', '');

      let [kegiatanC] = arrayKegiatanC.filter((key) => !incomingBlockC.includes(key));
      kegiatanC = kegiatanC?.replace('C-', '');
      var { id: kegiatan_id } = arrKegiatan.find((item) => item.level == 'FC' && item.abbr == kegiatanC.toLocaleLowerCase()) || '';

      kegiatan.push({
        ctg: 'C',
        nama: kegiatanC,
        kegiatan_id: kegiatan_id,
        lokasi_id: arrLokasi.find((item) => item.abbr == lokasiC)?.id || '',
        lokasi: lokasiC,
        material_id: arrMaterial.find((item) => item.abbr == materialC)?.id || '',
        lokasi_to: arrLokasi.find((item) => item.abbr == lokasiY)?.id || '',
        lokasi_target: lokasiY,
        material: materialC,
        seq: seq_C?.value || '',
        ritase: ritase_C?.value || 0,
        start: start_C?.value ? moment(start_C.value, 'HHmm').format('HH:mm') : '',
        finish: stop_C?.value ? moment(stop_C.value, 'HHmm').format('HH:mm') : '',
        value: 'selected'
      });
      original = original.filter((item) => !item.key.startsWith('C-'));
      original = original.filter((item) => !item.key.startsWith('D-'));
    }

    objData = { ...objData, kegiatan: kegiatan };

    return NextResponse.json({ data: objData });
  } catch (err) {
    console.error('Textract Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// function convertValues(teks) {
//   if (teks) {
//     var value = teks.replace(/[A-E]-|maintenance pit|PENYEWA/g, '')?.toLowerCase();
//     return value;
//   } else {
//     return '';
//   }
// }

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
