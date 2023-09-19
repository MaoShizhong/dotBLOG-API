import { Schema, Types, model } from 'mongoose';

type ReaderModel = {
    _id?: Types.ObjectId;
    username: string;
    url: string;
};

const ReaderSchema = new Schema<ReaderModel>(
    {
        username: { type: String, unique: true, required: true },
    },
    { versionKey: false }
);

ReaderSchema.virtual('url').get(function (): string {
    return `/users/${this._id}`;
});

export const Reader = model<ReaderModel>('reader', ReaderSchema);
