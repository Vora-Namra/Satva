import { Request, response, Response } from "express";
import { stat } from "node:fs";
import { success } from "zod";
import { fi } from "zod/locales";

interface GeneralResponseOptions {
  // req: Request;
  res: Response;
  data?: unknown;
  message?: string;
  statusCode?: number;
}

// interface GetResponseOptions{
//     req:Request,
//     res:Response,
//     filepath:string,
// }

export function generalResponse({ 
    res,
    data=null,
    message='Success',
    statusCode=200
 }:GeneralResponseOptions):Response{
    const responseBody:Record<string,unknown>={
        statusCode,
        message,
        data
    }
    return res.status(statusCode).json(responseBody)
 };


//  export function getResponse({res,filepath}:GetResponseOptions){
//     return res.render(filepath)
//  }