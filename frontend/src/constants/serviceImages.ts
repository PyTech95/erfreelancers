// AI-generated branded illustrations, one per service (keyed by service id).
const BASE = 'https://static.prod-images.emergentagent.com/jobs/9ddd7a98-5aaa-4288-b1eb-3234724a1b64/images';

export const SERVICE_IMAGES: Record<string, string> = {
  S01: `${BASE}/cd29bfa2afb404d31bd33b9ad671e4177e333ba33386ba903589245cae3235da.jpeg`,
  S02: `${BASE}/5a4ce97d1c85bf33f3b807cc742f63cc89546e48071014e1de4bc5ba1a95e5c0.jpeg`,
  S03: `${BASE}/771e7f397239c56839847e30d5598468ba3ec84ebc9898e5d4803f238c666f95.jpeg`,
  S04: `${BASE}/b9e22c98d556bcd2c8c8abe355ddae63da7b424d55372d699ff481d10dcb83aa.jpeg`,
  S05: `${BASE}/5ebd77ffb23cd85d78e85eb0c16c6bd5ab4660910b98e574fb3091e0820b0c46.jpeg`,
  S06: `${BASE}/e287df3834f8554957e3c2a4b217da47508e9e81898f5738bcdf0316708ec556.jpeg`,
  S07: `${BASE}/8b4bc92411983c37f00180020569ec326e8a7865f27d02b86f1fd19874eae3b5.jpeg`,
  S08: `${BASE}/1f61e2951e2119a666663c380d67a0109982f9386c1381a24314038e9bb0d2e8.jpeg`,
  S09: `${BASE}/ea6d4b8d54422b204c30314e16d76ddebd3bc66a9c706c17fe090fa713323d96.jpeg`,
  S10: `${BASE}/27527da8e864dc811f6ef5e1f308755338390ababa8405303e28c57a40a8e328.jpeg`,
  S11: `${BASE}/2700ad130e7e0dd24381110affb9b678fe10dbb9b1ddaf2615fdd8e31fca7ffa.jpeg`,
  S12: `${BASE}/5a204a1090c1d0d5e93a59bead55b6a2534b8c7f253e47d00fbee49915e0252a.jpeg`,
  S13: `${BASE}/3b3f1e0d37433c566e141f73d40c123c9b019ddac64ec5bd7b6f47b19b9c00d3.jpeg`,
  S14: `${BASE}/15cd5c7ae928ceb0ffd7e873045c7afa68976f089dbc56df83947d00556256ee.jpeg`,
};

export const serviceImage = (id: string) => SERVICE_IMAGES[id] || SERVICE_IMAGES.S01;
