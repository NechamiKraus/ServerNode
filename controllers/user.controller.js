const Router = require('express');
const userService = require('../services/user.service')
const router = Router();

//login - connect
// router.post("/login/actor",async(req,res)=>{
//     await connectActor(req.body.email,req.body.password,callback);
//   });
//   router.post("/login/coach",async(req,res)=>{
//     await connectUser(req.body.email,req.body.password,res);
//   });
//   router.post("/login/director",async(req,res)=>{
//     await connectUser(req.body.email,req.body.password,res);
//   });
//   router.post("/login/provider",async(req,res)=>{
//     await connectUser(req.body.email,req.body.password,res);
//   });
//   router.post("/login/manager",async(req,res)=>{
//     await connectUser(req.body.email,req.body.password,res);
//   });


// add candidate
router.post("/join",async (req , res ) => {
    const {name, phone, email, password ,publicPassword } = req.body;
    try {
        await userService.addCandidate(name, phone, email, password, publicPassword);
        res.status(200).send('Candidate added succsefuly!')

    } catch (error) {
        res.status(400).send(`failed to add condidate: ${error.message}`);
    }
});

// login manager - התחברות
router.post("/login/manager", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await userService.connectManager(email, password);

        const { statusCode, message, id, token } = result;

        if (statusCode === 200) {
            res.header("auth-token", token).status(statusCode).send({ token ,id });
        } else {
            res.status(statusCode).json({ message });
        }
    } 
    catch (error) {
        res.status(400).json({ message: `an error occurred while logging in: ${error.message}` });
    }
});

// login director - התחברות
router.post("/login/director", async (req,res)=>{
    const {email , password } = req.body;
    try {
        const result = await userService.connectDirector(email, password);

        const { statusCode, message, id, token } = result;

        if (statusCode === 200) {
            res.header("auth-token", token).status(statusCode).send({ token ,id });
        } else {
            res.status(statusCode).json({ message });
        }
    } 
    catch (error) {
        res.status(400).json({ message: `an error occurred while logging in: ${error.message}` });
    }
});

module.exports = router;