import mongoose, {isValidObjectId} from "mongoose";
import {Comment} from "../models/comment.models.js";
import {Like} from "../models/like.models.js";
import {Video} from "../models/video.models.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID.")
    }
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found, can't get comments!")
    }

    const commentsOnVideo = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        }, 
        {
            $lookup: {
                from: "users", 
                localField: "owner", 
                foreignField: "_id", 
                as: "owner"
            }
        }, 
        {
            $lookup: {
                from: "likes", 
                localField: "_id", 
                foreignField: "comment", 
                as: "likes"
            }
        }, 
        {
            $addFields: {
                likesCount: {
                    $size : "$likes"
                }, 
                owner: {
                    $first: "$owner"
                }, 
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]}, 
                        then: true, 
                        else: false
                    }
                }
            }
        }, 
        {
            $sort: {
                createdAt: -1
            }
        }, 
        {
            $project: {
                content: 1, 
                createdAt: 1, 
                likesCount: 1, 
                owner: {
                    username: 1, 
                    fullname: 1, 
                    "avatar.url" : 1
                }, 
                isLiked: 1
            }
        }
    ]);

    const options = {
        page : parseInt(page, 10),
        limit : parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(commentsOnVideo, options);

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "Comments fetched Successfully!")
    );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;
    if(!content){
        throw new ApiError(400, "Required! Comment can not be empty.")
    }
    
    const video = await Video.findById(videoId);
    
    if(!video){
        throw new ApiError(404, "Could not find the Video.")
    }

    const comment = await Comment.create({
        content, 
        video: videoId, 
        owner: req.user?._id
    });

    if(!comment){
        throw new ApiError(500, "Failed to create comment, please try again.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment added Succesfully!")
    );

});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {content} = req.body
    const {commentId} = req.params

    if(!content){
        throw new ApiError(400, "Required! Comment can not be empty.");
    };

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Could not find the comment.");
    };

    if(comment?.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Ownership conflict!, you can only your own comments.");
    };

    const updatedComment = await Comment.findByIdAndUpdate( comment?._id, {
        $set: {
            content
        }
    }, {new: true}
    );

    if(!updatedComment){
        throw new ApiError(500, "Could not update Comment, please try again.");
    }

    return res
    .status(200)
    .json(200, updateComment, "Comment updated Successfully!")

});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Could not find the comment, cant delete it.");
    }
    await Comment.findByIdAndDelete(commentId);
    await Like.deleteMany({
        comment: commentId, 
        likedBy: req.user
    });

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment has been deleted successfully.")
    );
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }