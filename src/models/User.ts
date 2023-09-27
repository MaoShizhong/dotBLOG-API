import { Schema, Types, model } from 'mongoose';

export const colours = [
    '#696869',
    '#0C374D',
    '#196A69',
    '#5C8F4C',
    '#277932',
    '#BD722E',
    '#D4B527',
    '#A83C2E',
    '#9C4E9A',
    '#693E9B',
] as const;

export type Colour = (typeof colours)[number];

export type UserModel = {
    _id: Types.ObjectId;
    name?: string;
    username: string;
    avatar: Colour;
    password: string;
    bookmarks: Types.ObjectId[];
    isAuthor: boolean;
    url: string;
};

const UserSchema = new Schema<UserModel>(
    {
        name: { type: String, default: undefined },
        username: { type: String, unique: true, required: true },
        avatar: {
            type: String,
            required: true,
            enum: colours,
            default: '#696869',
        },
        password: { type: String, required: true },
        bookmarks: [{ type: Schema.Types.ObjectId, ref: 'post' }],
        isAuthor: { type: Boolean, default: false, required: true },
    },
    { versionKey: false }
);

UserSchema.virtual('url').get(function (): string {
    return `/users/${this._id}`;
});

export const User = model<UserModel>('user', UserSchema);
