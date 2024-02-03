export const shuffle = <T>(arr: T[]) => {
  let count = arr.length,
    temp,
    index;

  while (count > 0) {
    index = Math.floor(Math.random() * count);
    count--;

    temp = arr[count];
    arr[count] = arr[index];
    arr[index] = temp;
  }

  return arr;
};
