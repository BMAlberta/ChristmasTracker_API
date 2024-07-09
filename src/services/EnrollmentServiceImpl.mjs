import bcrypt from 'bcryptjs';
import security from '../config/crypto.mjs';
import otpGenerator from 'otp-generator';
import OTPModel from '../models/otp.mjs';
import UserModel from '../models/user.mjs';
import { logger, LogMessage } from '../config/winston.mjs';
import Joi from '@hapi/joi';


// Error Code Root: 100

// Error Sub Code: 1
async function enrollUser(session, reqBody) {
    //Validate input
    let input = enrollValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed.')
    }
    //Check if email is registered
    let emailRegistered = await isEmailRegistered(reqBody.email)
    if (emailRegistered === true) {
        throw Error('Email is already registered.')
    }

    try {
        //Save details to session
        saveEnrollmentSession(session, reqBody)
        //Generate OTP code
        const otpCode = generateOTPCodeForEnrollment(reqBody.email)
        //Return OTP
        return otpCode

    } catch (err) {
        throw Error('OTP Generation failed: ' + err)
    }
}

// Error Sub Code: 2
async function validateEmail(session, reqBody) {

    //Decrypt the token
    let rawTokenData = security.decrypt(reqBody.verificationKey)
    let verificationInfo = JSON.parse(rawTokenData)

    //Validate email
    let providedEmail = session.details.enrollment.userInfo.email
    let expectedEmail = verificationInfo.check
    const isEmailValid = providedEmail === expectedEmail

    if (isEmailValid === false) {
        logger.info("%o", new LogMessage("EnrollmentServieImpl", "validateEmail", "Emails do not match", {
            "expectedEmail": expectedEmail, "providedEmail": providedEmail
        }))
        throw Error('Emails do not match.')
    }

    try {
        //Validate OTP
        await validateOTP(reqBody, verificationInfo)
    } catch (err) {
        throw Error('Failed to validate OTP')
    }

    //Update session
    session.details.enrollment.verified = true
    await session.save()
    return session

}

// Error Sub Code: 3
async function resendEmailValidation(reqBody) {
}


// Error Sub Code: 4
async function createPassword(session, reqBody) {
    const userValidated = session.details.enrollment.verified

    if (!userValidated) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "resendEmailValidation", "User session not verified"))
        throw Error('User session not verified.')
    }

    let input = newPasswordValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed ' + input.error)
    }

    let combinedUserInfo = {
        "email": session.details.enrollment.userInfo.email,
        "firstName": session.details.enrollment.userInfo.fName,
        "lastName": session.details.enrollment.userInfo.lName,
        "password": reqBody.confirmPassword
    }

    try {
        let newUser = await createUser(combinedUserInfo)
        await session.destroy()
        return newUser
    } catch (err) {
        throw err
    }
}

// Error Sub Code: 5
async function enrollUserWithAccessCode(reqBody) {
    let inputValidated = newUserWithAccessKeyValidation(reqBody)
    if (inputValidated.error) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "enrollUserWithAccessCode", "100.5.1: Input validation failed.", {
            "error": inputValidated.error.message
        }))
        throw Error("100.5.1")
    }

    let passwordsMatch = newPasswordValidation(reqBody)
    if (passwordsMatch.error) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "enrollUserWithAccessCode", "100.5.2: Password validation failed.", {
            "error": passwordsMatch.error.message
        }))
        throw Error("100.5.2")
    }

    //Check if email is registered
    let emailRegistered = await isEmailRegistered(reqBody.email)
    if (emailRegistered === true) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "enrollUserWithAccessCode", "100.5.3: Email address already registered."))
        throw Error("100.5.3")
    }



    if (reqBody.accessKey !== process.env.BASIC_ENROLLMENT_ACCESS_KEY) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "enrollUserWithAccessCode", "100.5.4: Access Key validation failed."))
        throw Error("100.5.4")
    }

    let combinedUserInfo = {
        "email": reqBody.email,
        "firstName": reqBody.firstName,
        "lastName": reqBody.lastName,
        "password": reqBody.confirmPassword
    }

    try {
        let newUser = await createUser(combinedUserInfo)
        return newUser
    } catch (err){
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "enrollUserWithAccessCode", "100.5.5: User creation failed.", {
            "error": err
        }))
        throw Error("100.5.5")
    }
}

// Error Sub Code: 6
async function createUser(user) {
    let input = newUserValidation(user)

    if (input.error) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "createUser", "100.6.1: Input validation failed.", {
            "error": input.error
        }))
        throw Error("100.5.4")
    }

    var saltedPassword = ""
    try {
        const salt = await bcrypt.genSalt(10)
        saltedPassword = await bcrypt.hash(user.password, salt)

        const newUser = new UserModel({
            email: user.email, firstName: user.firstName, lastName: user.lastName, pwd: saltedPassword
        })

        const saveResult = await newUser.save()
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "createUser", "User successfully created.", {
            "userId": saveResult._id
        }))
        return saveResult._id
    } catch (err) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "createUser", "Failed to save user.", {
            "error": err.message
        }))
        throw err
    }
}

// Error Sub Code: 7
async function isEmailRegistered(emailAddress) {
    try {
        const fetchResult = await UserModel.findOne({
            email: emailAddress
        })

        if (fetchResult) {
            logger.info("%o", new LogMessage("EnrollmentServiceImpl", "isEmailRegistered", "Email already exists.", {
                "userInfo": emailAddress
            }))
            return true
        }
        return false
    } catch (err) {
        return false
    }
}

// Error Sub Code: 8
async function saveEnrollmentSession(session, details) {
    session.details = {
        userAuthenticated: false, enrollment: {
            inProgress: true, userInfo: {
                email: details.email, fName: details.firstName, lName: details.lastName
            }
        }
    }

    try {
        await session.save()
    } catch (err) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "saveEnrollmentSession", "Session generation failed.", {
            "userId": req.body.email, "error": err
        }))
    }
}

// Error Sub Code: 9
async function generateOTPCodeForEnrollment(emailAddress) {

    const otpCode = otpGenerator.generate(6, {
        upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false
    })

    const generatationDate = new Date()
    const expirationDate = AddMinutesToDate(generatationDate, 10)

    const otpModel = new OTPModel({
        otpCode: otpCode, expirationDate: expirationDate, createDate: generatationDate
    })

    try {
        const otpEntry = await otpModel.save()

        var details = {
            "timestamp": generatationDate,
            "check": emailAddress,
            "success": true,
            "message": "OTP sent to user",
            "otp_id": otpEntry._id
        }
        const flattenedModel = JSON.stringify(details)
        const encodedOTPModel = security.encrypt(flattenedModel)

        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "generateOTPCodeForEnrollment", "MFA sent to email.", {
            "details": details
        }))
        return encodedOTPModel
    } catch (err) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "generateOTPCodeForEnrollment", "OTP generation failed.", {
            "userId": emailAddress, "error": err
        }))
    }
}

// Error Sub Code: 10
async function validateOTP(details, verificationInfo) {
    try {
        let storedOTP = await OTPModel.findById(verificationInfo.otp_id)

        const otpMismatch = details.otp !== storedOTP.otpCode
        if (otpMismatch) {
            logger.info("%o", new LogMessage("EnrollmentServiceImpl", "validateOTP", "OTP codes do not match", {
                "expectedOTP": storedOTP.otpCode, "providedOTP": details.otp
            }))
            throw Error('OTP codes do not match.')
        }

        if (Date() > storedOTP.expirationDate) {
            logger.info("%o", new LogMessage("EnrollmentServiceImpl", "validateOTP", "OTP expired", {
                "expirationDate": storedOTP.expirationDate
            }))
            throw Error('OTP expired.')
        }

        if (storedOTP.verified) {
            logger.info("%o", new LogMessage("EnrollmentServiceImpl", "validateOTP", "OTP already used."))
            throw Error('OTP already used.')
        }

        await OTPModel.findByIdAndUpdate({
            _id: storedOTP._id
        }, {
            verified: true, lastUpdateDate: Date.now()
        })

        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "validateOTP", "OTP validated."))

    } catch (err) {
        logger.info("%o", new LogMessage("EnrollmentServiceImpl", "validateOTP", "Unknown error occurred."))
        throw Error('Unable to validate OTP code.')
    }
}

function AddMinutesToDate(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function enrollValidation(data) {
    const schema = Joi.object({
        firstName: Joi.string().min(3).max(255).required(),
        lastName: Joi.string().min(3).max(255).required(),
        email: Joi.string().min(12).max(255).required()
    })
    return schema.validate(data);
}

function newPasswordValidation(data) {
    const schema = Joi.object({
        newPassword: Joi.string().min(8).max(32).required(),
        confirmPassword: Joi.string().required().valid(Joi.ref('newPassword')),
    }).unknown(true);
    return schema.validate(data)
}

function newUserValidation(data) {
    const schema = Joi.object({
        firstName: Joi.string().min(3).max(255).required(),
        lastName: Joi.string().min(3).max(255).required(),
        email: Joi.string().min(12).max(255).required(),
        password: Joi.string().min(6).max(32).required(),
    })
    return schema.validate(data);
}

function newUserWithAccessKeyValidation(data) {
    const schema = Joi.object({
        firstName: Joi.string().min(3).max(255).required(),
        lastName: Joi.string().min(3).max(255).required(),
        email: Joi.string().min(12).max(255).required(),
        newPassword: Joi.string().min(6).max(32).required(),
        confirmPassword: Joi.string().min(6).max(32).required(),
        accessKey: Joi.string().min(8).max(8).required(),
    })
    return schema.validate(data);
}


export default {enrollUser, validateEmail, resendEmailValidation, createPassword, enrollUserWithAccessCode};