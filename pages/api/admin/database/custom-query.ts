import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default requireRole(["ADMIN"], async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Query is required" });
    }

    // Basic security check - only allow SELECT statements
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      return res.status(400).json({ error: "Only SELECT queries are allowed" });
    }

    // Prevent potentially dangerous operations
    const forbiddenKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate'];
    const containsForbidden = forbiddenKeywords.some(keyword => 
      trimmedQuery.includes(keyword.toLowerCase())
    );

    if (containsForbidden) {
      return res.status(400).json({ error: "Query contains forbidden operations" });
    }

    // Execute raw SQL query
    const result = await (prisma as any).$queryRawUnsafe(query);

    // Format the response
    const data = Array.isArray(result) ? result : [result];
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return res.status(200).json({
      data,
      columns,
      recordCount: data.length
    });

  } catch (error) {
    console.error("Error executing custom query:", error);
    return res.status(500).json({ 
      error: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});