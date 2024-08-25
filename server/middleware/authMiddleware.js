const jwt = require('jsonwebtoken');

require('dotenv').config({ path: './config/.env' }); // Adjust the path as necessary

const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';

module.exports = (req, res, next) => {

     // Extract the token from the Authorization header
     const authHeader = req.headers['authorization'];
    
     // Check if the token exists and starts with "Bearer "
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return res.status(403).json({ message: 'No token provided or invalid token format' });
     }
 
     // Remove the "Bearer " part from the token
     const token = authHeader.split(' ')[1];
 
     try {

        console.log("token: ", token)

         // Verify the token
         const decoded = jwt.verify(token, jwtSecret);

         console.log("decoded: ", decoded)

 
         // Attach the decoded user ID to the request object
         req.userId = decoded.userId;
 
         console.log("req.userId: ",  req.userId)

         // Continue to the next middleware or route handler
         next();
     } catch (error) {
         // Handle any errors during token verification
         return res.status(401).json({ message: 'Failed to authenticate token' });
     }

};
