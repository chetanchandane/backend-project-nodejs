import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {Tweet} from "../models/tweet.models.js"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoId");
    }
    const likedAlready = await Like.findOne({
        video: videoId, 
        likedBy: req.user?._id
    });

    if(likedAlready){
        // unlike the video
        await Like.findByIdAndDelete(likedAlready?._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false},"Unliked Successfully."));
    }

    await Like.create({
        video: videoId, 
        likedBy: req.user?._id
    });
    return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true} ,"Liked Video Successfully!"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID!");
    }

    const commentAlreadyLiked = await Comment.findOne({
        comment: commentId, 
        likedBy: req.user?._id
    });

    if(commentAlreadyLiked){
        // unlike the comment
        await Comment.findByIdAndDelete(commentAlreadyLiked?._id);

        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "Comment Unliked!" ))
    }

    await Comment.create({
        comment: commentId, 
        likedBy: req.user?._id
    });

    return res
    .status(200)
    .json( new ApiResponse(200, {isLiked: true}, "Comment liked Successfully!"));

});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Comment ID!");
    }
    const tweetAlreadyLiked = await Comment.findOne({
        tweet: tweetId, 
        likedBy: req.user?._id
    });

    if(tweetAlreadyLiked){
        // unlike the comment
        await Comment.findByIdAndDelete(tweetAlreadyLiked?._id);

        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "Tweet Unliked!" ))
    }

    await Tweet.create({
        tweet: tweetId, 
        likedBy: req.user?._id
    });

    return res
    .status(200)
    .json( new ApiResponse(200, {isLiked: true}, "Tweet Liked Successfulky"));

});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideosAggregate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos", 
                localField: "video", 
                foreignField: "_id",
                as: "allLikedVideos", 
                pipeline: [
                    {
                        $lookup:{
                            from: "users", 
                            localField: "owner", 
                            foreignField: "_id", 
                            as: "ownerDetails"
                        },
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        }, 
        {
            $unwind: "$allLikedVideos"
        }, 
        {
            $sort: {
                createdAt: -1
            }
        }, 
        {
            $project: {
                _id: 0, 
                allLikedVideos: {
                    _id: 1, 
                    "videoFile.url": 1, 
                    "thumbnail.url": 1, 
                    owner: 1, 
                    title: 1, 
                    description: 1, 
                    views: 1, 
                    duration: 1, 
                    createdAt: 1, 
                    isPublished: 1, 
                    ownerDetails: {
                        username: 1, 
                        fullname: 1, 
                        "avatar.url": 1
                    },
                },
            },
        },
    ]);

    return res
    .status(200)
    .json( new ApiResponse(200, likedVideosAggregate, "Liked Videos fetched Successfully!"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}