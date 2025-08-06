import { Schema, model } from 'mongoose';
import { ITestuser, TestuserModel } from './testuser.interface'; 

const testuserSchema = new Schema<ITestuser, TestuserModel>({
  name: { type: String }, required: true,
  email: { type: String },
  age: { type: Number },
  status: { type: String },
}, {
  timestamps: true
});

export const Testuser = model<ITestuser, TestuserModel>('Testuser', testuserSchema);
