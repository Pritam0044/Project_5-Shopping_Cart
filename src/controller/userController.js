const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const { uploadFile } = require('../utils/awsUpload');
const { isValidRequestBody, lnameValidator, fnameValidator, isValid, isValidStringTrim, isValidPhone, isValidEmail,isValidObjectId,} = require('../utils/validation');
const jwt = require('jsonwebtoken')









/////////////////////////////////////// [ creating user ] ///////////////////////

let createUser = async (req, res) => {

    try {
        let files = req.files

        if (!Object.keys(req.body).length > 0) {
            return res.status(400).send({ status: false, message: "Request body can't be empty." })
        }

        if (!Object.keys(files).length > 0) {
            return res.status(400).send({ status: false, message: "User image must be required." })
        }

        if (!Object.keys(req.body.data).length > 0) {
            return res.status(400).send({ status: false, message: "User details must be required in body." })
        }

        let data = JSON.parse(req.body.data)

        let { fname, lname, email, phone, password, address } = data

        if (!Object.keys(data).length > 0) {
            return res.status(400).send({ status: false, message: "User details is requried." })

        } else if (!fname) {
            return res.status(400).send({ status: false, message: "First name must be requried" })

        } else if (!lname) {
            return res.status(400).send({ status: false, message: "Last name must be requried" })

        } else if (!email) {
            return res.status(400).send({ status: false, message: "Email must be requried" })

        } else if (!phone) {
            return res.status(400).send({ status: false, message: "Phone must be requried" })

        } else if (!password) {
            return res.status(400).send({ status: false, message: "Password must be requried" })

        } else if (!address) {
            return res.status(400).send({ status: false, message: "Address must be requried" })

        } else if (!address.shipping && !address.billing) {
            return res.status(400).send({ status: false, message: "Shipping and billing address both are requried" })

        } else if (!address.shipping) {
            return res.status(400).send({ status: false, message: "Shipping address must be requried" })

        } else if (!address.billing) {
            return res.status(400).send({ status: false, message: "Billing address must be requried" })

        } else if (!address.shipping.street) {
            return res.status(400).send({ status: false, message: "shipping address's street must be requried" })

        } else if (!address.shipping.city) {
            return res.status(400).send({ status: false, message: "shipping address's city must be requried" })

        } else if (!address.shipping.pincode) {
            return res.status(400).send({ status: false, message: "shipping address's pincode must be requried" })

        } else if (!address.billing.street) {
            return res.status(400).send({ status: false, message: "billing address's street must be requried" })

        } else if (!address.billing.city) {
            return res.status(400).send({ status: false, message: "billing address's city must be requried" })

        } else if (!address.billing.pincode) {
            return res.status(400).send({ status: false, message: "billing address's pincode must be requried" })

        } else if (address != undefined) {
            if (address.shipping.street != undefined) {
                if (typeof address.shipping.street != 'string' || address.shipping.street.trim().length == 0) {
                    return res.status(400).send({ status: false, message: "shipping address's street can not be an empty string" })
                }
            }
            if (address.shipping.city != undefined) {
                if (typeof address.shipping.city != 'string' || address.shipping.city.trim().length == 0) {
                    return res.status(400).send({ status: false, message: "shipping address's city can not be an empty string" })
                }
            }

            if (address.shipping.pincode != undefined) {
                if (address.shipping.pincode.trim().length != 6) {
                    return res.status(400).send({ status: false, message: "shipping address's Pincode can not be an empty string or must be 6 digit number " })
                }
            }
            if (address.billing.street != undefined) {
                if (typeof address.billing.street != 'string' || address.billing.street.trim().length == 0) {
                    return res.status(400).send({ status: false, message: "billing street can not be an empty string" })
                }
            }
            if (address.billing.city != undefined) {
                if (typeof address.billing.city != 'string' || address.billing.city.trim().length == 0) {
                    return res.status(400).send({ status: false, message: "billing city can not be an empty string" })
                }
            }

            if (address.billing.pincode != undefined) {
                if (address.billing.pincode.toString().trim().length == 0 || address.billing.pincode.toString().trim().length != 6) {
                    return res.status(400).send({ status: false, message: "billing Pincode can not be an empty string or must be 6 digit number " })
                }
            }
        }


        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "email id must be valid format" })

        } if (!isValidPhone(phone)) {
            return res.status(400).send({ status: false, message: "phone no must be valid format" })

        }

        let EmailIdINDB = await userModel.findOne({ email })
        if (EmailIdINDB) {
            return res.status(400).send({ status: false, message: "Email id. already registered" })
        }

        let phoneNoInDB = await userModel.findOne({ phone })
        if (phoneNoInDB) {
            return res.status(400).send({ status: false, message: "phoneNo. number already registered" })
        }

        if (password.length < 8) {
            return res.status(400).send({ status: false, message: "Your password must be at least 8 characters" })
        }
        if (password.length > 15) {
            return res.status(400).send({ status: false, message: "Password cannot be more than 15 characters" })
        }
       
        const hash = bcrypt.hashSync(password, 10 );
        data.password = hash;

        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let image = await uploadFile(files[0])
            
            data.profileImage = image;
        } else{
            return res.status(400).send({ status: false, message: "image file not found" })
        }

        let allData = await userModel.create(data)
        return res.status(201).send({ status: true, message: "User created successfully", data: allData })


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//////////////////////////////////////////////////////   [ User login ]   ////////////////////////////////////////////////////

const userLogin = async  (req, res) => {

    try {

        let body = req.body
        let { email, password } = body

        if (!isValidRequestBody(body)) {
            return res.status(400).send({ status: false, message: "body must be present !!" })
        } else if (!email) {
            return res.status(400).send({ status: false, message: "email must be present" })

        } else if (!password) {
            return res.status(400).send({ status: false, message: "password must be present" })

        } else if (isValidStringTrim(password)) {
            return res.status(400).send({ status: false, message: "password cannot be empty" })

        } else if (isValidStringTrim(email)) {
            return res.status(400).send({ status: false, message: "email cannot be empty" })

        } else if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "email must be valid formate" })

        }

        let checkEmail = await userModel.findOne({ email: email })
        if (!checkEmail) {
            return res.status(404).send({ status: false, message: "Email not registered yet"})
        }

        let checkPassword = await bcrypt.compare(password, checkEmail.password)

        if (!checkPassword) {
            return res.status(404).send({ status: false, message: "Please check password and try again" })
        }

        let token = jwt.sign({
            userLogin: checkEmail._id.toString(),
            Organizations: "function_group_18_uranium",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60)
        }, "key@$%&*0101")

        res.setHeader("x-auth-token", token)
        return res.status(200).send({ status: true, message: "User login successfull", data: { userId: checkEmail._id, token } })

    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}



///////////////////////////////////////////////////// [ get details ]  /////////////////////////////////////////////////////

let getDetails = async (req, res) => {

    try {

        let user_id = req.params.userId;

        var isValid = isValidObjectId(user_id);
        if (isValid == false) {
            return res.status(400).send({ status: false, message: "please provide valid userId" });
        }
        let userDetails = await userModel.findById(user_id);
        if (!userDetails) {
            return res.status(404).send({ status: false, message: "User not found!" });
        }

        res.status(200).send({ status:true, message: "User profile details", data: userDetails, });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

};
////////////////////////////////////////////////   [ update user ]   ///////////////////////////////////////////////////

const updateUser = async function (req, res) {

    try {
        let userId = req.params.userId;
        let body = req.body.data
        let files = req.files
      
        let bodyData = JSON.parse(body) // convert the multi-part data from string to an object
        if (!bodyData) {
            return res.status(400).send({ status: false, msg: "body value must be present if want to update" })
        }
        let { fname, lname, email, phone, password, address } = bodyData
        

        if (!isValidObjectId(userId)) {
            return res.status(404).send({ status: false, msg: "user Id not valid" })
        }

        let checkUser = await userModel.findById(userId)

        if (!checkUser) {
            return res.status(404).send({ status: false, msg: "No user found with this userId" })
        }

        if (fname) {
            if (isValidStringTrim(fname)) {
                return res.status(400).send({ status: false, msg: "Please Provide fname & can't be a empty string" })
            }

            if (!fnameValidator.test(fname.trim())) {
                return res.status(400).send({ status: false, message: "fname must be in valid format" })
            }
        }


        if (lname) {

            if (isValidStringTrim(lname)) {
                return res.status(400).send({ status: false, message: "Please Provide lname can't be a empty string" })
            }

            if (!lnameValidator.test(lname.trim())) {
                return res.status(400).send({ status: false, message: "lname must be in valid format" })
            }
        }

        if (email) {

            if (isValidStringTrim(email)) {
                return res.status(400).send({ status: false, message: "Please Provide Email can't be a empty string" })
            }

            if (!isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "Email id must be valid format" })
            }

            let find = await userModel.findOne({ email: email })
            if (find) {
                return res.status(400).send({ status: false, message: "Already exist please enter another email" })
            }
        }

        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let p = await uploadFile(files[0])
            bodyData.profileImage = p;
        } else if (!files) {
            return res.status(400).send({ status: false, message: "Please upload profile image" })
        }

        if (phone) {

            if (isValidStringTrim(phone)) {
                return res.status(400).send({ status: false, message: "Please Provide phone number can not be a empty string" })
            }

            if (!isValidPhone(phone)) {
                return res.status(400).send({ status: false, message: "phone number must be valid format 10 digits" })
            }

            let find = await userModel.findOne({ phone: phone })
            if (find) {
                return res.status(400).send({ status: false, message: "Already exist please enter another phone" })
            }
        }

        if (password) {

            if (isValidStringTrim(password)) {
                return res.status(400).send({ status: false, message: "Please Provide password & can not be a empty string" })
            }

            if (password.length < 8) {
                return res.status(400).send({ status: false, message: "Your password must be at least 8 characters" })
            }
            if (password.length > 15) {
                return res.status(400).send({ status: false, message: "Password cannot be more than 15 characters" })
            }

            
            const hash = bcrypt.hashSync(password, 10);
            bodyData.password = hash;
        }

        if (address) {
            if (isValid(address))
                return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });


            let tempAddress = checkUser.address

            // console.log(address)

            if (address.shipping) {

                if (isValid(bodyData.address.shipping))
                    return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });
                if (address.shipping.street) {
                    if (isValidStringTrim(address.shipping.street)) {
                        return res.status(400).send({ status: false, message: "shipping street can not be a empty string" })
                    }

                    tempAddress.shipping.street = address.shipping.street

                }

                if (address.shipping.city) {
                    if (isValidStringTrim(address.shipping.city)) {
                        return res.status(400).send({ status: false, message: "shipping city can not be a empty string" })
                    }

                    tempAddress.shipping.city = address.shipping.city
                }

                if (address.shipping.pincode) {
                    if (address.shipping.pincode.toString().trim().length != 6) {
                        return res.status(400).send({ status: false, message: "shipping Pincode can not be a empty string or must be 6 digit number " })
                    }

                    tempAddress.shipping.pincode = address.shipping.pincode
                }}

                if (address.billing){
                   
                if (address.billing.street) {
                    if (isValidStringTrim(address.billing.street)) {
                        return res.status(400).send({ status: false, message: "billing street can not be a empty string" })
                    }

                    tempAddress.billing.street = address.billing.street

                }

                if (address.billing.city ) {
                    if (isValidStringTrim(address.billing.city)) {
                        return res.status(400).send({ status: false, message: "billing city can not be a empty string" })
                    }

                    tempAddress.billing.city = address.billing.city
                }

                if (address.billing.pincode) {
                    if (address.billing.pincode.toString().trim().length != 6) {
                        return res.status(400).send({ status: false, message: "billing Pincode can not be a empty string or must be 6 digit number " })
                    }

                    tempAddress.billing.pincode = address.billing.pincode
                }
            }

            bodyData.address = tempAddress;
        }

        let updatedUser = await userModel.findOneAndUpdate({ _id: userId }, bodyData, { new: true })

        return res.status(200).send({ status: true, msg: " user have been updated successfully ", data: updatedUser })

    }

    catch (err) {

        res.status(500).send({ status: false, message: err.message })
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


module.exports = { createUser, getDetails, userLogin, updateUser }




