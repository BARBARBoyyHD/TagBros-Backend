import { Response } from "express";

export interface Json {
  success: boolean;
  data: any;
}

export interface CustomResponse extends Response {
  json: (body: Json) => this; // Ensure `.json()` returns `this` for chaining
}