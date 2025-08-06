import { Request, Response, NextFunction } from 'express';
import { OrderServices } from './order.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { paginationFields } from '../../../constants/pagination';

// Filter options for queries
const orderFilterableFields = [];

const createOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const orderData = req.body;
    
    const result = await OrderServices.createOrder(orderData);
    
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Order created successfully',
      data: result,
    });
  },
);

const updateOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const orderData = req.body;
    
    const result = await OrderServices.updateOrder(id, orderData);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Order updated successfully',
      data: result,
    });
  },
);

const deleteOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await OrderServices.deleteOrder(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Order deleted successfully',
      data: result,
    });
  },
);

const getOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await OrderServices.getOrder(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Order retrieved successfully',
      data: result,
    });
  },
);

const getAllOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract pagination and filtering options
    const paginationOptions = pick(req.query, paginationFields);
    const filters = pick(req.query, orderFilterableFields);
    
    // Add search functionality
    const searchOptions = {
      ...paginationOptions,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
    };
    
    const result = await OrderServices.getAllOrders(searchOptions);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Orders retrieved successfully',
      meta: result.pagination,
      data: result.data,
    });
  },
);

export const OrderController = {
  createOrder,
  updateOrder,
  deleteOrder,
  getOrder,
  getAllOrders,
};