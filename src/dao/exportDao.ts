import { executeWithRetry } from "../lib/db";
import ExportModel from "../models/Export";
import { IExport } from "../types/export";

export const createExport = async (exportData: IExport) => {
  try {
    return await executeWithRetry(async () => {
      const newExport = new ExportModel(exportData);
      await newExport.save();
      return newExport;
    });
  } catch (error) {
    console.error("Error while creating export: ", error);
    throw error;
  }
}

export const updateExport = async (id: string, updateData: Partial<IExport>) => {
  try {
    return await executeWithRetry(async () => {
      return await ExportModel.findByIdAndUpdate(id, updateData);
    });
  } catch (error) {
    console.error("Error while updating export: ", error);
    throw error;
  }
}

export const getExportById = async (id: string) => {
  try {
    return await executeWithRetry(async () => {
      return await ExportModel.findById(id);
    });
  } catch (error) {
    console.error("Error while fetching export: ", error);
    throw error;
  }
}

export const getExportsByVideoId = async (videoId: string): Promise<string[]> => {
  try {
    return await executeWithRetry(async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const exports = await ExportModel.find({ 
        videoId,
        status: 'completed',
        downloadUrl: { $exists: true, $ne: null },
        createdAt: { $gte: sevenDaysAgo }
      })
      .select('downloadUrl')
      .sort({ createdAt: -1 })
      .limit(10);
      
      return exports.map(exportDoc => exportDoc.downloadUrl).filter(Boolean);
    });
  } catch (error) {
    console.error("Error while fetching exports by videoId: ", error);
    throw error;
  }
}
