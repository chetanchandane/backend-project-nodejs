
import connectDB from './db/index.js' ;
import dotenv from "dotenv"

dotenv.config({
    path: './env'
})


connectDB()
.then( () => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(` Server Listening at PORT: ${process.env.PORT}` )
    })
})
.catch((err) => {
    console.log("MongoDb connection failed!! ", err);
})