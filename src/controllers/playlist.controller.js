import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
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
                totalVideos: 1, 
                totalViews: 1, 
                updatedAt: 1,
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, userPlaylists, "Playlist fetched Successfully!"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist does not exist!");
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        }, 
        {
            $lookup : {
                from : "videos", 
                localField: "videos", 
                foreingField: "_id", 
                as: "videos"
            }
        }, 
        {
            $match: {
                "videos.isPublished": true
            }
        }, 
        {
            $lookup: {
                from : "users", 
                localField: "owner",
                foreingField: "_id", 
                as: "owner"
            }
        },
        {
            $addField: {
                totalVideos: {
                    $size : "$videos"
                }, 
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        }, 
        {
            $project: {
                username: 1, 
                description: 1, 
                createdAt: 1, 
                updatedAt: 1, 
                totalVideos: 1, 
                totalViews: 1, 
                videos: {
                    _id: 1, 
                    "videoFile.url": 1, 
                    "thumbnail.url": 1, 
                    title: 1,
                    description: 1, 
                    duration: 1,
                    createdAt: 1, 
                    views: 1
                }, 
                owner: {
                    username: 1, 
                    fullname: 1, 
                    "avatar.url": 1,
                }
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully!!")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    //adding vid to playlist.
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid PlaylistID or VideoID, try again.");
    }
   
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not Found!");
    }
   
    const playlist = await Video.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not Found!");
    }

    if(playlist.owner?.toString() && video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(500, "Only owner of this video can add videos to playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist?._id, 
        {
            $addToSet: { 
                videos: videoId,
            },
        },
        { new: true}
    );

    if(!updatedPlaylist){
        throw new ApiError(500, "Video was not added to playlist, please try again!");
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video Added to playlist Successfully!"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid PlaylistID or VideoID, try again.");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not Found!");
    }
   
    const playlist = await Video.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not Found!");
    }

    if(playlist.owner?.toString() && video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(500, "Only owner of this video can delete videos from playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist?._id, 
        { 
            $pull: {
                videos: videoId,
            },
        },
        { new: true }
    );

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully!."));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID");
    }
    
    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(404, "Playlist does not exist.");
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(500, "Playlist cannot be deleted, Ownership Conflict!");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Playlist was deleted Successfully!")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id!");
    }
    if(!name || !description){
        throw new ApiError(400, "Name and Description are required fields!");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist.");
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(500, "Playlist can not be updated, ownership conflict!");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate( playlist?._id, 
        {
            $set: {
                name, 
                description, 
            }
        }, 
        {new: true}
    );

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed!, could not update playlist, please try again.");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully!")
    );
    
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}