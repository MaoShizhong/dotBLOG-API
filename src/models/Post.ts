import { Schema, Types, model } from 'mongoose';

export const categories = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Other'] as const;

export type Category = (typeof categories)[number];

export type PostModel = {
    _id?: Types.ObjectId;
    author: Types.ObjectId;
    title: string;
    timestamp: Date;
    category: Category;
    text: string;
    comments: Types.ObjectId[];
    isPublished: boolean;
    isFeatured: boolean;
    url?: string;
    clientURL?: string;
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
        text: { type: String, required: true },
        comments: [{ type: Schema.Types.ObjectId, ref: 'comment' }],
        isPublished: { type: Boolean, default: false, required: true },
        isFeatured: { type: Boolean, default: false, required: true },
    },
    { toJSON: { virtuals: true }, versionKey: false }
);

PostSchema.virtual('url').get(function (): string {
    return `/posts/${this._id}`;
});

PostSchema.virtual('clientURL').get(function (): string {
    const titleInURL = this.title.toLowerCase().replaceAll(' ', '-');
    const categoryInURL = this.category.toLowerCase();

    return `/${categoryInURL}/${titleInURL}`;
});

export const Post = model('post', PostSchema);
