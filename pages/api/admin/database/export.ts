import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    const { table } = req.query;

    if (!table || typeof table !== 'string') {
      return res.status(400).json({ error: "Table name is required" });
    }

    // Verify table exists in the database
    const tableCheck: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ${table}
      AND table_type = 'BASE TABLE';
    `;

    if (tableCheck.length === 0) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Get column information to determine order by clause
    const columnInfo: any[] = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${table}
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const columns = columnInfo.map(col => col.column_name);
    const orderByColumn = columns.includes('createdAt') ? 'createdAt' : 
                         columns.includes('created_at') ? 'created_at' : 
                         columns.includes('id') ? 'id' : columns[0];

    // Get all data from the table dynamically
    const data: any[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM "${table}" 
      ORDER BY "${orderByColumn}" DESC
    `);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${table}_export_${new Date().toISOString().split('T')[0]}.json"`);

    return res.status(200).json({
      table: table,
      exportDate: new Date().toISOString(),
      recordCount: data.length,
      data: data
    });

  } catch (error) {
    console.error("Error exporting data:", error);
    return res.status(500).json({ 
      error: "Failed to export data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});