import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User }  from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId) => 
{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh token.")
    }
}

const registerUser = asyncHandler (async (req, res) => {
    /* steps:
    1. Get user details from frontend
    2. validation - not empty, check if user already exist: username or email
    3. we are taking, avatar and cover image, check for both if user is providing
    4. upload them to cloudinary, avatar uploaded or not - check
    5. Create user Object - create entry in db
    6. remove password and refresh token field from response when sending to front-end/user
    7. Check for user creation(if user actually created or not)
    8. return response if user created, and error if user not created
    */

    // step 1
    const { username, fullname, email, password } = req.body
    console.log("email: ", email);

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required!");
    }

    const existeduser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existeduser) {
        throw new ApiError(409, "User with email or usernamen already exists.")
    }

    const avataLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avataLocalPath) {
        throw new ApiError(400, "Avatar file is required.")
    }

    const avatar = await uploadOnCloudinary(avataLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required.")
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url, 
        coverImage: coverImage?.url || "",
        email, 
        password, 
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering the User.")
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully!")
    )

});

const loginUser = asyncHandler (async (req, res) => {
    // get req from body
    // username or email
    // find the user in db, if exist or not
    // check password
    // access and refresh token
    // send these in cookies
    // 

    const {email, username, password} = req.body

    if(!username && !email) {
        throw new ApiError(400, "username or email is required.")
    }
    const user = await User.findOne({
        $or: [{email},{username}]
    })// here we need to add await, or else it will return a promise and the further processing will not happen

    if(!user) {
        throw new ApiError(404, "User does not exist.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials!")
    }

    const {accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true, 
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            }, 
            "User Logged in Successfully!"
        )
    )
})

const logOutUser = asyncHandler(async(req, res) => {
    // req.user._id
    User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: { refreshToken: undefined }
        }, 
            {
                new: true
            }
        
    )

    const options = {
        httpOnly: true, 
        secure: true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User logged Out succesfully!"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised Access!")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token!")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refersh Token is expired or used!")
        }
    
        const options = {
            httpOnly: true, 
            secure: true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", newRefreshToken)
        .json(
            new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, 
                "Access Token Refreshed."
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalide token")
        
    }
})


export  { 
    registerUser, 
    loginUser,
    logOutUser, 
    refreshAccessToken
 };