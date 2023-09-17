import { Schema, Types, model } from 'mongoose';

export const categories = ['javascript', 'html', 'css', 'other'] as const;

export type Category = (typeof categories)[number];

export type PostModel = {
    author: Types.ObjectId | string;
    title: string;
    timestamp: Date;
    category: Category;
    text: string[];
    published: boolean;
    url?: string;
};

const PostSchema = new Schema<PostModel>({
    author: { type: Schema.Types.Mixed, rel: 'Author', required: true },
    title: { type: String, required: true },
    timestamp: { type: Date, required: true },
    category: {
        type: String,
        required: true,
        enum: categories,
        default: 'other',
    },
    text: { type: [String], required: true },
    published: { type: Boolean, required: true },
});

PostSchema.virtual('url').get(function (): string {
    return `/authors/${this._id}`;
});

export const Post = model('post', PostSchema);
