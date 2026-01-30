const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma.js')

const register = async (req, res) => {
    try{
        const {email, password} = req.body

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

        if (!email || !password){
            return res.status(400).json({"error":"Email and Password are required"})
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
                email,
                password: hashPassword
            }
        })

        return res.status(201).json({"message":"User created", "userId":newUser.id})
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

        res.status(200).json({'message': 'Login Successful', token})

    }catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
}

module.exports = { register , login}