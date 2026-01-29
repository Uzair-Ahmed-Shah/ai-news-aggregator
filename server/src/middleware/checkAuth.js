const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
    try{
    const authHeader = req.headers['authorization']

    if (!authHeader || !(authHeader.startsWith('Bearer'))){
      return res.status(401).json({ "error": "No token provided" })
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err){
            return res.status(403).json({ "error": "Invalid or expired token" })
        }
        else{
            req.userData = decoded;
            next(); 
        }
    })
    
    }catch (err) {
        return res.status(401).json({"message": "Authentication Failed"})
    }
}