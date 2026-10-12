import { Request,Response,NextFunction } from "express";
import { HttpException } from "../helpers/http-exception.js";
import { HttpStatus } from "../constants/http.constants.js";



export function errorMiddleware(
    error:HttpException|Error, 
    req:Request,
    res:Response,
    _next:NextFunction,
):void{
    console.log(error)
    const statusCode=error instanceof HttpException?error.statusCode:HttpStatus.INTERNAL_SERVER_ERROR;
    const message=error.message || 'Internal server Error';


    res.status(statusCode).json({
        success:false,
        message,
    })
}