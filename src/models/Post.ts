import { Schema, Types, model } from 'mongoose';

export const categories = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Other'] as const;
export const objectFits = ['object-contain', 'object-cover'] as const;

export type ObjectFit = (typeof objectFits)[number];
export type Category = (typeof categories)[number];

export type PostModel = {
    _id?: Types.ObjectId;
    author: Types.ObjectId;
    title: string;
    imageURL?: string;
    imageCredit?: string;
    objectFit: ObjectFit;
    timestamp: Date;
    category: Category;
    text: string;
    commentCount: number;
    isPublished: boolean;
    isFeatured: boolean;
    url?: string;
    clientURL?: string;
};

const PostSchema = new Schema<PostModel>(
    {
        author: { type: Schema.Types.Mixed, ref: 'user', required: true },
        title: { type: String, required: true },
        imageURL: String,
        imageCredit: String,
        objectFit: { type: String, enum: objectFits, default: 'object-contain' },
        timestamp: { type: Date, required: true },
        category: {
            type: String,
            required: true,
            enum: categories,
            default: 'Other',
        },
        text: { type: String, required: true },
        commentCount: { type: Number, default: 0, required: true },
        isPublished: { type: Boolean, default: false, required: true },
        isFeatured: { type: Boolean, default: false, required: true },
    },
    { toJSON: { virtuals: true }, versionKey: false }
);

PostSchema.virtual('url').get(function (): string {
    const titleInURL = this.title
        .toLowerCase()
        .replaceAll(/[^\w\s]/gi, '')
        .replaceAll(/\s+/g, '-');
    const categoryInURL = this.category.toLowerCase();

    return `https://dotblog.netlify.app/${categoryInURL}/${titleInURL}-${this._id}`;
});

PostSchema.virtual('clientURL').get(function (): string {
    const titleInURL = this.title
        .toLowerCase()
        .replaceAll(/[^\w\s]/gi, '')
        .replaceAll(/\s+/g, '-');
    const categoryInURL = this.category.toLowerCase();

    return `/${categoryInURL}/${titleInURL}-${this._id}`;
});

export const Post = model('post', PostSchema);
