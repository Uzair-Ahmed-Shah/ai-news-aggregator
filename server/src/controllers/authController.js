const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma.js')



const register = async (req, res) => {
    try{
        const {name, email, password} = req.body

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

        if (!email || !password || !name){
            return res.status(400).json({"error":"Name, Email and Password are required"})
        }else if (!emailRegex.test(email)){
            return res.status(400).json({"error": "Invalid email. Email should only include (a-z, A-Z, 0-9, dot, @)"})
        }else if (!passwordRegex.test(password)){
            return res.status(400).json({"error":"Password must be at least 8 characters long and contain both uppercase and lowercase letters."})
        }

        const userExist = await prisma.user.findUnique({
            where : {
                email,
            }
        })

        if (userExist){
            return res.status(400).json({"error": "User already exists"})
        }
        const hashPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashPassword
            }
        })

        const token = jwt.sign(
            {userId: newUser.id},
            process.env.JWT_SECRET,
            { expiresIn : '1d'}
        )

        return res.status(201).json({
            "message":"User created", 
            token,
            user: { name: newUser.name, email: newUser.email }
        })
    }catch(err) {
        return res.status(500).json({"error": `Error - ${err}`})
    }
}

const login = async(req, res) => {
    // res.json({"message":"work in progress"})
    try {
        const {email, password} = req.body

        if (!email || !password) {
            return res.status(400).json({ error: "Email and Password are required" });
        }

        const user = await prisma.user.findUnique({
            where :{email,}
        })

        if (!user){
            return res.status(400).json({"error":"User not found"})
        }
        const validPassword = await bcrypt.compare(password, user.password);

        if(!validPassword){
            return res.status(400).json({"error":"Invalid Password"})
        }

        const token = jwt.sign(
            {userId: user.id},
            process.env.JWT_SECRET,
            { expiresIn : '1d'}
        )

        res.status(200).json({
            'message': 'Login Successful', 
            token,
            user: { name: user.name, email: user.email }
        })

    }catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
}

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ user });
    } catch (err) {
        console.error("GET ME ERROR:", err);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
}

module.exports = { register , login, getMe }