import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ITestuser, TestuserModel } from './testuser.interface';
import { Testuser } from './testuser.model';
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

const createTestuser = async (payload: Partial<ITestuser>): Promise<ITestuser> => {
  try {
    const result = await Testuser.create(payload);
    if (!result) {
      
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create testuser');
    }

    // Populate references if any
    
    
    return result;
  } catch (error: any) {
    
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const updateTestuser = async (
  id: string,
  payload: Partial<ITestuser>,
): Promise<ITestuser | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid testuser ID');
  }

  const isExist = await Testuser.findById(id);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Testuser not found');
  }

  try {
    

    const result = await Testuser.findByIdAndUpdate(
      id, 
      payload, 
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    return result;
  } catch (error: any) {
    
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const deleteTestuser = async (id: string): Promise<ITestuser | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid testuser ID');
  }

  const isExist = await Testuser.findById(id);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Testuser not found');
  }

  

  const result = await Testuser.findByIdAndDelete(id);
  return result;
};

const getTestuser = async (id: string): Promise<ITestuser | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid testuser ID');
  }

  const result = await Testuser.findById(id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Testuser not found');
  }
  
  return result;
};

const getAllTestusers = async (options: QueryOptions = {}): Promise<{
  data: ITestuser[];
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
    const searchFields = ['name', 'email'];
    
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
    Testuser
      .find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Testuser.countDocuments(searchQuery)
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

export const TestuserServices = {
  createTestuser,
  updateTestuser,
  deleteTestuser,
  getTestuser,
  getAllTestusers,
};