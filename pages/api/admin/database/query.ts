import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    const { table, limit = '50', offset = '0', search = '' } = req.query;

    if (!table || typeof table !== 'string') {
      return res.status(400).json({ error: "Table name is required" });
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const searchTerm = search as string;

    // First, get column information for the table
    const columnInfo: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = ${table}
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    if (columnInfo.length === 0) {
      return res.status(404).json({ error: "Table not found" });
    }

    const columns = columnInfo.map(col => col.column_name);
    
    // Build dynamic search condition if search term is provided
    let searchCondition = '';
    if (searchTerm) {
      const textColumns = columnInfo
        .filter(col => 
          col.data_type.includes('text') || 
          col.data_type.includes('varchar') || 
          col.data_type.includes('char')
        )
        .map(col => col.column_name);

      if (textColumns.length > 0) {
        const searchConditions = textColumns.map(col => 
          `"${col}"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`
        ).join(' OR ');
        searchCondition = `WHERE ${searchConditions}`;
      }
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM "${table}" ${searchCondition}`;
    const countResult: any[] = await prisma.$queryRawUnsafe(countQuery);
    const totalCount = parseInt(countResult[0]?.count || '0');

    // Get paginated data
    const dataQuery = `
      SELECT * FROM "${table}" 
      ${searchCondition}
      ORDER BY ${columns.includes('createdAt') ? '"createdAt"' : columns.includes('id') ? '"id"' : `"${columns[0]}"`} DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    
    const data: any[] = await prisma.$queryRawUnsafe(dataQuery);

    return res.status(200).json({
      data,
      columns,
      recordCount: totalCount
    });

  } catch (error) {
    console.error("Error fetching table data:", error);
    return res.status(500).json({ 
      error: "Failed to fetch table data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});