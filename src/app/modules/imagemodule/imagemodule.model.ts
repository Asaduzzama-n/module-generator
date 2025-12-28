import { Schema, model } from 'mongoose';
import { IImagemodule, ImagemoduleModel } from './imagemodule.interface'; 

const imagemoduleSchema = new Schema<IImagemodule, ImagemoduleModel>({
  image: { type: String },
}, {
  timestamps: true
});

export const Imagemodule = model<IImagemodule, ImagemoduleModel>('Imagemodule', imagemoduleSchema);
