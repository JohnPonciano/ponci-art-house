/* Fotos do Unsplash (licença Unsplash) usadas nas áreas institucionais. Crédito exigido pelas regras da API. */
export const PHOTOS = {
 "galeria": {
  "by": "Jessica Pamp",
  "user": "yessijes",
  "page": "https://unsplash.com/photos/a-group-of-people-standing-in-front-of-a-painting-JNTSoyb_bbw"
 },
 "atelie": {
  "by": "Avi Richards",
  "user": "avirichards",
  "page": "https://unsplash.com/photos/man-in-white-and-blue-crew-neck-t-shirt-wearing-black-sunglasses-PfUH_AuFE_0"
 },
 "sala": {
  "by": "Lotus Design N Print",
  "user": "lotusdnp",
  "page": "https://unsplash.com/photos/a-living-room-with-a-black-couch-and-a-table-with-a-vase-with-flowers-on-it-Nl1cP1Tr2oU"
 },
 "abs-azul": {
  "by": "Steve A Johnson",
  "user": "steve_j",
  "page": "https://unsplash.com/photos/abstract-art-painting-eVaxJVA2zHI"
 },
 "abs-escura": {
  "by": "Vojtech Bruzek",
  "user": "vojtechbruzek",
  "page": "https://unsplash.com/photos/blue-white-and-yellow-abstract-painting-zMl9PjGFPWg"
 },
 "artista": {
  "by": "Muhammad Rahim Ali",
  "user": "ramitvofficial",
  "page": "https://unsplash.com/photos/a-woman-holding-a-bunch-of-paint-brushes-NRBBze-P0Sc"
 },
 "visita": {
  "by": "Zalfa Imani",
  "user": "zalfaimani",
  "page": "https://unsplash.com/photos/woman-standing-in-front-of-paintings-DeTWuVp6prg"
 }
} as const;
export type PhotoKey = keyof typeof PHOTOS;
