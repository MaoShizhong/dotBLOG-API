import { Schema, Types, model } from 'mongoose';

type Category = 'javascript' | 'html' | 'css' | 'other';

type PostModel = {
    _id: Types.ObjectId;
    author: Types.ObjectId;
    timestamp: Date;
    category: Category;
    text: string[];
    published: boolean;
    url: string;
};

const PostSchema = new Schema<PostModel>({
    author: { type: Schema.Types.ObjectId, rel: 'Author', required: true },
    timestamp: { type: Date, required: true },
    category: {
        type: String,
        required: true,
        enum: ['javascript', 'html', 'css', 'other'],
        default: 'other',
    },
    text: { type: [String], required: true },
    published: { type: Boolean, required: true },
});

PostSchema.virtual('url').get(function (): string {
    return `/authors/${this._id}`;
});

export const Post = model<PostModel>('post', PostSchema);
