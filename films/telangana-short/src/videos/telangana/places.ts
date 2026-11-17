// Where everything stands. The old river is the lake (Hussain Sagar, z -30..30); the near quay is the Tank Bund
// promenade; the old city runs inland along the street x = 0 with the four-minaret gate across it. The village,
// the round parliament building and the coal mine are separate sets far out on the plain (fog hides them from town).
export type XZ = [number, number];
export const QUAY_Z = -33.2;            // Tank Bund promenade centre line (quay surface z -36.5..-30)
export const GATE: XZ = [0, -112];      // the four-minaret gate across the street (our own design, Charminar-like)
export const GATE_W = 20;               // footprint side
export const SHOPS = [-50, -55, -60];   // shop fronts with rolling shutters on the west side of the street (x = -6, facing +x)
export const BUS: XZ = [2.6, -78];      // where the bus stops (heading -z toward the gate)
export const LAMP_WIN: [number, number, number] = [-6.02, 4.3, -88]; // the one lit window of the quiet street (shot "quiet")
export const CANOPY: XZ = [30, -34.2];  // hunger-strike canopy on the promenade
export const VIL: XZ = [-520, -460];    // village centre: the teaching tree
export const BOARD: XZ = [VIL[0] + 3.2, VIL[1] - 1.2]; // chalkboard
export const CHAIR: XZ = [VIL[0] + 1.6, VIL[1] - 0.6]; // the professor's chair
export const BK: XZ = [VIL[0] - 14, VIL[1] + 12];      // Bathukamma courtyard
export const FIELDS: XZ = [VIL[0] + 10, VIL[1] + 60];  // paddy fields south of the village
export const DELHI: XZ = [520, -460];   // the round parliament building
export const MINE: XZ = [520, 470];     // coal mine
