import { Schema, model } from 'mongoose';
import { IOrder, OrderModel } from './order.interface'; 

const itemsItemSchema = new Schema({
  name: { type: String },
  price: { type: Number },
  quantity: { type: Number },
}, { _id: false });

const orderSchema = new Schema<IOrder, OrderModel>({
  customer: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [itemsItemSchema],
  status: { type: String },
  totalAmount: { type: Number },
}, {
  timestamps: true
});

export const Order = model<IOrder, OrderModel>('Order', orderSchema);
