import { Schema, Types, model } from 'mongoose';

type CommentModel = {
    _id: Types.ObjectId;
    commenter: Types.ObjectId;
    timestamp: Date;
    text: string[];
};

const CommentSchema = new Schema<CommentModel>(
    {
        commenter: { type: Schema.Types.ObjectId, rel: 'Reader', required: true },
        timestamp: { type: Date, required: true },
        text: { type: [String], required: true },
    },
    { versionKey: false }
);

export const Comment = model<CommentModel>('comment', CommentSchema);
