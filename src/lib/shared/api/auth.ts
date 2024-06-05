import axios from "axios";

export const singup = async (email: string, username: string, password: string): Promise<void>=>{
    try{
     
        const data = JSON.stringify({
            email:email,
            username:username,
            password:password
        })

        const config = {
            method: "post",
            url: `https://gigatualet.ru:3228/auth/signup`,
            headers: {
              "Content-Type": "application/json",
            },
            data: data,
          };


        await axios.request(config);
    }catch(err){
        return;
    }
}