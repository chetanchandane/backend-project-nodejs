//we can also do this for promise as well.

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

// const asyncHandler = (func) => async(req, res, next) => {
//     // here we are taking a function itself in params of the asyncHandler function.
//     try {
//         await func(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false, 
//             message: error.message
//         })
//     }
// }

export { asyncHandler };