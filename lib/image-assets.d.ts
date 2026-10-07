declare module "*.PNG" {
  const image: import("next/image").StaticImageData;
  export default image;
}
