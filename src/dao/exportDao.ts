import connectMongo from "../lib/mongoose";
import ExportModel from "../models/Export";
import { IExport } from "../types/export";

export const createExport = async (exportData: IExport) => {
  await connectMongo();
  try {
    const newExport = new ExportModel(exportData);
    await newExport.save();
    return newExport;
  } catch (error) {
    console.error("Error while creating export: ", error);
    throw error;
  }
}

export const updateExport = async (id: string, updateData: Partial<IExport>) => {
  await connectMongo();
  try {
    await ExportModel.findByIdAndUpdate(id, updateData);
  } catch (error) {
    console.error("Error while updating export: ", error);
    throw error;
  }
}

export const getExportById = async (id: string) => {
  await connectMongo();
  try {
    const exportData = await ExportModel.findById(id);
    return exportData;
  } catch (error) {
    console.error("Error while fetching export: ", error);
    throw error;
  }
}
