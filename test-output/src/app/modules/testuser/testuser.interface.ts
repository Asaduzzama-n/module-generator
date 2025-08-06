import { Model, Types } from 'mongoose';

export interface ITestuser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  age: number;
  status: string;
}

export type TestuserModel = Model<ITestuser, {}, {}>;
