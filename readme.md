# A project focused majorly on Backend - Video platform



(Nov-24)
I have stuck to the file structure which is usually followed in a professional setup.
NOv-26
DB Connected, 
Nov-27
created utils to avoid repeating using the wrapper(try-catch) for database connect for now.
created models-user, video, also managed password encryption using bcrypt package.
added custom methods to validate password.
added jwt package(jsonWebToken), and added access and refresh tokens(secret, expiry), also added methods to generate these tokens using 
    jwt.sign() method.
next step is to utilize multer(file upload utility)
workflow will be: file from user -> multer -> local server tempororily -> cloudinary server    

NOTE: Routes, 
in app.js we are using app.use() to declare our routes because since we have our code segregated in different folders, we now need to use middlewares to declare them instead of how we would have normally done( i.e. by using app.get() -> in this case the routes are declare/defined in the same app.js file(or we are not importing it from anywhere else.))