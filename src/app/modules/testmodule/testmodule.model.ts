import { Schema, model } from 'mongoose';
import { ITestmodule, TestmoduleModel } from './testmodule.interface'; 

const testmoduleSchema = new Schema<ITestmodule, TestmoduleModel>({
  name: { type: String },
  email: { type: String },
}, {
  timestamps: true
});

export const Testmodule = model<ITestmodule, TestmoduleModel>('Testmodule', testmoduleSchema);
