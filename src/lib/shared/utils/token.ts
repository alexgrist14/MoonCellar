export const isTokenExpired = (time:number):boolean =>{
    const currentTime = Math.floor(Date.now()/1000);
    return time < currentTime;
}