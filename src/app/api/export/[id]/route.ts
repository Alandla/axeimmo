import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { IExport } from '@/src/types/export';
import { getExportById } from '@/src/dao/exportDao';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("GET /api/export/id by user: ", session.user.id);

    const exportData: IExport | null = await getExportById(params.id);

    if (!exportData) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }

    return NextResponse.json({ data: exportData });
  } catch (error) {
    console.error("error fetching export", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
