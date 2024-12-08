import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
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

    return re