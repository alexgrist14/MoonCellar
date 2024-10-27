import { getCookie } from "@/src/lib/shared/utils/getCookie";
import { useRouter } from "next/router";
import { FC, useEffect } from "react";
import { useAuthStore } from "../lib/shared/store/auth.store";

const User:FC = ()=>{
    const { userId } = useAuthStore();
    const router = useRouter();

    useEffect(()=>{
        if(userId !== undefined){
            router.push(`/user/${userId}`)
        }else{
            router.push('/auth/login')
        }
    },[userId])
    return null;
}

export default User;