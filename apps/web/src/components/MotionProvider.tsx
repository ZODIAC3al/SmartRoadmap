"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Loads Framer Motion's animation features on demand.
 *
 * Importing `motion` pulls the whole ~121 kB library into the first load of
 * every route that animates anything. `LazyMotion` ships a tiny renderer up
 * front and fetches the feature bundle separately, so the initial payload only
 * carries what is needed to paint.
 *
 * `domAnimation` covers animate / initial / exit / variants / whileHover /
 * whileTap / whileInView — everything this app uses. It deliberately excludes
 * layout animations and drag; if a component ever needs those, swap this for
 * `domMax` rather than reaching back for the full `motion` import.
 *
 * `strict` makes the full `motion.div` throw, which is the point: it guarantees
 * a missed conversion fails loudly in development instead of silently
 * reintroducing the full bundle. Use `m.div` in components.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
