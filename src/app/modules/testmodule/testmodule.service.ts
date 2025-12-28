import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ITestmoduleFilterables, ITestmodule } from './testmodule.interface';
import { Testmodule } from './testmodule.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { testmoduleSearchableFields } from './testmodule.constants';
import { Types } from 'mongoose';


const createTestmodule = async (
  user: JwtPayload,
  payload: ITestmodule
): Promise<ITestmodule> => {
  try {
    const result = await Testmodule.create(payload);
    if (!result) {
      
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Testmodule, please try again with valid data.'
      );
    }

    return result;
  } catch (error: any) {
    
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const getAllTestmodules = async (
  user: JwtPayload,
  filterables: ITestmoduleFilterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: testmoduleSearchableFields.map((field) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    });
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {};

  const [result, total] = await Promise.all([
    Testmodule
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Testmodule.countDocuments(whereConditions),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getSingleTestmodule = async (id: string): Promise<ITestmodule> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Testmodule ID');
  }

  const result = await Testmodule.findById(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested testmodule not found, please try again with valid id'
    );
  }

  return result;
};

const updateTestmodule = async (
  id: string,
  payload: Partial<ITestmodule>
): Promise<ITestmodule | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Testmodule ID');
  }

  const result = await Testmodule.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested testmodule not found, please try again with valid id'
    );
  }

  return result;
};

const deleteTestmodule = async (id: string): Promise<ITestmodule> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Testmodule ID');
  }

  const result = await Testmodule.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting testmodule, please try again with valid id.'
    );
  }

  

  return result;
};

export const TestmoduleServices = {
  createTestmodule,
  getAllTestmodules,
  getSingleTestmodule,
  updateTestmodule,
  deleteTestmodule,
};