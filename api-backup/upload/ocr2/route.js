// src/app/api/upload/ocr/route.js
import { NextResponse } from 'next/server';
import FormData from 'form-data';
import axios from 'axios';

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('image');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const body = new FormData();
  body.append('file', buffer, file.name);
  body.append('language', 'eng');
  body.append('apikey', process.env.OCR_SPACE_API_KEY);

  try {
    const response = await axios.post('https://api.ocr.space/parse/image', body, {
      headers: body.getHeaders()
    });

    const parsedText = response.data?.ParsedResults?.[0]?.ParsedText;

    if (!parsedText) {
      return NextResponse.json({ error: 'No text found' }, { status: 500 });
    }

    return NextResponse.json({ text: parsedText });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'OCR request failed' }, { status: 500 });
  }
}
