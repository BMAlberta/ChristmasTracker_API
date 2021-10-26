const Joi = require("@hapi/joi");

const registerValidation = (data) => {
    const schema = Joi.object({
        firstName: Joi.string().min(3).max(255).required(),
        lastName: Joi.string().min(3).max(255).required(),
        email: Joi.string().min(12).max(255).required(),
        password: Joi.string().min(6).max(1024).required(),
    })
  return schema.validate(data);
};

const loginValidation = (data) => {
  console.log(data)
    const schema = Joi.object({
      email: Joi.string().min(12).max(255).required(),
      password: Joi.string().min(6).max(1024).required(),
    });

    return schema.validate(data);
  };

  const passwordValidation = (data) => {
    console.log(data)
    const schema = Joi.object({
      oldPassword: Joi.string(),
      newPassword: Joi.string().min(6).max(1024).required(),
    });

    return schema.validate(data)
  };

module.exports = {
    registerValidation,
    loginValidation,
    passwordValidation
};
