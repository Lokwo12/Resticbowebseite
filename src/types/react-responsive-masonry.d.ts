declare module "react-responsive-masonry" {
  import * as React from "react";

  export interface MasonryProps {
    columnsCount?: number;
    gutter?: string | number;
    className?: string;
    children?: React.ReactNode;
  }

  export interface ResponsiveMasonryProps {
    columnsCountBreakPoints?: Record<number, number>;
    className?: string;
    children?: React.ReactNode;
  }

  export const ResponsiveMasonry: React.FC<ResponsiveMasonryProps>;
  const Masonry: React.FC<MasonryProps>;

  export default Masonry;
}
