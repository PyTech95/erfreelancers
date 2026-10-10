/** Individual locations use country-first URLs; /locations/ remains the directory. */
export function publicPath(path: string): string {
  return path.startsWith('/locations/') && path.slice('/locations/'.length).split(/[?#]/)[0]
    ? path.slice('/locations'.length)
    : path;
}
