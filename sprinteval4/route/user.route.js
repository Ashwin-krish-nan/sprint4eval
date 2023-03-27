const express = require("express")
const {UserModel} = require("../model/user.model")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const user_route = express.Router()

user_route.post("/signup",async (req,res)=>{
    const {name,email,pass} = req.body
    try {
        bcrypt.hash(pass,4 ,async (err,secure_pass)=>{
            if(err){
                console.log(err);
                res.send("something went wrong")
            }else{
                const user = new UserModel({name, email, pass:secure_pass})
                await user.save()
                res.send("Signup successfull")
            }
        })
    } catch (error) {
        res.send("error in register the user")
        console.log(error);
    }
})

user_route.post("/login",async (req,res)=>{
    const {email,pass} = req.body
    try {
        const user = await UserModel.findOne({email})
        if(!user){
            res.send("please signup first")
            // console.log("yghfh");
        }else{
            const hash_pass = user?.pass
            bcrypt.compare(pass, hash_pass, (err,result)=>{
                if(result){
                    const normal_token = jwt.sign({userID:user._id},"Masai")
                    res.send({msg:"login success",  normal_token})

                }else{
                    res.send("something went wrong, login again")
                }
            })
        }
       
    } catch (error) {
        res.send("error in login the user")
        console.log(error);
    }
})



module.exports = {user_route}