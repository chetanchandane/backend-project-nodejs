import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.models.js";
import { Like } from "../models/Like.models.js";
import { Comment } from "../models/comment.models.js";
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    
    //TODO: get all videos based on query, sort, pagination
    //1. validate or default values: 
        //validate inputs like page, limit, sortType, 
        //provide default values if none are provided
     //2.build query
     //3. sort the results and then pagination
     //4.  only show output, with limit specified
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pipeline = []
    if(query) {
        pipeline.push({
            $search: {
                index: "search-videos", 
                text: {
                    query: query, 
                    path: ["title", "description"]
                }
            }
        });
    }
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid userId");
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });

    }
    pipeline.push({$match: {isPublished: true}});

    //sortBy - views, createdAt, duration
    //sortType - asc or desc

    if(sortBy && sortType){
        pipeline.push({
            $sort: { 
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    }else{
        pipeline.push({ $sort: { createdAt: -1}});
    }
    pipeline.push({
        $lookup: {
            from: "users", 
            localField: "owner", 
            foreignField: "_id", 
            as: "ownerDetails", 
            pipeline: [{
                $project: {
                    username: 1,
                    "avatar.url": 1
                }}
            ]
        }
    }, 
    {
        $unwind: "$ownerDetails"
    })

    const videoAggregate = Video.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }
    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
    .status(200)
    .json( new ApiResponse(200, video,  "Successfully fetched videos."))
})

const publishAVideo = asyncHandler(async (req, res) => {
    
    // TODO: get video, upload to cloudinary, create video
    const { title, description} = req.body
    if([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields are required to publish a video.")
    }
    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!videoFileLocalPath ){
        throw new ApiError(400, "videoFileLocalPath is required.")
    }
    if(!thumbnailLocalPath ){
        throw new ApiError(400, "thumbnailLocalPath is required.")
    }
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile ){
        throw new ApiError(400, "videoFile not found.")
    }
    if(!thumbnail ){
        throw new ApiError(400, "thumbnail not found.")
    }
    const video = await Video.create({
        title, 
        description,
        duration: videoFile.duration, 
        videoFile: {
            url: videoFile.url, 
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        owner: req.user?._id,
        isPublished: false
    })
    
    const videoUpload = await Video.findById(video._id)

    if(!videoUpload ){
        throw new ApiError(500, "videoUpload has failed..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "video published successfully.")
    )
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // let userId = req.body;
    
    // userId = new mongoose.Types.ObjectId(userId)
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid userId");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
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
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);

    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }

    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video-ID, tp update the video");
    }

    if(!(title && description)){
        throw new ApiError(400, "Title and Description is required.");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400, "Video does not exist.")
    }
    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Owner conflict, you can't edit this Video.");
    }

    //thumbnail - delete old and update new
    const thumbnailToDelete = video.thumbnail.public_id;
    const thumbnailLocalPath = req.file?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Video Thumbnail required in order to update the video.")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail){
        throw new ApiError(500, "Thumbail could not be uploaded to cloudinary.")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId, {
            $set: {
                title, 
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                }
            }
        }, {new: true}
    );

    if(!updatedVideo){
        throw new ApiError(500, "Video update failed.")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo,  "Video update successful")
    );
});

//delete a video
const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video ID Invalid, cant delete the video.")
    }
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Missing, Can't delete video.")
    }

    if(!(video?.owner.toString() === req.user?._id.toString())){
        throw new ApiError(400, "Owner Conflict! you dont own this video, can't delete.")
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id)
    
    if(!videoDeleted){
        throw new ApiError(500, "Failed, Video deletion failed.")
    }

    await Like.deleteMany({
        video: videoId
    })

    await Comment.deleteMany({
        video: videoId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video Delete Successful!")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    }

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
});
//
export {
    publishAVideo,
    updateVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus
};