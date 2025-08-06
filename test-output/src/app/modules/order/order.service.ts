import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IOrder, OrderModel } from './order.interface';
import { Order } from './order.model';
import { Types } from 'mongoose';
import { SortOrder } from 'mongoose';


// Query options interface
interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

const createOrder = async (payload: Partial<IOrder>): Promise<IOrder> => {
  try {
    const result = await Order.create(payload);
    if (!result) {
      
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create order');
    }

    // Populate references if any
    await result.populate('customer');
    
    return result;
  } catch (error: any) {
    
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const updateOrder = async (
  id: string,
  payload: Partial<IOrder>,
): Promise<IOrder | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid order ID');
  }

  const isExist = await Order.findById(id);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  try {
    

    const result = await Order.findByIdAndUpdate(
      id, 
      payload, 
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('customer');
    
    return result;
  } catch (error: any) {
    
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const deleteOrder = async (id: string): Promise<IOrder | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid order ID');
  }

  const isExist = await Order.findById(id);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  

  const result = await Order.findByIdAndDelete(id);
  return result;
};

const getOrder = async (id: string): Promise<IOrder | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid order ID');
  }

  const result = await Order.findById(id).populate('customer');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }
  
  return result;
};

const getAllOrders = async (options: QueryOptions = {}): Promise<{
  data: IOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search
  } = options;

  // Build search query
  const searchQuery: any = {};
  if (search) {
    const searchFields = [];
    
    if (searchFields.length > 0) {
      searchQuery.$or = searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build sort object
  const sortObj: { [key: string]: SortOrder } = {};
  sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute queries
  const [data, total] = await Promise.all([
    Order
      .find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(limit).populate('customer')
      .lean(),
    Order.countDocuments(searchQuery)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
};

export const OrderServices = {
  createOrder,
  updateOrder,
  deleteOrder,
  getOrder,
  getAllOrders,
};