import { extractCoordinatesFromText, parseGoogleMapsUrl } from '../src/utils/geo';

const cases: Array<{ name: string; input: string; expect: [number, number] | null }> = [
  {
    name: 'place URL with !3d!4d (pin wins over @ center)',
    input: 'https://www.google.com/maps/place/X/@24.8607,67.0011,17z/data=!3m1!4b1!4m6!3d24.8615!4d67.0099',
    expect: [24.8615, 67.0099],
  },
  { name: '@lat,lng,zoom path', input: 'https://www.google.com/maps/@24.8607,67.0011,15z', expect: [24.8607, 67.0011] },
  { name: 'q=lat,lng', input: 'https://maps.google.com/?q=24.8607,67.0011', expect: [24.8607, 67.0011] },
  { name: 'll=lat,lng', input: 'https://www.google.com/maps?ll=31.5204,74.3587&z=12', expect: [31.5204, 74.3587] },
  { name: 'dir destination', input: 'https://www.google.com/maps/dir/?api=1&destination=24.8,67.0', expect: [24.8, 67.0] },
  { name: 'bare lat,lng', input: '24.8607, 67.0011', expect: [24.8607, 67.0011] },
  { name: 'non-coordinate q (place name)', input: 'https://maps.google.com/?q=Eiffel+Tower', expect: null },
  { name: 'garbage', input: 'hello world', expect: null },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const got = extractCoordinatesFromText(c.input);
  const ok = c.expect === null
    ? got === null
    : !!got && Math.abs(got.latitude - c.expect[0]) < 1e-6 && Math.abs(got.longitude - c.expect[1]) < 1e-6;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name} -> ${got ? `${got.latitude},${got.longitude}` : 'null'}`);
  ok ? pass++ : fail++;
}

(async () => {
  // Best-effort live short-link test (needs network; ok if it fails).
  const short = process.env.SHORT_LINK;
  if (short) {
    const got = await parseGoogleMapsUrl(short);
    console.log(`\nShort link ${short} -> ${got ? `${got.latitude},${got.longitude}` : 'null (could not resolve)'}`);
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})();
