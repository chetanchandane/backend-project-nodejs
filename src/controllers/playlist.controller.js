import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { application } from "express"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body
    if(!name || !description){
        throw new ApiError(400, "Both Name and Description is required to create a playlist!");
    }

    const playlist = await Playlist.create({
        name, 
        description, 
        owner: req.user?._id
    });
    
    if(!playlist){
        throw new ApiError(500, "Playlist could not be created.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist Created Successfully!")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid UserID!");
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }, 
        {
            $lookup: {
                from: "videos", 
                localField: "videos", 
                foreingField: "_id", 
                as: "videos"
            }
        }, 
        {
            $addField: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $size: "$videos.views"
                }
            }
        }, 
        {
            $project: {
                _id: 1, 
                name: 1, 
                description: 1, 
     