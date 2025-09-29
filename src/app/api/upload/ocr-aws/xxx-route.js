import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Inisialisasi client Amazon Textract
    const textract = new TextractClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const command = new DetectDocumentTextCommand({
      Document: { Bytes: buffer }
    });

    const response = await textract.send(command);

    const rawText = response.Blocks?.filter((block) => block.BlockType === 'LINE')
      .map((line) => line.Text)
      .join('\n');

    const myform = extractKeyValuePairs(response.Blocks);
    console.log('---------------***-----------------', myform);

    const jsonData = extractKeyData(rawText);

    // return NextResponse.json({ text: text || '' });

    return NextResponse.json({ text: rawText, data: jsonData });
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

    keyValues.push({ key: keyText, value: valueText });
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

// function extractKeyData(rawText) {
//   const keywords = ['TANGGAL', 'ID UNIT', 'HM START', 'HM FINISH', 'BBM'];
//   const result = {};

//   const lines = rawText.split('\n').map((line) => line.trim()).filter(Boolean);

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     for (const keyword of keywords) {
//       if (line.toLowerCase() === keyword.toLowerCase() && i + 1 < lines.length) {
//         // Ambil nilai di baris berikutnya
//         const key = (keyword.replace(/\s/g, ''))?.toLowerCase()
//         result[key] = lines[i + 1];
//       }

//       // Alternatif jika keyword dan value dalam 1 baris, contoh: "TANGGAL: 090725"
//       const match = line.match(new RegExp(`^${keyword}\\s*[:\\-]?\\s*(.+)$`, 'i'));
//       const key = (keyword.replace(/\s/g, ''))?.toLowerCase()
//       if (match) {
//         result[key] = match[1];
//       }
//     }
//   }

//   return result;
// }

// const data = [
//   { key: 'KOLONODALE', value: '' },
//   { key: 'TIMESHEET ALAT BERAT', value: '' },
//   { key: 'TANGGAL ID UNIT', value: '160725' },
//   { key: 'PEMBUATAN/PERBAIKAN MAINTENANCE STP', value: '' },
//   { key: '2A4 2C1', value: '' },
//   { key: 'E ITA', value: '' },
//   { key: 'MHR', value: '' },
//   { key: 'B-LAND CLEARING', value: '' },
//   { key: 'D-LUMPUR', value: '' },
//   { key: 'B-OB', value: '' },
//   { key: 'TRAVEL KE STP', value: '' },
//   { key: 'C-ORE GETTING', value: '' },
//   { key: 'C-GALIAN OB', value: '' },
//   { key: 'E-MAINTENANCE MHR', value: '' },
//   { key: 'B-STRIPING', value: '' },
//   { key: 'C-BREAKER', value: '' },
//   { key: 'STP', value: '' },
//   { key: 'C-LIMONITE', value: '' },
//   { key: 'BARGING', value: '' },
//   { key: 'C-LAND CLEARING', value: '' },
//   { key: 'MOBILISASI KE STP', value: '' },
//   { key: 'E-BAN', value: '' },
//   { key: 'E-PENGGALIAN MHR', value: '' },
//   { key: 'D-AREA DOME', value: '' },
//   { key: 'C-STRIPING', value: '' },
//   { key: 'RENTAL', value: '' },
//   { key: 'E-QUARRY', value: '' },
//   { key: 'B-GALIAN OB', value: '' },
//   { key: 'D-DOMATO', value: '' },
//   { key: 'C-LOADING', value: '' },
//   { key: 'CRUSHER', value: '' },
//   { key: '2A3', value: '' },
//   { key: 'D-BAN', value: '' },
//   { key: 'E-LUMPUR', value: '' },
//   { key: 'LS2', value: '' },
//   { key: 'C ITA', value: '' },
//   { key: 'TRAVEL KE PIT', value: '' },
//   { key: 'C-OB', value: '' },
//   { key: 'D-JALAN STP', value: '' },
//   { key: 'E-BATU KAPUR', value: '' },
//   { key: 'C-ESTAFET', value: '' },
//   { key: 'E-HAMPAR', value: '' },
//   { key: 'SUPPORT', value: '' },
//   { key: 'B-LIMONITE', value: '' },
//   { key: 'D-QUARRY', value: '' },
//   { key: 'IMN', value: '' },
//   { key: 'E-TAILING', value: '' },
//   { key: 'D-KAYU', value: '' },
//   { key: 'B-BREAKER', value: '' },
//   { key: 'B-SAPROLITE', value: '' },
//   { key: 'MOBILISASI KE PIT', value: '' },
//   { key: 'D-TAILING', value: '' },
//   { key: 'D-CHECK DAM', value: '' },
//   { key: 'DOMATO', value: '' },
//   { key: 'B-ORE GETTING', value: '' },
//   { key: 'WS', value: '' },
//   { key: 'AU', value: '' },
//   { key: 'E-DOMATO', value: '' },
//   { key: 'C-UNLOADING', value: '' },
//   { key: 'B-LOADING', value: '' },
//   { key: 'D-TANGGUL', value: '' },
//   { key: 'D-JALAN PIT', value: '' },
//   { key: 'SLAG', value: '' },
//   { key: 'BREAKDOWN', value: '' },
//   { key: 'B-UNLOADING', value: '' },
//   { key: 'E-BREAKER', value: '' },
//   { key: 'LS1', value: '' },
//   { key: 'D-BATU KAPUR', value: '' },
//   { key: 'E-KAYU', value: '' },
//   { key: 'E-STOP', value: '1900' },
//   { key: 'E-START', value: '1600' },
//   { key: 'D-START', value: '1400' },
//   { key: 'D-TOTAL', value: '0002' },
//   { key: 'B-STOP', value: '1200' },
//   { key: 'C-START', value: '1300' },
//   { key: 'A-START', value: '0700' },
//   { key: 'B-START', value: '1000' },
//   { key: 'B-TOTAL', value: '0002' },
//   { key: 'C-TOTAL', value: '0001' },
//   { key: 'OPERATOR', value: '' },
//   { key: 'HM START', value: '10010' },
//   { key: 'HM FINISH', value: '10020' },
//   { key: 'TOTAL', value: '00010' },
//   { key: 'E-TOTAL', value: '0003' },
//   { key: 'D-STOP', value: '1600' },
//   { key: 'A-TOTAL', value: '0003' },
//   { key: 'A-STOP', value: '1000' },
//   { key: 'BBM', value: '400' },
//   { key: 'C-STOP', value: '1400' },
//   { key: 'CATATAN', value: '' },
//   { key: 'MAINTENANCE PIT', value: '' },
//   { key: 'MAINTENANCE MHR', value: '' },
//   { key: 'D-LOADING', value: '' },
//   { key: 'E-LOADING', value: '' },
//   { key: 'LOKASI SEQ', value: '' }
// ];

// const result = [
//   { key: 'TANGGAL ID UNIT', value: '160725', name: 'tanggal', date: '2025-07-16' },
//   { key: 'TANGGAL ID UNIT', value: '160725', name: 'tanggal', date: '2025-07-16' }
// ];

// const resp = [
//   { key: 'KOLONODALE', value: '' },
//   { key: 'TIMESHEET ALAT BERAT', value: '' },
//   { key: 'TANGGAL ID UNIT', value: '160725' },
//   { key: 'PEMBUATAN/PERBAIKAN MAINTENANCE STP', value: '' },
//   { key: '2A4 2C1', value: '' },
//   { key: 'E ITA', value: '' },
//   { key: 'MHR', value: '' },
//   { key: 'B-LAND CLEARING', value: '' },
//   { key: 'D-LUMPUR', value: '' },
//   { key: 'B-OB', value: '' },
//   { key: 'TRAVEL KE STP', value: '' },
//   { key: 'C-ORE GETTING', value: '' },
//   { key: 'C-GALIAN OB', value: '' },
//   { key: 'E-MAINTENANCE MHR', value: '' },
//   { key: 'B-STRIPING', value: '' },
//   { key: 'C-BREAKER', value: '' },
//   { key: 'STP', value: '' },
//   { key: 'C-LIMONITE', value: '' },
//   { key: 'BARGING', value: '' },
//   { key: 'C-LAND CLEARING', value: '' },
//   { key: 'MOBILISASI KE STP', value: '' },
//   { key: 'E-BAN', value: '' },
//   { key: 'E-PENGGALIAN MHR', value: '' },
//   { key: 'D-AREA DOME', value: '' },
//   { key: 'C-STRIPING', value: '' },
//   { key: 'RENTAL', value: '' },
//   { key: 'E-QUARRY', value: '' },
//   { key: 'B-GALIAN OB', value: '' },
//   { key: 'D-DOMATO', value: '' },
//   { key: 'C-LOADING', value: '' },
//   { key: 'CRUSHER', value: '' },
//   { key: '2A3', value: '' },
//   { key: 'D-BAN', value: '' },
//   { key: 'E-LUMPUR', value: '' },
//   { key: 'LS2', value: '' },
//   { key: 'C ITA', value: '' },
//   { key: 'TRAVEL KE PIT', value: '' },
//   { key: 'C-OB', value: '' },
//   { key: 'D-JALAN STP', value: '' },
//   { key: 'E-BATU KAPUR', value: '' },
//   { key: 'C-ESTAFET', value: '' },
//   { key: 'E-HAMPAR', value: '' },
//   { key: 'SUPPORT', value: '' },
//   { key: 'B-LIMONITE', value: '' },
//   { key: 'D-QUARRY', value: '' },
//   { key: 'IMN', value: '' },
//   { key: 'E-TAILING', value: '' },
//   { key: 'D-KAYU', value: '' },
//   { key: 'B-BREAKER', value: '' },
//   { key: 'B-SAPROLITE', value: '' },
//   { key: 'MOBILISASI KE PIT', value: '' },
//   { key: 'D-TAILING', value: '' },
//   { key: 'D-CHECK DAM', value: '' },
//   { key: 'DOMATO', value: '' },
//   { key: 'B-ORE GETTING', value: '' },
//   { key: 'WS', value: '' },
//   { key: 'AU', value: '' },
//   { key: 'E-DOMATO', value: '' },
//   { key: 'C-UNLOADING', value: '' },
//   { key: 'B-LOADING', value: '' },
//   { key: 'D-TANGGUL', value: '' },
//   { key: 'D-JALAN PIT', value: '' },
//   { key: 'SLAG', value: '' },
//   { key: 'BREAKDOWN', value: '' },
//   { key: 'B-UNLOADING', value: '' },
//   { key: 'E-BREAKER', value: '' },
//   { key: 'LS1', value: '' },
//   { key: 'D-BATU KAPUR', value: '' },
//   { key: 'E-KAYU', value: '' },
//   { key: 'E-STOP', value: '1900' },
//   { key: 'E-START', value: '1600' },
//   { key: 'D-START', value: '1400' },
//   { key: 'D-TOTAL', value: '0002' },
//   { key: 'B-STOP', value: '1200' },
//   { key: 'C-START', value: '1300' },
//   { key: 'A-START', value: '0700' },
//   { key: 'B-START', value: '1000' },
//   { key: 'B-TOTAL', value: '0002' },
//   { key: 'C-TOTAL', value: '0001' },
//   { key: 'OPERATOR', value: '' },
//   { key: 'HM START', value: '10010' },
//   { key: 'HM FINISH', value: '10020' },
//   { key: 'TOTAL', value: '00010' },
//   { key: 'E-TOTAL', value: '0003' },
//   { key: 'D-STOP', value: '1600' },
//   { key: 'A-TOTAL', value: '0003' },
//   { key: 'A-STOP', value: '1000' },
//   { key: 'BBM', value: '400' },
//   { key: 'C-STOP', value: '1400' },
//   { key: 'CATATAN', value: '' },
//   { key: 'MAINTENANCE PIT', value: '' },
//   { key: 'MAINTENANCE MHR', value: '' },
//   { key: 'D-LOADING', value: '' },
//   { key: 'E-LOADING', value: '' },
//   { key: 'LOKASI SEQ', value: '' }
// ];
