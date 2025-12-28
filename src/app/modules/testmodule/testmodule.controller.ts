import { Request, Response } from 'express';
import { TestmoduleServices } from './testmodule.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { testmoduleFilterables } from './testmodule.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createTestmodule = catchAsync(async (req: Request, res: Response) => {
  const testmoduleData = req.body;

  const result = await TestmoduleServices.createTestmodule(
    req.user!,
    testmoduleData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Testmodule created successfully',
    data: result,
  });
});

const updateTestmodule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const testmoduleData = req.body;

  const result = await TestmoduleServices.updateTestmodule(id, testmoduleData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Testmodule updated successfully',
    data: result,
  });
});

const getSingleTestmodule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TestmoduleServices.getSingleTestmodule(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Testmodule retrieved successfully',
    data: result,
  });
});

const getAllTestmodules = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, testmoduleFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await TestmoduleServices.getAllTestmodules(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Testmodules retrieved successfully',
    data: result,
  });
});

const deleteTestmodule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TestmoduleServices.deleteTestmodule(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Testmodule deleted successfully',
    data: result,
  });
});

export const TestmoduleController = {
  createTestmodule,
  updateTestmodule,
  getSingleTestmodule,
  getAllTestmodules,
  deleteTestmodule,
};