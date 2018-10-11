type Hash = { [key: string]: any }

export const calculateChangedBits = (prev: Hash, next: Hash) => {
  let result = 0;
  if (!prev || !next) {
    return 0xFFFFFF;
  }
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  const keys = prevKeys.length > nextKeys.length ? prevKeys : nextKeys;

  keys
    .forEach((key, index) => {
      if (prev[key] !== next[key]) {
        result |= 1 << (index % 31);
      }
    });
  
  return result;
};

export const getBits = (obj: Hash, set: Set<any>) => {
  let result = 0;
  const keys = Object.keys(obj);

  keys.forEach((key, index) => {
    if (set.has(key)) {
      result |= 1 << (index % 31);
    }
  });

  return result
};