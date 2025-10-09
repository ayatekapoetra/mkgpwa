import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { NextResponse } from 'next/server';

export async function POST(req) {
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

    const keyValuePairs = extractKeyValuePairs(response.Blocks);
    console.log('keyValuePairs-----', keyValuePairs);

    // Ambil semua key dari incoming
    const incomingKeys = new Set(keyValuePairs.map((item) => item.key));

    // Ambil dari original: yang tidak ada di incoming ATAU yang punya value != ""
    let result = original.filter((item) => {
      return !incomingKeys.has(item.key);
    });

    console.log('result-----', result);

    // BLOCK TANGGAL, HM, BBM, CABANG, TYPE-ALAT
    for (const obj of keyValuePairs) {
      if (obj.value != '') {
        if (obj.key === 'TANGGAL ID UNIT') {
          var formatDate = obj.value.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-20$3');
          result.push({ key: 'tanggal', value: formatDate });
        } else if (obj.key === 'HM START') {
          result.push({ key: 'hmstart', value: parseInt(obj.value) });
        } else if (obj.key === 'HM FINISH') {
          result.push({ key: 'hmfinish', value: parseInt(obj.value) });
        } else if (obj.key === 'TOTAL') {
          result.push({ key: 'total', value: parseInt(obj.value) });
        } else if (obj.key === 'BBM') {
          result.push({ key: 'bbm', value: parseInt(obj.value) });
        } else {
          result.push({ key: obj.key, value: parseInt(obj.value) });
        }
      } else {
        if (obj.key === 'KOLONODALE') {
          result.push({ key: 'cabang', value: 'kolonadale' });
        } else if (obj.key === 'TIMESHEET ALAT BERAT') {
          result.push({ key: 'type', value: 'he' });
        }
      }
    }

    // Fungsi untuk konversi 4-digit waktu ke format HH:MM
    const formatTime = (num) => {
      const str = num.toString().padStart(4, '0');
      return `${str.slice(0, 2)}:${str.slice(2)}`;
    };

    for (const obj of result) {
      const start = result.find((d) => d.key === `A-START`);
      const stop = result.find((d) => d.key === `A-STOP`);
      const total = result.find((d) => d.key === `A-TOTAL`);
      if (['TUNGGU ARAHAN', 'BREAKDOWN'].includes(obj.key)) {
        result.push({
          key: obj.key?.toLowerCase(),
          start: start ? formatTime(start.value) : null,
          stop: stop ? formatTime(stop.value) : null,
          total: total?.value ?? null
        });
      }
    }

    const prefixSet = new Set(['A-', 'B-', 'C-', 'D-', 'E-']);

    const resParsing = keyValuePairs
      .filter((item) => {
        // Ambil hanya key dengan value kosong dan awalan A-/B-/C-/dst
        return item.value === '' && [...prefixSet].some((p) => item.key.startsWith(p));
      })
      .map((item) => {
        const prefix = item.key.split('-')[0]; // Misalnya "B" dari "B-ESTAFET"

        const start = result.find((d) => d.key === `${prefix}-START`);
        const stop = result.find((d) => d.key === `${prefix}-STOP`);
        const total = result.find((d) => d.key === `${prefix}-TOTAL`);

        var keyname = item.key.replace(/[A-E]-|maintenance pit/g, '').toLowerCase();
        return {
          key: keyname,
          value: item.value,
          start: start ? formatTime(start.value) : null,
          stop: stop ? formatTime(stop.value) : null,
          total: total?.value ?? null
        };
      });

    // console.log('response----', result);
    // console.log('resParsing----', [...result, ...resParsing]);

    return NextResponse.json({ data: [...result, ...resParsing] });
    // return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Textract Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
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
      keyValues.push({ key: keyText, value: valueText });
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

const original = [
  {
    key: 'OPERATOR',
    value: ''
  },
  {
    key: 'KOLONODALE',
    value: ''
  },
  {
    key: 'PENGAWAS MTK',
    value: ''
  },
  {
    key: 'PENGAWAS CONT.',
    value: ''
  },
  {
    key: 'TIMESHEET ALAT BERAT',
    value: ''
  },
  {
    key: 'PERBAIKAN MHR',
    value: ''
  },
  {
    key: 'MINING',
    value: ''
  },
  { key: 'AU', value: '' },
  { key: '2A4 2C1', value: '' },
  { key: '2C1', value: '' },
  { key: '2A4', value: '' },
  { key: 'D-LOADING', value: '' },
  {
    key: 'PEMBUATAN/PERBAIKAN MAINTENANCE STP',
    value: ''
  },
  {
    key: 'IMN',
    value: ''
  },
  {
    key: 'E ITA',
    value: ''
  },
  {
    key: 'MHR',
    value: ''
  },
  {
    key: 'B-LAND CLEARING',
    value: ''
  },
  {
    key: 'D-LUMPUR',
    value: ''
  },
  {
    key: 'B-OB',
    value: ''
  },
  {
    key: 'C-GALIAN OB',
    value: ''
  },
  {
    key: 'TRAVEL KE STP',
    value: ''
  },
  {
    key: 'C-ORE GETTING',
    value: ''
  },
  {
    key: 'C-LAND CLEARING',
    value: ''
  },
  {
    key: 'C-LOADING',
    value: ''
  },
  {
    key: 'E-MAINTENANCE MHR',
    value: ''
  },
  {
    key: 'B-STRIPING',
    value: ''
  },
  {
    key: 'B-LIMONITE',
    value: ''
  },
  {
    key: 'STP',
    value: ''
  },
  {
    key: 'C-LIMONITE',
    value: ''
  },
  {
    key: 'MOBILISASI KE STP',
    value: ''
  },
  {
    key: 'E-BAN',
    value: ''
  },
  {
    key: 'E-PENGGALIAN MHR',
    value: ''
  },
  {
    key: 'D-AREA DOME',
    value: ''
  },
  {
    key: 'E-UNLOADING',
    value: ''
  },
  {
    key: 'D-LOADING POINT',
    value: ''
  },
  {
    key: 'E-START',
    value: ''
  },
  {
    key: 'RENTAL',
    value: ''
  },
  {
    key: 'E-QUARRY',
    value: ''
  },

  {
    key: 'TUNGGU ARAHAN',
    value: ''
  },
  {
    key: 'D-DOMATO',
    value: ''
  },
  {
    key: '2A3',
    value: ''
  },
  {
    key: 'CRUSHER',
    value: ''
  },
  {
    key: 'D-KAYU',
    value: ''
  },
  {
    key: 'C-BREAKER',
    value: ''
  },
  {
    key: 'E-LUMPUR',
    value: ''
  },
  {
    key: 'BARGING',
    value: ''
  },
  {
    key: 'ECHO',
    value: ''
  },
  {
    key: 'TRAVEL KE PIT',
    value: ''
  },
  {
    key: 'HM FINISH',
    value: ''
  },
  {
    key: 'C-OB',
    value: ''
  },
  {
    key: 'E-TOTAL',
    value: ''
  },
  {
    key: 'B-GALIAN OB',
    value: ''
  },
  {
    key: 'D-TOTAL',
    value: ''
  },
  {
    key: 'D-JALAN STP',
    value: ''
  },
  {
    key: 'D-CHECK DAM',
    value: ''
  },
  {
    key: 'C-ESTAFET',
    value: ''
  },
  {
    key: 'E-HAMPAR',
    value: ''
  },
  {
    key: 'SUPPORT',
    value: ''
  },
  {
    key: 'LS2',
    value: ''
  },
  {
    key: 'HM START',
    value: ''
  },
  {
    key: 'MPR',
    value: ''
  },
  {
    key: 'D-BAN',
    value: ''
  },
  {
    key: 'C-STRIPING',
    value: ''
  },
  {
    key: 'E-TAILING',
    value: ''
  },
  {
    key: 'B-BREAKER',
    value: ''
  },
  {
    key: 'B-SAPROLITE',
    value: ''
  },
  {
    key: 'MOBILISASI KE PIT',
    value: ''
  },
  {
    key: 'D-TAILING',
    value: ''
  },
  {
    key: 'DOMATO',
    value: ''
  },
  {
    key: 'B-ORE GETTING',
    value: ''
  },
  {
    key: 'WS',
    value: ''
  },
  {
    key: 'E-DOMATO',
    value: ''
  },
  {
    key: 'E-STOP',
    value: ''
  },
  {
    key: 'C-UNLOADING',
    value: ''
  },
  {
    key: 'B-LOADING',
    value: ''
  },
  {
    key: 'D-TANGGUL',
    value: ''
  },
  {
    key: 'D-JALAN PIT',
    value: ''
  },
  {
    key: 'SLAG',
    value: ''
  },
  {
    key: 'BREAKDOWN',
    value: ''
  },
  {
    key: 'D-STOP',
    value: ''
  },
  {
    key: 'ALJ',
    value: ''
  },
  {
    key: 'B-UNLOADING',
    value: ''
  },
  {
    key: 'E-BREAKER',
    value: ''
  },
  {
    key: 'B-ESTAFET',
    value: ''
  },
  {
    key: 'D-QUARRY',
    value: ''
  },
  {
    key: 'C-SAPROLITE',
    value: ''
  },
  {
    key: 'LS1',
    value: ''
  },
  {
    key: 'D-BATU KAPUR',
    value: ''
  },
  {
    key: 'ITA',
    value: ''
  },
  {
    key: 'E-BATU KAPUR',
    value: ''
  },
  {
    key: 'D-START',
    value: ''
  },
  {
    key: 'CATATAN',
    value: ''
  },
  {
    key: 'TOTAL',
    value: ''
  },
  {
    key: 'MAINTENANCE MHR',
    value: ''
  },
  {
    key: 'BBM',
    value: ''
  },
  {
    key: 'TANGGAL',
    value: ''
  },
  {
    key: 'E-LOADING',
    value: ''
  },
  {
    key: 'ID UNIT',
    value: ''
  },
  {
    key: 'E-KAYU',
    value: ''
  },
  {
    key: 'SEQ',
    value: ''
  }
];
