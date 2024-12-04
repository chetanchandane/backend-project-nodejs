import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.models.js";
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
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})
