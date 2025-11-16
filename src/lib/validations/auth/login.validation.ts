import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

// Define the register form schema
export const RegisterSchema = z.object({
  fullname: z.string().min(1, {
    message: "*",
  }),
  email: z.string().email({
    message: "*",
  }),
  password: z.string().min(6, {
    message: "*",
  }),
  position: z.string().min(1, {
    message: "*",
  }),
});
