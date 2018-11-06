export interface NormalObject {
  [index: string]: any;
}
export type valueof<T> = T[keyof T];
export type PrototypeMethodNames<T> = {[K in keyof T]: T[K] extends () => void ? K : never; }[keyof T];
