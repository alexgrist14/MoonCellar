import { NextRequest, NextResponse } from "next/server";

export const middleware = (request:NextRequest)=>{
    let cookie = request.cookies.get('refresh_token');
    //store.dispatch(setAuth({isAuth: true}))
    //console.log(cookie)
    //return NextResponse.redirect(new URL('/home',request.url))
}