import { User } from "../models/User.js";


 // For reuseable ERror handler
let errorHandling = async (res, err) => {    
     res.status(500).json({
            status: false,
            message: "Internal Server Error!",
            error: err.message
        });
     }


export let CreateUser = async (req, res) => {
    try {
        const { UserName, UserEmail, PhoneNumber, Message } = req.body || {};

        if (!UserName || !UserEmail || !PhoneNumber || !Message) {
            return res.status(400).json({
                message: "All fields are required.",
                status: false
            });
        }

        const user = await User.create({ UserName, UserEmail, PhoneNumber, Message });

        if (!user) {
            return res.status(404).json({
                message: "User was not created!",
                status: false
            });
        }

        return res.status(201).json({
            message: "User is Created Successfully!",
            status: true,
            data: user
        });
    } catch (err) {
        return await errorHandling(res);
    }
};


export let ViewUser = async (req, res) => {
    try {

        let UserView = await User.findAll()

        if (UserView.length === 0) {
            return res.status(404).json(
                {
                    message : "User not found !",
                    status : false,
                }
            )
        }

        // console.log(UserView)
        res.status(302).json(
            {
                status : true,
                Data : UserView
            }
        )
        
    } catch (err) {
        return await errorHandling(res, err)
}

}

export let GetUsreById = async (req, res) => {
    try {
        
        const {id} = await req.params;
        const user = await User.findByPk(id)

         if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }


    } catch (error) {
        return await errorHandling(res, error)
    }
}

// export let DeleteUser = async (req, res) => {
//     try {
        
//         const param = await req.params;
//         console.log(param, ' : params in delete user !! ')

//     } catch (error) {
//         return await errorHandling(res)
//     }
// }