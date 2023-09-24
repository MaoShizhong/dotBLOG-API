import { Schema, Types, model } from 'mongoose';

export type UserModel = {
    _id?: Types.ObjectId;
    name?: string;
    username: string;
    password: string;
    bookmarks: Types.ObjectId[];
    isAuthor: boolean;
    url: string;
};

const UserSchema = new Schema<UserModel>(
    {
        name: { type: String, default: undefined },
        username: { type: String, unique: true, required: true },
        password: { type: String, required: true },
        bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
        isAuthor: { type: Boolean, default: false, required: true },
    },
    { versionKey: false }
);

UserSchema.virtual('url').get(function (): string {
    return `/users/${this._id}`;
});

export const User = model<UserModel>('user', UserSchema);
