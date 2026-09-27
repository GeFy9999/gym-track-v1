import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const BRAND_DARK = "#191714";

async function main() {
  // App icon — the existing "GT" maskable mark is already square with safe
  // padding; just upscale it to the 1024x1024 capacitor-assets recommends.
  await sharp(path.join(root, "public/icon512_maskable.png"))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(root, "resources/icon.png"));

  // Splash screen — the full wordmark centered on the app's dark brand
  // background (matches the welcome screen / headers throughout the app).
  const logo = await sharp(path.join(root, "public/LogoGymsTrack5.webp"))
    .resize({ width: 1200 })
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const canvasSize = 2732;
  const top = Math.round((canvasSize - (logoMeta.height ?? 0)) / 2);
  const left = Math.round((canvasSize - (logoMeta.width ?? 0)) / 2);

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: BRAND_DARK,
    },
  })
    .composite([{ input: logo, top, left }])
    .png()
    .toFile(path.join(root, "resources/splash.png"));

  console.log("Generated resources/icon.png and resources/splash.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
