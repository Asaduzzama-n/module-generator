import { Request, Response } from 'express';
import { ImagemoduleServices } from './imagemodule.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { imagemoduleFilterables } from './imagemodule.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createImagemodule = catchAsync(async (req: Request, res: Response) => {
  const { images, media, ...imagemoduleData } = req.body;
  
  if (images && images.length > 0) {
    imagemoduleData.images = images;
  }
  
  if (media && media.length > 0) {
    imagemoduleData.media = media;
  }

  const result = await ImagemoduleServices.createImagemodule(
    req.user!,
    imagemoduleData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Imagemodule created successfully',
    data: result,
  });
});

const updateImagemodule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const imagemoduleData = req.body;

  const result = await ImagemoduleServices.updateImagemodule(id, imagemoduleData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Imagemodule updated successfully',
    data: result,
  });
});

const getSingleImagemodule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ImagemoduleServices.getSingleImagemodule(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Imagemodule retrieved successfully',
    data: result,
  });
});

const getAllImagemodules = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, imagemoduleFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await ImagemoduleServices.getAllImagemodules(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Imagemodules retrieved successfully',
    data: result,
  });
});

const deleteImagemodule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ImagemoduleServices.deleteImagemodule(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Imagemodule deleted successfully',
    data: result,
  });
});

export const ImagemoduleController = {
  createImagemodule,
  updateImagemodule,
  getSingleImagemodule,
  getAllImagemodules,
  deleteImagemodule,
};