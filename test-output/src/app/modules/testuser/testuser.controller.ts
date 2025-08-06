import { Request, Response, NextFunction } from 'express';
import { TestuserServices } from './testuser.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { paginationFields } from '../../../constants/pagination';

// Filter options for queries
const testuserFilterableFields = ['name', 'email'];

const createTestuser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const testuserData = req.body;
    
    const result = await TestuserServices.createTestuser(testuserData);
    
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Testuser created successfully',
      data: result,
    });
  },
);

const updateTestuser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const testuserData = req.body;
    
    const result = await TestuserServices.updateTestuser(id, testuserData);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Testuser updated successfully',
      data: result,
    });
  },
);

const deleteTestuser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await TestuserServices.deleteTestuser(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Testuser deleted successfully',
      data: result,
    });
  },
);

const getTestuser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await TestuserServices.getTestuser(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Testuser retrieved successfully',
      data: result,
    });
  },
);

const getAllTestusers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract pagination and filtering options
    const paginationOptions = pick(req.query, paginationFields);
    const filters = pick(req.query, testuserFilterableFields);
    
    // Add search functionality
    const searchOptions = {
      ...paginationOptions,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
    };
    
    const result = await TestuserServices.getAllTestusers(searchOptions);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Testusers retrieved successfully',
      meta: result.pagination,
      data: result.data,
    });
  },
);

export const TestuserController = {
  createTestuser,
  updateTestuser,
  deleteTestuser,
  getTestuser,
  getAllTestusers,
};