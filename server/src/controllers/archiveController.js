const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getArchives = async (req, res) => {
  try {
    const archives = await prisma.weeklyReport.findMany({
      orderBy: {
        weekEndDate: 'desc',
      },
      take: 10,
    });
    
    res.json(archives);
  } catch (error) {
    console.error('Error fetching archives:', error);
    res.status(500).json({ error: 'Failed to fetch archives' });
  }
};
