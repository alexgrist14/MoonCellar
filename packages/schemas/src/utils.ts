import z from "zod";

export const transformBoolean = () =>
  z
    .union([z.string(), z.boolean()])
    .transform((val) =>
      typeof val === "boolean"
        ? val
        : ["false", "0", "no"].includes(val.toLowerCase())
          ? false
          : Boolean(val)
    )
    .optional();

export const ObjectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid id");
