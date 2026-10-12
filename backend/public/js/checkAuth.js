const PATHNAME='/login';

const isAccessed=()=>{
const accessToken=window.localStorage.getItem('accessToken')


if(!accessToken || accessToken=="" || accessToken==undefined){
const currentUrl=new URL(window.location.href)
window.location.href=currentUrl.origin+PATHNAME
}
}

isAccessed()