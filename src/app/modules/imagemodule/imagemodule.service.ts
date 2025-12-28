import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IImagemoduleFilterables, IImagemodule } from './imagemodule.interface';
import { Imagemodule } from './imagemodule.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { imagemoduleSearchableFields } from './imagemodule.constants';
import { Types } from 'mongoose';
import removeFile from '../../../helpers/fileHelper';

const createImagemodule = async (
  user: JwtPayload,
  payload: IImagemodule
): Promise<IImagemodule> => {
  try {
    const result = await Imagemodule.create(payload);
    if (!result) {
      await removeFile(payload.images || payload.media);
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Imagemodule, please try again with valid data.'
      );
    }

    return result;
  } catch (error: any) {
    if (payload.images || payload.media) await removeFile(payload.images || payload.media);
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const getAllImagemodules = async (
  user: JwtPayload,
  filterables: IImagemoduleFilterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: imagemoduleSearchableFields.map((field) => ({
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
    Imagemodule
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Imagemodule.countDocuments(whereConditions),
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

const getSingleImagemodule = async (id: string): Promise<IImagemodule> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Imagemodule ID');
  }

  const result = await Imagemodule.findById(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested imagemodule not found, please try again with valid id'
    );
  }

  return result;
};

const updateImagemodule = async (
  id: string,
  payload: Partial<IImagemodule>
): Promise<IImagemodule | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Imagemodule ID');
  }

  const result = await Imagemodule.findByIdAndUpdate(
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
      'Requested imagemodule not found, please try again with valid id'
    );
  }

  return result;
};

const deleteImagemodule = async (id: string): Promise<IImagemodule> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Imagemodule ID');
  }

  const result = await Imagemodule.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting imagemodule, please try again with valid id.'
    );
  }

  // Remove associated files
  if (result.image || result.images || result.media) {
    await removeFile(result.image || result.images || result.media);
  }

  return result;
};

export const ImagemoduleServices = {
  createImagemodule,
  getAllImagemodules,
  getSingleImagemodule,
  updateImagemodule,
  deleteImagemodule,
};