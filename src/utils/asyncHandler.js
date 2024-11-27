//we can also do this for promise as well.



const asyncHandler = (func) => async(req, res, next) => {
    // here we are taking a function itself in params of the asyncHandler function.
    try {
        await func(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false, 
            message: err.message
        })
    }
}

export{ asyncHandler }