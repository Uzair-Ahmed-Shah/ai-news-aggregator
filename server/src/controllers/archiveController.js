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

exports.getArchiveById = async (req, res) => {
  try {
    const { id } = req.params;
    const archive = await prisma.weeklyReport.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!archive) {
      return res.status(404).json({ error: 'Archive not found' });
    }
    
    res.json(archive);
  } catch (error) {
    console.error('Error fetching archive:', error);
    res.status(500).json({ error: 'Failed to fetch archive detail' });
  }
};
