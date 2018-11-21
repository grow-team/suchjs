import { encodeRegexpChars } from './helpers/utils';

export const splitor = ':';
export const encodeSplitor = encodeRegexpChars(splitor);
export const suchRule = new RegExp(`^${encodeSplitor}([A-Za-z]\\w*)`);
