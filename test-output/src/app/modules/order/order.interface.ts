import { Model, Types } from 'mongoose';

export interface ItemsItem {
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  items: ItemsItem[];
  status: string;
  totalAmount: number;
}

export type OrderModel = Model<IOrder, {}, {}>;
