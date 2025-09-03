import { NextResponse } from 'next/server';
import { listTechniqueMeta } from '@/utils/techniques';

export const dynamic = 'force-static';

export async function GET() {
  const items = listTechniqueMeta();
  return NextResponse.json({ items });
}

