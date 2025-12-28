import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ISkiptestFilterables, ISkiptest } from './skiptest.interface';
import { Skiptest } from './skiptest.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { skiptestSearchableFields } from './skiptest.constants';
import { Types } from 'mongoose';


const createSkiptest = async (
  user: JwtPayload,
  payload: ISkiptest
): Promise<ISkiptest> => {
  try {
    const result = await Skiptest.create(payload);
    if (!result) {
      
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Skiptest, please try again with valid data.'
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

const getAllSkiptests = async (
  user: JwtPayload,
  filterables: ISkiptestFilterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: skiptestSearchableFields.map((field) => ({
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
    Skiptest
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Skiptest.countDocuments(whereConditions),
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

const getSingleSkiptest = async (id: string): Promise<ISkiptest> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Skiptest ID');
  }

  const result = await Skiptest.findById(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested skiptest not found, please try again with valid id'
    );
  }

  return result;
};

const updateSkiptest = async (
  id: string,
  payload: Partial<ISkiptest>
): Promise<ISkiptest | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Skiptest ID');
  }

  const result = await Skiptest.findByIdAndUpdate(
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
      'Requested skiptest not found, please try again with valid id'
    );
  }

  return result;
};

const deleteSkiptest = async (id: string): Promise<ISkiptest> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Skiptest ID');
  }

  const result = await Skiptest.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting skiptest, please try again with valid id.'
    );
  }

  

  return result;
};

export const SkiptestServices = {
  createSkiptest,
  getAllSkiptests,
  getSingleSkiptest,
  updateSkiptest,
  deleteSkiptest,
};