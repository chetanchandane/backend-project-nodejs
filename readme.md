
# WebApp Clone - Backend

This is the backend of a web application, providing essential features such as user authentication, file uploads, and integration with cloud services. The backend is built using **Node.js**, **Express**, and **MongoDB**.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)


---

## Features

- **User Authentication**: Secure user login and registration using JWT and bcrypt.
- **File Uploads**: Support for uploading files via Multer and storing them on Cloudinary.
- **Database Integration**: Data storage and management using MongoDB and Mongoose.
- **Cross-Origin Resource Sharing**: CORS support for secure API access.
- **Environment Configuration**: Easy configuration with dotenv.

---

## Technologies Used

- **Node.js**: Backend runtime environment
- **Express**: Web framework
- **MongoDB**: Database for storing application data
- **Mongoose**: MongoDB object modeling for Node.js
- **Cloudinary**: Cloud service for file uploads
- **JWT**: JSON Web Tokens for secure user authentication
- **Bcrypt**: Password hashing
- **Multer**: Middleware for file handling
- **Cors**: Cross-origin resource sharing
- **Nodemon**: Development tool for automatic server restarts

---

## Installation

### Prerequisites

Ensure you have the following installed:

- **Node.js**: [Download and install Node.js](https://nodejs.org/)
- **MongoDB**: [Set up MongoDB](https://www.mongodb.com/try/download/community)
- **Cloudinary Account**: [Sign up for Cloudinary](https://cloudinary.com/)

### Steps to Install

1. Clone the repository:
   ```bash
   git clone https://github.com/chetanchandane/backend-project-nodejs.git
   cd backend-project-nodejs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and configure the following variables:
   ```
   PORT=8000
   MONGO_URI=mongodb://localhost:27017/webapp-clone
   ACCESS_TOKEN_SECRET=your_secret
   ACCESS_TOKEN_EXPIRY=Xd
   REFRESH_TOKEN_SECRET=your_secret
   REFRESH_TOKEN_EXPIRY=Yd
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The application will be available at:
   ```
   http://localhost:8000
   ```
---

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

---

