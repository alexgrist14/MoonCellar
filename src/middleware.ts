import { NextRequest, NextResponse } from "next/server";
import { store } from "./lib/app/store";
import { setAuth } from "./lib/app/store/slices/authSlice";

export const middleware = (request:NextRequest)=>{
    let cookie = request.cookies.get('refresh_token');
    //store.dispatch(setAuth({isAuth: true}))
    //console.log(cookie)
    //return NextResponse.redirect(new URL('/home',request.url))
}