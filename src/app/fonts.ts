import { Instrument_Serif, Inter, Newsreader } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// The Now section carries what is happening right now, so it is set apart from
// the body face rather than merely bolded. Exported under a role name, not a
// typeface name, so trying a different one is a single-line change here rather
// than a hunt through the components.
export const nowFont = Newsreader({
  subsets: ["latin"],
  display: "swap",
});
