import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    
    if(!content){
        throw new ApiError(400, "Tweet cannot be empty!, content is required.");
    }
    
    const tweet = await Tweet.create({
        content, 
        owner: req.user?._id
    })
    
    if(!tweet){
        throw new ApiError(500, "Tweet creation failed!");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet created successfully!")
    );

});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body;
    const { tweetId } = req.params;

    if(!content){
        throw new ApiError(400, "Content is required in order to update Tweet.");
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid TweetId!");
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet does not exist.");
    }
    if(tweet?.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(500, "You can not update this tweet, ownership conflict!");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, 
        {
            $set: {
            content,
        }
    }, 
        {new: true}
    );

    if(!updatedTweet){
        throw new ApiError(500, "Failed to update Tweet, please try again.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully!!")
    );
});


const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId } = req.params;
    
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user-Id.");
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(userId)
            }, 
        }, 
        {
            $lookup: {
                from: "users", 
                localField: "owner", 
                foreignField: "_id", 
                as : "ownerDetails", 
                pipeline: [
                    {
                        $project: {
                            username: 1, 
                            "avatar.url" : 1,
                        },
                    },
                ]
            },
        },
        {
            $lookup: {
                from: "likes", 
                localField: "_id", 
                foreignField: "tweet", 
                as: "likeDetails", 
                pipeline: [
                    {
                        $project: {
                            likedBy: 1,
                        },
                    },
                ]
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size : "$likeDetails",
                }, 
                ownerDetails: {
                    $first : "$ownerDetails",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false,
                    }
                }
            },
        },
        {
            $sort: {
                createdAt: -1
            }
        }, 
        {
            $project: {
                content : 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1,
            },
        },
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "Tweets fetched successfully!")
    );
});



const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet-Id.");
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet){
        throw new ApiError(404, "Tweet not found.");
    }
    if(tweet?.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Can not delete this tweet, ownership conflict!");
    }

    await Tweet.findByIdAndDelete(tweetId);
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet Deleted Successfully!")
    );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}