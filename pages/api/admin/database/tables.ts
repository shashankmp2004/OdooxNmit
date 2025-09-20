import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  try {
    // Use Prisma's $queryRaw to get all table names from the database
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    // Get record counts for all tables dynamically
    const tablesInfo = await Promise.all(
      tables.map(async (table) => {
        const tableName = table.table_name;
        
        try {
          // Try to get count for each table using $queryRawUnsafe for dynamic table names
          const countResult: any[] = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          
          return {
            tableName,
            recordCount: parseInt(countResult[0]?.count || '0')
          };
        } catch (error) {
          console.warn(`Could not get count for table ${tableName}:`, error);
          return {
            tableName,
            recordCount: 0
          };
        }
      })
    );

    // Filter out system tables and sort by table name
    const filteredTables = tablesInfo
      .filter(table => 
        !table.tableName.startsWith('_') && // Filter out Prisma migration tables
        !table.tableName.includes('session') && // Filter out auth tables if needed
        table.tableName !== 'VerificationToken' &&
        table.tableName !== 'Account'
      )
      .sort((a, b) => a.tableName.localeCompare(b.tableName));

    return res.status(200).json(filteredTables);
  } catch (error) {
    console.error("Error fetching tables info:", error);
    return res.status(500).json({ error: "Failed to fetch database information" });
  }
});