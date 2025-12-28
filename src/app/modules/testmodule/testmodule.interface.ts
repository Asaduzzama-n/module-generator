import { Model, Types } from 'mongoose';

export interface ITestmoduleFilterables {
  searchTerm?: string;
  name?: string;
  email?: string;
}

export interface ITestmodule {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

export type TestmoduleModel = Model<ITestmodule, {}, {}>;
