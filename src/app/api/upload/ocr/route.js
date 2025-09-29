// src/app/api/upload/ocr/route.js
import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { createWorker } from 'tesseract.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increased timeout

export async function POST(req) {
  let worker;
  let tempPath;

  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, or TIFF files are supported' }, { status: 400 });
    }

    // Process file
    const buffer = Buffer.from(await file.arrayBuffer());
    tempPath = path.join('/tmp', `ocr-${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);

    // Create worker with NO logger to avoid serialization issues
    worker = await createWorker({
      logger: () => {} // Empty logger to avoid serialization issues
    });

    // Set worker parameters
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Set page segmentation mode (PSM) for better accuracy
    await worker.setParameters({
      tessedit_pageseg_mode: '6' // Assume uniform block of text
    });

    const { data } = await worker.recognize(tempPath);

    return NextResponse.json({
      text: data.text.trim(),
      confidence: data.confidence || 0
    });
  } catch (error) {
    console.error('OCR Processing Error:', error);
    return NextResponse.json(
      {
        error: 'OCR processing failed',
        message: error.message
      },
      { status: 500 }
    );
  } finally {
    // Cleanup - always run even if there's an error
    if (tempPath) {
      await unlink(tempPath).catch((e) => console.error('Temp file deletion error:', e));
    }
    if (worker) {
      await worker.terminate().catch((e) => console.error('Worker termination error:', e));
    }
  }
}
