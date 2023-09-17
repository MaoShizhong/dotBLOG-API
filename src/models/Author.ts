import { Schema, Types, model } from 'mongoose';

type AuthorModel = {
    _id: Types.ObjectId;
    name: string;
};

const AuthorModel = new Schema<AuthorModel>({
    name: { type: String, unique: true, required: true },
});

export const Author = model<AuthorModel>('author', AuthorModel);
