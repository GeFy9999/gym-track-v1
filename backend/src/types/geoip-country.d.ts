declare module "geoip-country" {
  type Lookup = { country: string; currency: string[] } | null;
  const geoip: { lookup(ip: string): Lookup };
  export default geoip;
}
