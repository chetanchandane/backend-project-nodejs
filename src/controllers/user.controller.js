import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User }  from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

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

export  { registerUser };