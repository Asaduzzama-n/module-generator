import { Model, Types } from 'mongoose';

export interface IImagemodule {
  _id: Types.ObjectId;
  image: string;
}

export type ImagemoduleModel = Model<IImagemodule, {}, {}>;
