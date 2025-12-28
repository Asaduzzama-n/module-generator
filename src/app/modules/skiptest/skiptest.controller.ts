import { Request, Response } from 'express';
import { SkiptestServices } from './skiptest.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { skiptestFilterables } from './skiptest.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createSkiptest = catchAsync(async (req: Request, res: Response) => {
  const skiptestData = req.body;

  const result = await SkiptestServices.createSkiptest(
    req.user!,
    skiptestData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Skiptest created successfully',
    data: result,
  });
});

const updateSkiptest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const skiptestData = req.body;

  const result = await SkiptestServices.updateSkiptest(id, skiptestData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Skiptest updated successfully',
    data: result,
  });
});

const getSingleSkiptest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SkiptestServices.getSingleSkiptest(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Skiptest retrieved successfully',
    data: result,
  });
});

const getAllSkiptests = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, skiptestFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await SkiptestServices.getAllSkiptests(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Skiptests retrieved successfully',
    data: result,
  });
});

const deleteSkiptest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SkiptestServices.deleteSkiptest(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Skiptest deleted successfully',
    data: result,
  });
});

export const SkiptestController = {
  createSkiptest,
  updateSkiptest,
  getSingleSkiptest,
  getAllSkiptests,
  deleteSkiptest,
};