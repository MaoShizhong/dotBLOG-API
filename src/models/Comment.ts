import { Schema, Types, model } from 'mongoose';

export type CommentModel = {
    _id?: Types.ObjectId;
    commenter: Types.ObjectId;
    post: Types.ObjectId;
    timestamp: Date;
    lastEdited?: Date;
    text: string;
    replies: Types.ObjectId[];
};

const CommentSchema = new Schema<CommentModel>(
    {
        commenter: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        post: { type: Schema.Types.ObjectId, ref: 'post', required: true },
        timestamp: { type: Date, required: true },
        lastEdited: { type: Date, default: undefined },
        text: { type: String, required: true },
        replies: [{ type: Schema.Types.ObjectId, rel: 'Comment' }],
    },
    { versionKey: false }
);

export const Comment = model<CommentModel>('comment', CommentSchema);
