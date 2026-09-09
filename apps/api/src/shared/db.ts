import { Model } from "mongoose";

export const getCount = async <T>(model: Model<T>) => {
  console.log(`${model.modelName}: ${await model.countDocuments({})}`);
};

export const updateOrInsertValues = <T>(model: Model<T>, items: unknown) => {
  return model.bulkWrite(
    (items as (T & { id: number })[]).map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { ...item, id: undefined, _id: item.id } },
        upsert: true,
      },
    })) as Parameters<Model<T>["bulkWrite"]>[0]
  );
};
