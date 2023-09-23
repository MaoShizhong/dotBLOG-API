import { Schema, Types, model } from 'mongoose';

export const categories = ['Javascript/Typescript', 'HTML', 'CSS', 'Other'] as const;

export type Category = (typeof categories)[number];

export type PostModel = {
    _id?: Types.ObjectId;
    author: Types.ObjectId;
    title: string;
    timestamp: Date;
    category: Category;
    text: string[];
    isPublished: boolean;
    url?: string;
};

const PostSchema = new Schema<PostModel>(
    {
        author: { type: Schema.Types.Mixed, ref: 'user', required: true },
        title: { type: String, required: true },
        timestamp: { type: Date, required: true },
        category: {
            type: String,
            required: true,
            enum: categories,
            default: 'Other',
        },
        text: { type: [String], required: true },
        isPublished: { type: Boolean, required: true },
    },
    { toJSON: { virtuals: true }, versionKey: false }
);

PostSchema.virtual('url').get(function (): string {
    return `/posts/${this._id}`;
});

export const Post = model('post', PostSchema);
