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
