import { Schema, Types, model } from 'mongoose';

export type CommentModel = {
    _id?: Types.ObjectId;
    commenter: Types.ObjectId;
    post: Types.ObjectId;
    timestamp: Date;
    text: string;
    replies: Types.ObjectId[];
    deleted: boolean;
};

const CommentSchema = new Schema<CommentModel>(
    {
        commenter: { type: Schema.Types.ObjectId, ref: 'user' },
        post: { type: Schema.Types.ObjectId, ref: 'post', required: true },
        timestamp: { type: Date, required: true },
        text: { type: String, required: true },
        replies: [{ type: Schema.Types.ObjectId, rel: 'Comment' }],
        deleted: { type: Boolean, default: false, required: true },
    },
    { versionKey: false }
);

export const Comment = model<CommentModel>('comment', CommentSchema);
