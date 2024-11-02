import { getCookie } from "@/src/lib/shared/utils/cookies";
import { useRouter } from "next/router";
import { FC, useEffect } from "react";
import { useAuthStore } from "../lib/shared/store/auth.store";

const User:FC = ()=>{
    const { userName } = useAuthStore();
    const router = useRouter();

    useEffect(()=>{
        if(userName !== undefined){
            router.push(`/user/${userName}`)
        }else{
            router.push('/auth/login')
        }
    },[userName])
    return null;
}

export default User;